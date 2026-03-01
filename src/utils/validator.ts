import type { BackupData, EmergencyContact } from '@/models/types'

/**
 * 验证中国大陆手机号格式（以 1 开头的 11 位纯数字）
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^1\d{10}$/.test(phone)
}

/**
 * 验证报警短信模板长度（≤200 字符）
 */
export function isValidTemplateLength(template: string): boolean {
  return template.length <= 200
}

/**
 * 验证备份 JSON 文件格式和数据完整性
 */
export function isValidBackupFile(data: unknown): data is BackupData {
  if (data === null || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  // 检查必需字段存在且类型正确
  if (typeof obj.version !== 'string') return false
  if (typeof obj.exportedAt !== 'number') return false
  if (!Array.isArray(obj.contacts)) return false
  if (!Array.isArray(obj.pairedDevices)) return false

  // 验证 alarmTemplate
  if (obj.alarmTemplate === null || typeof obj.alarmTemplate !== 'object') return false
  const tpl = obj.alarmTemplate as Record<string, unknown>
  if (typeof tpl.content !== 'string') return false
  if (typeof tpl.updatedAt !== 'number') return false

  // 验证 alarmMode
  if (obj.alarmMode !== 'full' && obj.alarmMode !== 'silent' && obj.alarmMode !== 'deterrent') return false

  // 验证 fakeCallConfig
  if (obj.fakeCallConfig === null || typeof obj.fakeCallConfig !== 'object') return false
  const fcc = obj.fakeCallConfig as Record<string, unknown>
  if (typeof fcc.callerName !== 'string') return false
  if (typeof fcc.delaySeconds !== 'number') return false

  // 验证每个联系人
  for (const contact of obj.contacts) {
    if (!isValidContact(contact)) return false
  }

  // 验证每个已配对设备
  for (const device of obj.pairedDevices) {
    if (device === null || typeof device !== 'object') return false
    const d = device as Record<string, unknown>
    if (typeof d.deviceId !== 'string') return false
    if (typeof d.name !== 'string') return false
    if (typeof d.pairedAt !== 'number') return false
  }

  return true
}

/**
 * 验证联系人数据完整性
 */
export function isValidContact(contact: unknown): contact is EmergencyContact {
  if (contact === null || typeof contact !== 'object') return false

  const obj = contact as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length === 0) return false
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (typeof obj.phone !== 'string' || !isValidPhoneNumber(obj.phone)) return false
  if (typeof obj.createdAt !== 'number') return false
  if (typeof obj.updatedAt !== 'number') return false

  return true
}
