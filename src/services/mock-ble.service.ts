/**
 * H5 端蓝牙模拟服务
 * 实现与 IBLEService 相同的接口，返回模拟数据，
 * 使 H5 端可独立调试 UI 和业务逻辑。
 */
import type { BLEDevice, ConnectionState } from '@/models/types'

/** BLE 服务接口（与真实 BLE 服务共享） */
export interface IBLEService {
  initAdapter(): Promise<void>
  startScan(onDeviceFound: (device: BLEDevice) => void): Promise<void>
  stopScan(): Promise<void>
  connect(deviceId: string): Promise<void>
  disconnect(deviceId: string): Promise<void>
  readBattery(deviceId: string): Promise<number>
  readFirmwareVersion(deviceId: string): Promise<string>
  onAlarmSignal(callback: (deviceId: string) => void): void
  offAlarmSignal(): void
  getConnectionState(deviceId: string): ConnectionState
  /** 启用报警特征值的 Notify 订阅，连接后调用以接收报警信号 */
  enableAlarmNotify(deviceId: string): Promise<void>
}

/** 模拟设备数据 */
const MOCK_DEVICES: BLEDevice[] = [
  { deviceId: 'AA:BB:CC:DD:EE:01', name: 'SafeAlarm-001', RSSI: -45 },
  { deviceId: 'AA:BB:CC:DD:EE:02', name: 'SafeAlarm-002', RSSI: -62 },
  { deviceId: 'AA:BB:CC:DD:EE:03', name: 'SafeAlarm-003', RSSI: -78 },
]

/** 模拟电量值（每次读取在 60-95 之间随机波动） */
function randomBattery(): number {
  return Math.floor(Math.random() * 36) + 60
}

export class MockBLEService implements IBLEService {
  private connectionStates = new Map<string, ConnectionState>()
  private alarmCallback: ((deviceId: string) => void) | null = null
  private scanTimer: ReturnType<typeof setTimeout> | null = null

  async initAdapter(): Promise<void> {
    console.log('[MockBLE] 蓝牙适配器已初始化（模拟）')
  }

  async startScan(onDeviceFound: (device: BLEDevice) => void): Promise<void> {
    console.log('[MockBLE] 开始扫描设备（模拟）')
    // 模拟逐个发现设备，每 800ms 发现一个
    let index = 0
    const emitDevice = () => {
      if (index < MOCK_DEVICES.length) {
        onDeviceFound({ ...MOCK_DEVICES[index] })
        index++
        this.scanTimer = setTimeout(emitDevice, 800)
      }
    }
    this.scanTimer = setTimeout(emitDevice, 500)
  }

  async stopScan(): Promise<void> {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer)
      this.scanTimer = null
    }
    console.log('[MockBLE] 停止扫描（模拟）')
  }

  async connect(deviceId: string): Promise<void> {
    console.log(`[MockBLE] 连接设备 ${deviceId}（模拟）`)
    this.connectionStates.set(deviceId, 'connecting')
    // 模拟连接延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))
    this.connectionStates.set(deviceId, 'connected')
    console.log(`[MockBLE] 设备 ${deviceId} 已连接（模拟）`)
  }

  async disconnect(deviceId: string): Promise<void> {
    console.log(`[MockBLE] 断开设备 ${deviceId}（模拟）`)
    this.connectionStates.set(deviceId, 'disconnected')
  }

  async readBattery(_deviceId: string): Promise<number> {
    return randomBattery()
  }

  async readFirmwareVersion(_deviceId: string): Promise<string> {
    return 'v1.2.3-mock'
  }

  onAlarmSignal(callback: (deviceId: string) => void): void {
    this.alarmCallback = callback
    console.log('[MockBLE] 已注册报警信号监听（模拟）')
  }

  offAlarmSignal(): void {
    this.alarmCallback = null
    console.log('[MockBLE] 已移除报警信号监听（模拟）')
  }

  getConnectionState(deviceId: string): ConnectionState {
    return this.connectionStates.get(deviceId) ?? 'disconnected'
  }

  async enableAlarmNotify(_deviceId: string): Promise<void> {
    console.log(`[MockBLE] 已启用报警信号通知（模拟）`)
  }

  /**
   * 手动触发模拟报警信号（仅用于 H5 调试）
   * 在浏览器控制台调用：mockBleService.simulateAlarm('AA:BB:CC:DD:EE:01')
   */
  simulateAlarm(deviceId: string): void {
    if (this.alarmCallback) {
      console.log(`[MockBLE] 模拟报警信号触发: ${deviceId}`)
      this.alarmCallback(deviceId)
    } else {
      console.warn('[MockBLE] 未注册报警信号监听，无法触发模拟报警')
    }
  }
}
