/** BLE 扫描发现的设备 */
export interface BLEDevice {
  deviceId: string       // 设备 ID（MAC 地址）
  name: string           // 设备名称
  RSSI: number           // 信号强度
}

/** 已配对的报警器设备 */
export interface PairedDevice {
  deviceId: string       // 设备 ID（MAC 地址）
  name: string           // 设备名称
  pairedAt: number       // 配对时间戳（ms）
  firmwareVersion?: string // 固件版本号
}

/** 连接状态 */
export type ConnectionState = 'connected' | 'disconnected' | 'connecting'

/** 设备运行时状态 */
export interface DeviceRuntimeState {
  deviceId: string
  connectionState: ConnectionState
  battery: number        // 电量百分比 0-100
  lastBatteryRead: number // 上次电量读取时间戳
}

/** GPS 位置 */
export interface GPSLocation {
  latitude: number       // 纬度
  longitude: number      // 经度
  address?: string       // 逆地理编码地址（可选）
  timestamp: number      // 获取时间戳
}

/** 紧急联系人 */
export interface EmergencyContact {
  id: string             // 唯一标识（UUID）
  name: string           // 姓名
  phone: string          // 手机号码（11 位）
  createdAt: number      // 创建时间戳
  updatedAt: number      // 更新时间戳
}

/** 报警模式 */
export type AlarmMode = 'full' | 'silent' | 'deterrent'

/** 报警短信模板 */
export interface AlarmTemplate {
  content: string        // 模板内容（≤200 字符）
  updatedAt: number      // 更新时间戳
}

/** 报警响应步骤执行结果 */
export interface AlarmStepResult {
  step: 'gps' | 'readContacts' | 'sendSMS' | 'makeCall' | 'saveRecord' | 'notification'
  success: boolean
  error?: string         // 失败原因
  timestamp: number
}

/** 报警记录 */
export interface AlarmRecord {
  id: string             // 唯一标识（UUID）
  triggeredAt: number    // 触发时间戳
  location: GPSLocation | null  // GPS 位置（获取失败时为 null）
  alarmMode: AlarmMode   // 报警模式
  contactsNotified: EmergencyContact[] // 通知的联系人列表
  stepResults: AlarmStepResult[]       // 各步骤执行结果
  deviceId: string       // 触发设备 ID
}

/** 事件类型 */
export type EventType =
  | 'ble_connected'
  | 'ble_disconnected'
  | 'ble_reconnect_attempt'
  | 'battery_change'
  | 'alarm_triggered'
  | 'firmware_read'

/** 设备事件日志 */
export interface EventLog {
  id: string             // 唯一标识（UUID）
  timestamp: number      // 事件时间戳
  eventType: EventType   // 事件类型
  description: string    // 事件描述
  deviceId?: string      // 关联设备 ID
}

/** 安全计时器状态 */
export interface SafetyTimerState {
  isRunning: boolean
  durationMs: number     // 设定时长（毫秒）
  startedAt: number      // 开始时间戳
  remainingMs: number    // 剩余时间（毫秒）
}

/** 模拟来电配置 */
export interface FakeCallConfig {
  callerName: string     // 来电人名称
  delaySeconds: number   // 延迟秒数（0/30/60/300）
}

/** 安全知识文章 */
export interface KnowledgeArticle {
  id: string
  title: string
  category: 'travel' | 'home' | 'emergency' // 出行安全/居家安全/应急自救
  content: string
  keywords: string[]
}

/** 备份数据结构 */
export interface BackupData {
  version: string                    // 备份格式版本号
  exportedAt: number                 // 导出时间戳
  contacts: EmergencyContact[]       // 紧急联系人
  alarmTemplate: AlarmTemplate       // 报警模板
  alarmMode: AlarmMode               // 报警模式
  pairedDevices: PairedDevice[]      // 已配对设备
  fakeCallConfig: FakeCallConfig     // 模拟来电配置
}

/** 应用设置 */
export interface AppSettings {
  language: 'zh-CN' | 'en-US'       // 界面语言
  alarmMode: AlarmMode               // 当前报警模式
  alarmTemplate: AlarmTemplate       // 报警短信模板
  userName: string                   // 用户名（用于模板变量）
}

/** 模板变量 */
export interface TemplateVariables {
  gpsLocation?: string
  time?: string
  userName?: string
}
