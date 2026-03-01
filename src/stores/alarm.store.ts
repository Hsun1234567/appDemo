/**
 * 报警响应 Store
 * 接收 BLE 报警信号后，按顺序执行报警响应流程。
 * 根据报警模式（完整/静默/震慑）执行对应操作。
 * 任一步骤失败时记录失败信息，继续执行后续步骤（容错机制）。
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AlarmRecord,
  AlarmStepResult,
  AlarmMode,
  EmergencyContact,
  GPSLocation,
} from '@/models/types'
import { useSafetyStore } from '@/stores/safety.store'
import { LocationService } from '@/services/location.service'
import { SMSService } from '@/services/sms.service'
import { PhoneService } from '@/services/phone.service'
import { NotificationService } from '@/services/notification.service'
import { AudioService } from '@/services/audio.service'
import { sqliteRepository } from '@/repositories/sqlite.repo'
import { render } from '@/utils/template'

/** Generate a UUID v4 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Service singletons */
const locationService = new LocationService()
const smsService = new SMSService()
const phoneService = new PhoneService()
const notificationService = new NotificationService()
const audioService = new AudioService()

export const useAlarmStore = defineStore('alarm', () => {
  // ── State ──
  const isAlarming = ref(false)

  // ── Helpers ──

  /** Create a step result entry */
  function stepResult(
    step: AlarmStepResult['step'],
    success: boolean,
    error?: string,
  ): AlarmStepResult {
    return { step, success, error, timestamp: Date.now() }
  }

  /** Format a GPS location as a readable string for SMS */
  function formatLocation(loc: GPSLocation | null): string {
    if (!loc) return '位置获取失败'
    const base = `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`
    return loc.address ? `${loc.address} (${base})` : base
  }

  /** Format current time string */
  function formatTime(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  // ── Core alarm flow ──

  /**
   * 执行报警响应流程。
   * 按顺序：获取 GPS → 读取联系人 → 发送短信 → 拨打电话 → 存储记录 → 显示通知
   * 根据报警模式决定执行哪些步骤。
   * 每步 try/catch，失败记录后继续。
   */
  async function executeAlarmResponse(deviceId: string): Promise<AlarmRecord> {
    isAlarming.value = true

    const safetyStore = useSafetyStore()
    const mode: AlarmMode = safetyStore.alarmMode
    const stepResults: AlarmStepResult[] = []
    let location: GPSLocation | null = null
    let contacts: EmergencyContact[] = []

    // ── Step 1: 获取 GPS 位置 ──
    try {
      location = await locationService.getCurrentLocation()
      stepResults.push(stepResult('gps', location !== null, location ? undefined : 'GPS 定位返回空'))
    } catch (err: any) {
      stepResults.push(stepResult('gps', false, err?.message ?? String(err)))
    }

    // ── Step 2: 读取联系人 ──
    try {
      contacts = [...safetyStore.contacts]
      stepResults.push(stepResult('readContacts', true))
    } catch (err: any) {
      stepResults.push(stepResult('readContacts', false, err?.message ?? String(err)))
    }

    // ── Step 3: 发送短信（完整模式 & 静默模式） ──
    if (mode === 'full' || mode === 'silent') {
      try {
        const template = safetyStore.alarmTemplate.content
        const smsContent = render(template, {
          gpsLocation: formatLocation(location),
          time: formatTime(),
          userName: '',
        })

        let allSuccess = true
        const errors: string[] = []
        for (const contact of contacts) {
          const ok = await smsService.sendSMS(contact.phone, smsContent)
          if (!ok) {
            allSuccess = false
            errors.push(`发送至 ${contact.name}(${contact.phone}) 失败`)
          }
        }
        stepResults.push(
          stepResult('sendSMS', allSuccess, errors.length > 0 ? errors.join('; ') : undefined),
        )
      } catch (err: any) {
        stepResults.push(stepResult('sendSMS', false, err?.message ?? String(err)))
      }
    } else {
      // 震慑模式跳过短信
      stepResults.push(stepResult('sendSMS', true))
    }

    // ── Step 4: 拨打电话（仅完整模式） ──
    if (mode === 'full') {
      try {
        let allSuccess = true
        const errors: string[] = []
        for (const contact of contacts) {
          const ok = await phoneService.makeCall(contact.phone)
          if (!ok) {
            allSuccess = false
            errors.push(`拨打 ${contact.name}(${contact.phone}) 失败`)
          }
        }
        stepResults.push(
          stepResult('makeCall', allSuccess, errors.length > 0 ? errors.join('; ') : undefined),
        )
      } catch (err: any) {
        stepResults.push(stepResult('makeCall', false, err?.message ?? String(err)))
      }
    } else {
      // 静默模式和震慑模式跳过电话
      stepResults.push(stepResult('makeCall', true))
    }

    // ── 声光报警（完整模式 & 震慑模式） ──
    if (mode === 'full' || mode === 'deterrent') {
      try {
        audioService.playAlarmSound()
      } catch (_err) {
        // 声光报警失败不影响流程
      }
    }

    // ── Step 5: 存储报警记录 ──
    const record: AlarmRecord = {
      id: generateUUID(),
      triggeredAt: Date.now(),
      location,
      alarmMode: mode,
      contactsNotified: contacts,
      stepResults: [], // will be filled below
      deviceId,
    }

    try {
      // Add saveRecord step before persisting
      stepResults.push(stepResult('saveRecord', true))
      record.stepResults = stepResults
      await sqliteRepository.insertAlarmRecord(record)
    } catch (err: any) {
      // Replace the optimistic saveRecord step with failure
      const idx = stepResults.findIndex((s) => s.step === 'saveRecord')
      if (idx >= 0) {
        stepResults[idx] = stepResult('saveRecord', false, err?.message ?? String(err))
      }
      record.stepResults = stepResults
    }

    // ── Step 6: 显示通知 ──
    try {
      await notificationService.pushLocal('报警触发', '报警响应流程已执行，请查看详情。')
      stepResults.push(stepResult('notification', true))
    } catch (err: any) {
      stepResults.push(stepResult('notification', false, err?.message ?? String(err)))
    }

    // Update record with final step results
    record.stepResults = stepResults

    isAlarming.value = false
    return record
  }

  /** 取消报警（停止声光） */
  function cancelAlarm(): void {
    audioService.stopAlarmSound()
    isAlarming.value = false
  }

  return {
    // State
    isAlarming,

    // Actions
    executeAlarmResponse,
    cancelAlarm,
  }
})
