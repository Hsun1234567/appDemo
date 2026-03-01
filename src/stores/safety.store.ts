/**
 * 安全设置 Store
 * 管理紧急联系人列表（最多 5 个）、报警短信模板、报警模式选择。
 * 所有数据通过 storageRepository 持久化到本地存储。
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { EmergencyContact, AlarmMode, AlarmTemplate } from '@/models/types'
import { storageRepository } from '@/repositories/storage.repo'
import { isValidPhoneNumber, isValidTemplateLength } from '@/utils/validator'
import { hasMissingGPSPlaceholder } from '@/utils/template'

/** Storage keys */
const CONTACTS_KEY = 'emergency_contacts'
const TEMPLATE_KEY = 'alarm_template'
const MODE_KEY = 'alarm_mode'

/** Max number of emergency contacts */
const MAX_CONTACTS = 5

/** Default alarm template content */
const DEFAULT_TEMPLATE_CONTENT =
  '【紧急求助】我正处于危险中，当前位置：{GPS位置}，请立即联系我或报警。'

/** Default alarm mode */
const DEFAULT_MODE: AlarmMode = 'full'

/** Template max length */
const TEMPLATE_MAX_LENGTH = 200

/** Generate a simple UUID */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useSafetyStore = defineStore('safety', () => {
  // ── State ──
  const contacts = ref<EmergencyContact[]>([])
  const alarmTemplate = ref<AlarmTemplate>({
    content: DEFAULT_TEMPLATE_CONTENT,
    updatedAt: Date.now(),
  })
  const alarmMode = ref<AlarmMode>(DEFAULT_MODE)
  const isInitialized = ref(false)

  // ── Computed ──
  const contactList = computed(() => contacts.value)
  const canAddContact = computed(() => contacts.value.length < MAX_CONTACTS)
  const hasContacts = computed(() => contacts.value.length > 0)
  const templateMissingGPS = computed(() => hasMissingGPSPlaceholder(alarmTemplate.value.content))

  // ── Persistence ──
  async function loadContacts(): Promise<void> {
    const stored = await storageRepository.get<EmergencyContact[]>(CONTACTS_KEY, [])
    contacts.value = stored ?? []
  }

  async function saveContacts(): Promise<void> {
    await storageRepository.set(CONTACTS_KEY, contacts.value)
  }

  async function loadTemplate(): Promise<void> {
    const stored = await storageRepository.get<AlarmTemplate>(TEMPLATE_KEY)
    if (stored) {
      alarmTemplate.value = stored
    }
  }

  async function saveTemplate(): Promise<void> {
    await storageRepository.set(TEMPLATE_KEY, alarmTemplate.value)
  }

  async function loadMode(): Promise<void> {
    const stored = await storageRepository.get<AlarmMode>(MODE_KEY)
    if (stored) {
      alarmMode.value = stored
    }
  }

  async function saveMode(): Promise<void> {
    await storageRepository.set(MODE_KEY, alarmMode.value)
  }

  // ── Initialize ──
  async function init(): Promise<void> {
    if (isInitialized.value) return
    await loadContacts()
    await loadTemplate()
    await loadMode()
    isInitialized.value = true
  }

  // ── Contact operations ──

  /**
   * 添加紧急联系人。
   * 验证手机号格式，超出上限时阻止添加。
   * 返回 { success, message }。
   */
  async function addContact(
    name: string,
    phone: string,
  ): Promise<{ success: boolean; message: string }> {
    if (contacts.value.length >= MAX_CONTACTS) {
      return { success: false, message: `最多添加 ${MAX_CONTACTS} 个紧急联系人` }
    }
    if (!isValidPhoneNumber(phone)) {
      return { success: false, message: '手机号码格式错误' }
    }

    const now = Date.now()
    const contact: EmergencyContact = {
      id: generateId(),
      name,
      phone,
      createdAt: now,
      updatedAt: now,
    }
    contacts.value.push(contact)
    await saveContacts()
    return { success: true, message: '添加成功' }
  }

  /**
   * 更新紧急联系人信息。
   * 验证手机号格式，无效时阻止保存。
   */
  async function updateContact(
    id: string,
    updates: { name?: string; phone?: string },
  ): Promise<{ success: boolean; message: string }> {
    const index = contacts.value.findIndex((c) => c.id === id)
    if (index === -1) {
      return { success: false, message: '联系人不存在' }
    }

    if (updates.phone !== undefined && !isValidPhoneNumber(updates.phone)) {
      return { success: false, message: '手机号码格式错误' }
    }

    const contact = contacts.value[index]
    if (updates.name !== undefined) contact.name = updates.name
    if (updates.phone !== undefined) contact.phone = updates.phone
    contact.updatedAt = Date.now()

    await saveContacts()
    return { success: true, message: '更新成功' }
  }

  /**
   * 删除紧急联系人。
   */
  async function removeContact(id: string): Promise<{ success: boolean; message: string }> {
    const index = contacts.value.findIndex((c) => c.id === id)
    if (index === -1) {
      return { success: false, message: '联系人不存在' }
    }
    contacts.value.splice(index, 1)
    await saveContacts()
    return { success: true, message: '删除成功' }
  }

  // ── Template operations ──

  /**
   * 更新报警短信模板内容。
   * 验证长度不超过 200 字符。
   */
  async function updateTemplate(
    content: string,
  ): Promise<{ success: boolean; message: string; missingGPS: boolean }> {
    if (!isValidTemplateLength(content)) {
      return {
        success: false,
        message: `模板长度不能超过 ${TEMPLATE_MAX_LENGTH} 个字符`,
        missingGPS: hasMissingGPSPlaceholder(content),
      }
    }

    alarmTemplate.value = {
      content,
      updatedAt: Date.now(),
    }
    await saveTemplate()

    const missingGPS = hasMissingGPSPlaceholder(content)
    return {
      success: true,
      message: missingGPS ? '保存成功，建议包含位置信息以便他人定位' : '保存成功',
      missingGPS,
    }
  }

  /**
   * 重置模板为默认内容。
   */
  async function resetTemplate(): Promise<void> {
    alarmTemplate.value = {
      content: DEFAULT_TEMPLATE_CONTENT,
      updatedAt: Date.now(),
    }
    await saveTemplate()
  }

  // ── Mode operations ──

  /**
   * 切换报警模式，立即持久化。
   */
  async function setAlarmMode(mode: AlarmMode): Promise<void> {
    alarmMode.value = mode
    await saveMode()
  }

  // ── Alarm readiness check ──

  /**
   * 检查是否可以启用报警功能。
   * 空联系人列表时返回 false 并附带提示。
   */
  function canEnableAlarm(): { enabled: boolean; message: string } {
    if (!hasContacts.value) {
      return { enabled: false, message: '请先添加至少一个紧急联系人' }
    }
    return { enabled: true, message: '' }
  }

  return {
    // State
    contacts,
    alarmTemplate,
    alarmMode,
    isInitialized,

    // Computed
    contactList,
    canAddContact,
    hasContacts,
    templateMissingGPS,

    // Actions
    init,
    addContact,
    updateContact,
    removeContact,
    updateTemplate,
    resetTemplate,
    setAlarmMode,
    canEnableAlarm,
  }
})
