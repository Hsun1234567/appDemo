/**
 * App 端 BLE 蓝牙服务
 * 使用 uni-app BLE API 实现真实蓝牙通信。
 */
import type { BLEDevice, ConnectionState } from '@/models/types'
import type { IBLEService } from '@/services/mock-ble.service'

/** BLE 服务 UUID 常量 */
const BLE_UUIDS = {
  /** 电池服务 UUID (标准 BLE Battery Service) */
  BATTERY_SERVICE: '0000180F-0000-1000-8000-00805F9B34FB',
  /** 电池电量特征值 UUID */
  BATTERY_LEVEL_CHAR: '00002A19-0000-1000-8000-00805F9B34FB',
  /** 设备信息服务 UUID (标准 BLE Device Information Service) */
  DEVICE_INFO_SERVICE: '0000180A-0000-1000-8000-00805F9B34FB',
  /** 固件版本特征值 UUID */
  FIRMWARE_VERSION_CHAR: '00002A26-0000-1000-8000-00805F9B34FB',
  /** 自定义报警服务 UUID */
  ALARM_SERVICE: '0000FFF0-0000-1000-8000-00805F9B34FB',
  /** 报警信号特征值 UUID (Notify) */
  ALARM_SIGNAL_CHAR: '0000FFF1-0000-1000-8000-00805F9B34FB',
}

/** 扫描超时时间（毫秒） */
const SCAN_TIMEOUT_MS = 30_000

/** BLE 错误码到用户友好消息的映射 */
export function getBLEErrorMessage(errCode: number): string {
  const errorMap: Record<number, string> = {
    0: '操作成功',
    10000: '蓝牙适配器未初始化',
    10001: '当前蓝牙适配器不可用',
    10002: '没有找到指定设备',
    10003: '连接失败',
    10004: '没有找到指定服务',
    10005: '没有找到指定特征值',
    10006: '当前连接已断开',
    10007: '当前特征值不支持此操作',
    10008: '其余所有系统上报的异常',
    10009: 'Android 系统特有，系统版本低于 4.3 不支持 BLE',
    10012: '连接超时',
    10013: '连接设备数量超过限制',
  }
  return errorMap[errCode] ?? `未知蓝牙错误 (${errCode})`
}

export class BLEService implements IBLEService {
  private connectionStates = new Map<string, ConnectionState>()
  private alarmCallback: ((deviceId: string) => void) | null = null
  private scanTimer: ReturnType<typeof setTimeout> | null = null
  private isScanning = false

  async initAdapter(): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.openBluetoothAdapter({
        success: () => {
          console.log('[BLE] 蓝牙适配器初始化成功')
          resolve()
        },
        fail: (err: any) => {
          const msg = getBLEErrorMessage(err.errCode ?? err.errno ?? -1)
          console.error('[BLE] 蓝牙适配器初始化失败:', msg)
          reject(new Error(msg))
        },
      })
    })
  }

  async startScan(onDeviceFound: (device: BLEDevice) => void): Promise<void> {
    if (this.isScanning) {
      await this.stopScan()
    }

    return new Promise((resolve, reject) => {
      // 监听设备发现事件
      uni.onBluetoothDeviceFound((res: any) => {
        for (const d of res.devices) {
          // 过滤掉没有名称的设备
          if (!d.name || d.name === '未知设备') continue
          onDeviceFound({
            deviceId: d.deviceId,
            name: d.name,
            RSSI: d.RSSI,
          })
        }
      })

      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: () => {
          console.log('[BLE] 开始扫描设备')
          this.isScanning = true

          // 30 秒超时自动停止扫描
          this.scanTimer = setTimeout(() => {
            this.stopScan()
            console.log('[BLE] 扫描超时，已自动停止')
          }, SCAN_TIMEOUT_MS)

          resolve()
        },
        fail: (err: any) => {
          const msg = getBLEErrorMessage(err.errCode ?? err.errno ?? -1)
          console.error('[BLE] 启动扫描失败:', msg)
          reject(new Error(msg))
        },
      })
    })
  }

  async stopScan(): Promise<void> {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer)
      this.scanTimer = null
    }

    if (!this.isScanning) return

    return new Promise((resolve) => {
      uni.stopBluetoothDevicesDiscovery({
        success: () => {
          console.log('[BLE] 停止扫描')
          this.isScanning = false
          resolve()
        },
        fail: () => {
          // 即使停止失败也标记为非扫描状态
          this.isScanning = false
          resolve()
        },
      })
    })
  }

  async connect(deviceId: string): Promise<void> {
    this.connectionStates.set(deviceId, 'connecting')

    return new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId,
        success: () => {
          console.log(`[BLE] 设备 ${deviceId} 连接成功`)
          this.connectionStates.set(deviceId, 'connected')

          // 监听连接状态变化（意外断开等）
          uni.onBLEConnectionStateChange((res: any) => {
            if (res.deviceId === deviceId && !res.connected) {
              console.warn(`[BLE] 设备 ${deviceId} 连接已断开`)
              this.connectionStates.set(deviceId, 'disconnected')
            }
          })

          resolve()
        },
        fail: (err: any) => {
          const msg = getBLEErrorMessage(err.errCode ?? err.errno ?? -1)
          console.error(`[BLE] 连接设备 ${deviceId} 失败:`, msg)
          this.connectionStates.set(deviceId, 'disconnected')
          reject(new Error(msg))
        },
      })
    })
  }

  async disconnect(deviceId: string): Promise<void> {
    return new Promise((resolve) => {
      uni.closeBLEConnection({
        deviceId,
        success: () => {
          console.log(`[BLE] 设备 ${deviceId} 已断开`)
          this.connectionStates.set(deviceId, 'disconnected')
          resolve()
        },
        fail: () => {
          // 即使断开失败也标记为断开状态
          this.connectionStates.set(deviceId, 'disconnected')
          resolve()
        },
      })
    })
  }

  async readBattery(deviceId: string): Promise<number> {
    await this.ensureServicesDiscovered(deviceId)
    const value = await this.readCharacteristic(
      deviceId,
      BLE_UUIDS.BATTERY_SERVICE,
      BLE_UUIDS.BATTERY_LEVEL_CHAR,
    )
    // 电池电量特征值为单字节 uint8，范围 0-100
    return new DataView(value).getUint8(0)
  }

  async readFirmwareVersion(deviceId: string): Promise<string> {
    await this.ensureServicesDiscovered(deviceId)
    const value = await this.readCharacteristic(
      deviceId,
      BLE_UUIDS.DEVICE_INFO_SERVICE,
      BLE_UUIDS.FIRMWARE_VERSION_CHAR,
    )
    // 固件版本为 UTF-8 字符串
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(value)
  }

  onAlarmSignal(callback: (deviceId: string) => void): void {
    this.alarmCallback = callback

    // 监听 BLE 特征值变化（Notify）
    uni.onBLECharacteristicValueChange((res: any) => {
      const serviceId = res.serviceId?.toUpperCase()
      const charId = res.characteristicId?.toUpperCase()

      if (
        serviceId === BLE_UUIDS.ALARM_SERVICE.toUpperCase() &&
        charId === BLE_UUIDS.ALARM_SIGNAL_CHAR.toUpperCase()
      ) {
        console.log(`[BLE] 收到报警信号: 设备 ${res.deviceId}`)
        if (this.alarmCallback) {
          this.alarmCallback(res.deviceId)
        }
      }
    })

    console.log('[BLE] 已注册报警信号监听')
  }

  offAlarmSignal(): void {
    this.alarmCallback = null
    console.log('[BLE] 已移除报警信号监听')
  }

  getConnectionState(deviceId: string): ConnectionState {
    return this.connectionStates.get(deviceId) ?? 'disconnected'
  }

  // ── Private helpers ──

  /**
   * 确保已发现设备的 BLE 服务列表。
   * 连接后需先调用 getBLEDeviceServices 才能读取特征值。
   */
  private ensureServicesDiscovered(deviceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceServices({
        deviceId,
        success: () => resolve(),
        fail: (err: any) => {
          const msg = getBLEErrorMessage(err.errCode ?? err.errno ?? -1)
          reject(new Error(`获取服务列表失败: ${msg}`))
        },
      })
    })
  }

  /**
   * 读取指定 BLE 特征值并返回 ArrayBuffer。
   */
  private readCharacteristic(
    deviceId: string,
    serviceId: string,
    characteristicId: string,
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // 先注册一次性监听，再发起读取请求
      const onValueChange = (res: any) => {
        if (
          res.deviceId === deviceId &&
          res.serviceId?.toUpperCase() === serviceId.toUpperCase() &&
          res.characteristicId?.toUpperCase() === characteristicId.toUpperCase()
        ) {
          // 移除监听后返回值
          uni.offBLECharacteristicValueChange()
          resolve(res.value as ArrayBuffer)
        }
      }
      uni.onBLECharacteristicValueChange(onValueChange)

      uni.readBLECharacteristicValue({
        deviceId,
        serviceId,
        characteristicId,
        fail: (err: any) => {
          uni.offBLECharacteristicValueChange()
          const msg = getBLEErrorMessage(err.errCode ?? err.errno ?? -1)
          reject(new Error(`读取特征值失败: ${msg}`))
        },
      })
    })
  }

  /**
   * 为指定设备启用报警特征值的 Notify 订阅。
   * 连接设备后应调用此方法以接收报警信号。
   */
  async enableAlarmNotify(deviceId: string): Promise<void> {
    await this.ensureServicesDiscovered(deviceId)

    return new Promise((resolve, reject) => {
      uni.notifyBLECharacteristicValueChange({
        deviceId,
        serviceId: BLE_UUIDS.ALARM_SERVICE,
        characteristicId: BLE_UUIDS.ALARM_SIGNAL_CHAR,
        state: true,
        success: () => {
          console.log(`[BLE] 已启用设备 ${deviceId} 的报警信号通知`)
          resolve()
        },
        fail: (err: any) => {
          const msg = getBLEErrorMessage(err.errCode ?? err.errno ?? -1)
          console.error(`[BLE] 启用报警通知失败:`, msg)
          reject(new Error(`启用报警通知失败: ${msg}`))
        },
      })
    })
  }
}
