/**
 * 辅助功能 Store
 * 管理安全计时器、模拟来电、安全知识库三大辅助功能。
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { SafetyTimerState, FakeCallConfig, KnowledgeArticle } from '@/models/types'
import { useAlarmStore } from '@/stores/alarm.store'
import { NotificationService } from '@/services/notification.service'
import { storageRepository } from '@/repositories/storage.repo'
import knowledgeArticles from '@/static/knowledge/articles.json'

/** Storage keys */
const FAKE_CALL_CONFIG_KEY = 'fake_call_config'

/** Preset timer durations in milliseconds */
export const PRESET_DURATIONS = [
  { label: '15 分钟', ms: 15 * 60 * 1000 },
  { label: '30 分钟', ms: 30 * 60 * 1000 },
  { label: '1 小时', ms: 60 * 60 * 1000 },
  { label: '2 小时', ms: 2 * 60 * 60 * 1000 },
]

/** Preset fake call delay options in seconds */
export const FAKE_CALL_DELAYS = [
  { label: '立即', seconds: 0 },
  { label: '30 秒', seconds: 30 },
  { label: '1 分钟', seconds: 60 },
  { label: '5 分钟', seconds: 300 },
]

/** 5 minutes in ms – warning threshold before timer expires */
const WARNING_THRESHOLD_MS = 5 * 60 * 1000

/** Default fake call config */
const DEFAULT_FAKE_CALL_CONFIG: FakeCallConfig = {
  callerName: '妈妈',
  delaySeconds: 0,
}

const notificationService = new NotificationService()

export const useUtilityStore = defineStore('utility', () => {

  // ═══════════════════════════════════════════
  // ── Safety Timer (安全计时器) ──
  // ═══════════════════════════════════════════

  const timerState = ref<SafetyTimerState>({
    isRunning: false,
    durationMs: 0,
    startedAt: 0,
    remainingMs: 0,
  })

  /** Internal interval handle for countdown tick */
  let tickInterval: ReturnType<typeof setInterval> | null = null
  /** Whether the 5-minute warning notification has been sent */
  let warningSent = false

  /** Computed: formatted remaining time (mm:ss or hh:mm:ss) */
  const formattedRemaining = computed(() => {
    const ms = timerState.value.remainingMs
    if (ms <= 0) return '00:00'
    const totalSec = Math.ceil(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  })

  /**
   * 启动安全计时器。
   * @param durationMs 计时时长（毫秒），必须 > 0
   */
  function startTimer(durationMs: number): void {
    if (durationMs <= 0) return
    // Stop any existing timer first
    stopTimerInternal()

    const now = Date.now()
    timerState.value = {
      isRunning: true,
      durationMs,
      startedAt: now,
      remainingMs: durationMs,
    }
    warningSent = false

    tickInterval = setInterval(() => {
      tickTimer()
    }, 1000)
  }

  /** Internal tick – updates remaining time, sends warning, triggers alarm on expiry */
  function tickTimer(): void {
    if (!timerState.value.isRunning) return

    const elapsed = Date.now() - timerState.value.startedAt
    const remaining = Math.max(timerState.value.durationMs - elapsed, 0)
    timerState.value.remainingMs = remaining

    // 5-minute warning notification
    if (!warningSent && remaining > 0 && remaining <= WARNING_THRESHOLD_MS) {
      warningSent = true
      notificationService.pushLocal(
        '安全计时器提醒',
        '安全计时器将在 5 分钟内到期，请及时取消或确认安全。',
      )
    }

    // Timer expired – trigger alarm
    if (remaining <= 0) {
      timerState.value.isRunning = false
      timerState.value.remainingMs = 0
      clearTickInterval()
      triggerTimerAlarm()
    }
  }

  /** Trigger alarm response when timer expires */
  async function triggerTimerAlarm(): Promise<void> {
    try {
      const alarmStore = useAlarmStore()
      await alarmStore.executeAlarmResponse('safety-timer')
    } catch (err: any) {
      console.error('[UtilityStore] 安全计时器触发报警失败:', err?.message ?? err)
    }
  }

  /**
   * 取消安全计时器，立即停止并取消待触发报警。
   */
  function cancelTimer(): void {
    stopTimerInternal()
  }

  /** Internal helper to clean up timer state */
  function stopTimerInternal(): void {
    clearTickInterval()
    timerState.value = {
      isRunning: false,
      durationMs: 0,
      startedAt: 0,
      remainingMs: 0,
    }
    warningSent = false
  }

  function clearTickInterval(): void {
    if (tickInterval !== null) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }

  // ═══════════════════════════════════════════
  // ── Fake Call (模拟来电) ──
  // ═══════════════════════════════════════════

  const fakeCallConfig = ref<FakeCallConfig>({ ...DEFAULT_FAKE_CALL_CONFIG })
  const isFakeCallPending = ref(false)
  const isFakeCallActive = ref(false)

  /** Timeout handle for delayed fake call */
  let fakeCallTimeout: ReturnType<typeof setTimeout> | null = null

  /** Load fake call config from storage */
  async function loadFakeCallConfig(): Promise<void> {
    const stored = await storageRepository.get<FakeCallConfig>(FAKE_CALL_CONFIG_KEY)
    if (stored) {
      fakeCallConfig.value = stored
    }
  }

  /** Save fake call config to storage */
  async function saveFakeCallConfig(): Promise<void> {
    await storageRepository.set(FAKE_CALL_CONFIG_KEY, fakeCallConfig.value)
  }

  /**
   * 更新模拟来电配置。
   */
  async function updateFakeCallConfig(config: Partial<FakeCallConfig>): Promise<void> {
    if (config.callerName !== undefined) {
      fakeCallConfig.value.callerName = config.callerName
    }
    if (config.delaySeconds !== undefined) {
      fakeCallConfig.value.delaySeconds = config.delaySeconds
    }
    await saveFakeCallConfig()
  }

  /**
   * 触发模拟来电。
   * 根据配置的延迟时间，延迟后显示全屏来电界面。
   */
  function triggerFakeCall(): void {
    cancelFakeCall()

    const delayMs = fakeCallConfig.value.delaySeconds * 1000

    if (delayMs <= 0) {
      activateFakeCall()
      return
    }

    isFakeCallPending.value = true
    fakeCallTimeout = setTimeout(() => {
      isFakeCallPending.value = false
      activateFakeCall()
    }, delayMs)
  }

  /** Activate the fake call screen */
  function activateFakeCall(): void {
    isFakeCallActive.value = true
    // Navigate to fake call page
    uni.navigateTo({ url: '/pages/fake-call/index' })
  }

  /**
   * 取消待触发的模拟来电。
   */
  function cancelFakeCall(): void {
    if (fakeCallTimeout !== null) {
      clearTimeout(fakeCallTimeout)
      fakeCallTimeout = null
    }
    isFakeCallPending.value = false
  }

  /**
   * 结束模拟来电（挂断）。
   */
  function endFakeCall(): void {
    isFakeCallActive.value = false
  }

  // ═══════════════════════════════════════════
  // ── Knowledge Base (安全知识库) ──
  // ═══════════════════════════════════════════

  /** All articles loaded from static JSON */
  const articles = ref<KnowledgeArticle[]>(knowledgeArticles as KnowledgeArticle[])

  /** Valid knowledge categories */
  const CATEGORIES = ['travel', 'home', 'emergency'] as const

  /** Category display names */
  const categoryLabels: Record<string, string> = {
    travel: '出行安全',
    home: '居家安全',
    emergency: '应急自救',
  }

  /**
   * 按分类获取文章列表。
   */
  function getArticlesByCategory(category: KnowledgeArticle['category']): KnowledgeArticle[] {
    return articles.value.filter((a) => a.category === category)
  }

  /**
   * 关键词搜索文章（匹配标题和内容）。
   * 返回标题或内容中包含关键词的文章。
   */
  function searchArticles(keyword: string): KnowledgeArticle[] {
    if (!keyword || !keyword.trim()) return articles.value
    const kw = keyword.trim().toLowerCase()
    return articles.value.filter(
      (a) =>
        a.title.toLowerCase().includes(kw) ||
        a.content.toLowerCase().includes(kw) ||
        a.keywords.some((k) => k.toLowerCase().includes(kw)),
    )
  }

  /**
   * 根据 ID 获取单篇文章。
   */
  function getArticleById(id: string): KnowledgeArticle | undefined {
    return articles.value.find((a) => a.id === id)
  }

  // ═══════════════════════════════════════════
  // ── Init ──
  // ═══════════════════════════════════════════

  async function init(): Promise<void> {
    await loadFakeCallConfig()
  }

  return {
    // ── Timer ──
    timerState,
    formattedRemaining,
    startTimer,
    cancelTimer,

    // ── Fake Call ──
    fakeCallConfig,
    isFakeCallPending,
    isFakeCallActive,
    loadFakeCallConfig,
    updateFakeCallConfig,
    triggerFakeCall,
    cancelFakeCall,
    endFakeCall,

    // ── Knowledge ──
    articles,
    CATEGORIES,
    categoryLabels,
    getArticlesByCategory,
    searchArticles,
    getArticleById,

    // ── Init ──
    init,
  }
})
