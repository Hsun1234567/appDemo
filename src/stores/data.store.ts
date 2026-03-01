/**
 * 本地数据 Store
 * 管理报警历史记录（查询、详情、单条删除、批量删除）、
 * 事件日志（查询、清除）、设置导出备份与导入恢复。
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AlarmRecord, EventLog, BackupData, FakeCallConfig } from '@/models/types'
import { sqliteRepository } from '@/repositories/sqlite.repo'
import { storageRepository } from '@/repositories/storage.repo'
import { isValidBackupFile } from '@/utils/validator'
import { useSafetyStore } from '@/stores/safety.store'
import { useDeviceStore } from '@/stores/device.store'

/** Backup format version */
const BACKUP_VERSION = '1.0.0'

/** Storage key for fake call config */
const FAKE_CALL_CONFIG_KEY = 'fake_call_config'

/** Default fake call config */
const DEFAULT_FAKE_CALL_CONFIG: FakeCallConfig = {
  callerName: '妈妈',
  delaySeconds: 0,
}

export const useDataStore = defineStore('data', () => {
  // ── State ──
  const alarmRecords = ref<AlarmRecord[]>([])
  const alarmRecordCount = ref(0)
  const eventLogs = ref<EventLog[]>([])
  const isLoading = ref(false)

  // ── Alarm Records ──

  /** 查询报警历史记录（分页） */
  async function loadAlarmRecords(page = 1, pageSize = 20): Promise<AlarmRecord[]> {
    isLoading.value = true
    try {
      const records = await sqliteRepository.getAlarmRecords(page, pageSize)
      alarmRecords.value = records
      alarmRecordCount.value = await sqliteRepository.getAlarmRecordCount()
      return records
    } finally {
      isLoading.value = false
    }
  }

  /** 获取单条报警记录详情 */
  async function getAlarmRecordDetail(id: string): Promise<AlarmRecord | null> {
    // Search in current loaded records first
    const cached = alarmRecords.value.find((r) => r.id === id)
    if (cached) return cached

    // Fallback: load all records page by page to find it
    const count = await sqliteRepository.getAlarmRecordCount()
    const all = await sqliteRepository.getAlarmRecords(1, count || 1)
    return all.find((r) => r.id === id) ?? null
  }

  /** 删除单条报警记录 */
  async function deleteAlarmRecord(id: string): Promise<void> {
    await sqliteRepository.deleteAlarmRecords([id])
    alarmRecords.value = alarmRecords.value.filter((r) => r.id !== id)
    alarmRecordCount.value = await sqliteRepository.getAlarmRecordCount()
  }

  /** 批量删除报警记录 */
  async function deleteAlarmRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await sqliteRepository.deleteAlarmRecords(ids)
    const idSet = new Set(ids)
    alarmRecords.value = alarmRecords.value.filter((r) => !idSet.has(r.id))
    alarmRecordCount.value = await sqliteRepository.getAlarmRecordCount()
  }

  // ── Event Logs ──

  /** 查询事件日志（分页） */
  async function loadEventLogs(page = 1, pageSize = 50): Promise<EventLog[]> {
    isLoading.value = true
    try {
      const logs = await sqliteRepository.getEventLogs(page, pageSize)
      eventLogs.value = logs
      return logs
    } finally {
      isLoading.value = false
    }
  }

  /** 清除所有事件日志 */
  async function clearEventLogs(): Promise<void> {
    await sqliteRepository.clearEventLogs()
    eventLogs.value = []
  }

  // ── Backup Export ──

  /** 收集当前设置数据，生成 BackupData 对象 */
  async function collectBackupData(): Promise<BackupData> {
    const safetyStore = useSafetyStore()
    const deviceStore = useDeviceStore()

    // Ensure stores are initialized
    if (!safetyStore.isInitialized) await safetyStore.init()
    if (!deviceStore.isInitialized) await deviceStore.init()

    const fakeCallConfig = await storageRepository.get<FakeCallConfig>(
      FAKE_CALL_CONFIG_KEY,
      DEFAULT_FAKE_CALL_CONFIG,
    )

    return {
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      contacts: [...safetyStore.contacts],
      alarmTemplate: { ...safetyStore.alarmTemplate },
      alarmMode: safetyStore.alarmMode,
      pairedDevices: [...deviceStore.pairedDevices],
      fakeCallConfig: fakeCallConfig ?? DEFAULT_FAKE_CALL_CONFIG,
    }
  }

  /** 导出备份到文件 */
  async function exportBackup(): Promise<{ success: boolean; message: string; filePath?: string }> {
    try {
      const data = await collectBackupData()
      const json = JSON.stringify(data, null, 2)
      const fileName = `safety_alarm_backup_${Date.now()}.json`

      // #ifdef APP-PLUS
      return await exportBackupApp(json, fileName)
      // #endif

      // #ifdef H5
      return exportBackupH5(json, fileName)
      // #endif
    } catch (err: any) {
      return { success: false, message: err?.message ?? '导出失败' }
    }
  }

  // #ifdef APP-PLUS
  /** App 端：使用 plus.io 写入文件 */
  async function exportBackupApp(
    json: string,
    fileName: string,
  ): Promise<{ success: boolean; message: string; filePath?: string }> {
    return new Promise((resolve) => {
      plus.io.requestFileSystem(plus.io.PUBLIC_DOWNLOADS, (fs: any) => {
        fs.root.getFile(
          fileName,
          { create: true },
          (fileEntry: any) => {
            fileEntry.createWriter((writer: any) => {
              writer.onwrite = () => {
                resolve({
                  success: true,
                  message: '备份导出成功',
                  filePath: fileEntry.fullPath,
                })
              }
              writer.onerror = (e: any) => {
                resolve({ success: false, message: `写入文件失败: ${e?.message ?? e}` })
              }
              writer.write(json)
            }, (e: any) => {
              resolve({ success: false, message: `创建写入器失败: ${e?.message ?? e}` })
            })
          },
          (e: any) => {
            resolve({ success: false, message: `获取文件失败: ${e?.message ?? e}` })
          },
        )
      }, (e: any) => {
        resolve({ success: false, message: `访问文件系统失败: ${e?.message ?? e}` })
      })
    })
  }
  // #endif

  // #ifdef H5
  /** H5 端：通过 Blob 下载 */
  function exportBackupH5(
    json: string,
    fileName: string,
  ): { success: boolean; message: string } {
    try {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return { success: true, message: '备份导出成功' }
    } catch (err: any) {
      return { success: false, message: err?.message ?? '下载失败' }
    }
  }
  // #endif

  // ── Backup Import ──

  /** 导入备份文件 */
  async function importBackup(): Promise<{ success: boolean; message: string }> {
    try {
      // #ifdef APP-PLUS
      return await importBackupApp()
      // #endif

      // #ifdef H5
      return await importBackupH5()
      // #endif
    } catch (err: any) {
      return { success: false, message: err?.message ?? '导入失败' }
    }
  }

  // #ifdef APP-PLUS
  /** App 端：使用 uni.chooseMessageFile 选择文件，再用 plus.io 读取内容 */
  async function importBackupApp(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['.json'],
        success: (res: any) => {
          if (!res.tempFiles || res.tempFiles.length === 0) {
            resolve({ success: false, message: '未选择文件' })
            return
          }
          const filePath = res.tempFiles[0].path as string
          plus.io.resolveLocalFileSystemURL(
            filePath,
            (entry: any) => {
              entry.file((file: any) => {
                const reader = new plus.io.FileReader()
                reader.onloadend = async (evt: any) => {
                  const content = evt.target.result as string
                  const result = await applyBackupData(content)
                  resolve(result)
                }
                reader.onerror = () => {
                  resolve({ success: false, message: '读取文件失败' })
                }
                reader.readAsText(file)
              }, () => {
                resolve({ success: false, message: '获取文件信息失败' })
              })
            },
            () => {
              resolve({ success: false, message: '解析文件路径失败' })
            },
          )
        },
        fail: () => {
          resolve({ success: false, message: '选择文件失败' })
        },
      })
    })
  }
  // #endif

  // #ifdef H5
  /** H5 端：通过 input[type=file] 上传 */
  async function importBackupH5(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'

      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          resolve({ success: false, message: '未选择文件' })
          return
        }
        const reader = new FileReader()
        reader.onload = async (e) => {
          const content = e.target?.result as string
          const result = await applyBackupData(content)
          resolve(result)
        }
        reader.onerror = () => {
          resolve({ success: false, message: '读取文件失败' })
        }
        reader.readAsText(file)
      }

      input.click()
    })
  }
  // #endif

  /** 验证并应用备份数据到当前设置 */
  async function applyBackupData(
    jsonString: string,
  ): Promise<{ success: boolean; message: string }> {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonString)
    } catch {
      return { success: false, message: '备份文件无效：JSON 格式错误' }
    }

    if (!isValidBackupFile(parsed)) {
      return { success: false, message: '备份文件无效：数据不完整或格式错误' }
    }

    const backup = parsed as BackupData

    try {
      const safetyStore = useSafetyStore()
      const deviceStore = useDeviceStore()

      // Overwrite emergency contacts
      await storageRepository.set('emergency_contacts', backup.contacts)
      safetyStore.contacts.splice(0, safetyStore.contacts.length, ...backup.contacts)

      // Overwrite alarm template
      await storageRepository.set('alarm_template', backup.alarmTemplate)
      safetyStore.alarmTemplate.content = backup.alarmTemplate.content
      safetyStore.alarmTemplate.updatedAt = backup.alarmTemplate.updatedAt

      // Overwrite alarm mode
      await storageRepository.set('alarm_mode', backup.alarmMode)
      safetyStore.alarmMode = backup.alarmMode

      // Overwrite paired devices
      await storageRepository.set('paired_devices', backup.pairedDevices)
      deviceStore.pairedDevices.splice(
        0,
        deviceStore.pairedDevices.length,
        ...backup.pairedDevices,
      )

      // Overwrite fake call config
      await storageRepository.set(FAKE_CALL_CONFIG_KEY, backup.fakeCallConfig)

      return { success: true, message: '备份恢复成功' }
    } catch (err: any) {
      return { success: false, message: `恢复失败: ${err?.message ?? err}` }
    }
  }

  return {
    // State
    alarmRecords,
    alarmRecordCount,
    eventLogs,
    isLoading,

    // Alarm Records
    loadAlarmRecords,
    getAlarmRecordDetail,
    deleteAlarmRecord,
    deleteAlarmRecords,

    // Event Logs
    loadEventLogs,
    clearEventLogs,

    // Backup
    collectBackupData,
    exportBackup,
    importBackup,
    applyBackupData,
  }
})
