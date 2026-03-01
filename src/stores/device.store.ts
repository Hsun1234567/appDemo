/**
 * 设备管理 Store
 * 管理已配对设备列表（最多 3 个）、设备运行时状态、
 * 扫描/配对/移除操作、自动重连、电量轮询、低电量警告、事件日志。
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  BLEDevice,
  PairedDevice,
  DeviceRuntimeState,
  ConnectionState,
  EventLog,
  EventType,
} from '@/models/types'
import type { IBLEService } from '@/services/mock-ble.service'
import { storageRepository } from '@/repositories/storage.repo'
import { sqliteRepository } from '@/repositories/sqlite.repo'
import { env } from '@/config/env'

// #ifdef APP-PLUS
import { BLEService } from '@/services/ble.service'
// #endif
// #ifdef H5
// eslint-disable-next-line @typescript-eslint/no-duplicate-imports
import { MockBLEService as BLEService } from '@/services/mock-ble.service'
// #endif

/** Storage key for paired devices */
const PAIRED_DEVICES_KEY = 'paired_devices'

/** Max number of paired devices */
const MAX_PAIRED_DEVICES = 3

/** Reconnect delay in milliseconds */
const RECONNECT_DELAY_MS = 5000

/** Low battery threshold percentage */
const LOW_BATTERY_THRESHOLD = 20

/** Generate a simple UUID */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useDeviceStore = defineStore('device', () => {
  // ── BLE service instance ──
  const bleService: IBLEService = new BLEService()

  // ── State ──
  const pairedDevices = ref<PairedDevice[]>([])
  const runtimeStates = ref<Map<string, DeviceRuntimeState>>(new Map())
  const discoveredDevices = ref<BLEDevice[]>([])
  const isScanning = ref(false)
  const isInitialized = ref(false)

  // ── Reconnect tracking ──
  const reconnectAttempts = ref<Map<string, number>>(new Map())
  const reconnectTimers = ref<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ── Battery poll tracking ──
  const batteryPollTimers = ref<Map<string, ReturnType<typeof setInterval>>>(new Map())

  // ── Computed ──
  const pairedDeviceList = computed(() => pairedDevices.value)
  const canPairMore = computed(() => pairedDevices.value.length < MAX_PAIRED_DEVICES)

  /** Get runtime state for a device */
  function getRuntimeState(deviceId: string): DeviceRuntimeState | undefined {
    return runtimeStates.value.get(deviceId)
  }

  /** Get connection state for a device */
  function getConnectionState(deviceId: string): ConnectionState {
    return runtimeStates.value.get(deviceId)?.connectionState ?? 'disconnected'
  }

  // ── Event logging helper ──
  async function logEvent(
    eventType: EventType,
    description: string,
    deviceId?: string,
  ): Promise<void> {
    const log: EventLog = {
      id: generateId(),
      timestamp: Date.now(),
      eventType,
      description,
      deviceId,
    }
    try {
      await sqliteRepository.insertEventLog(log)
      await sqliteRepository.pruneEventLogs(1000)
    } catch (e) {
      console.error('[DeviceStore] 写入事件日志失败:', e)
    }
  }

  // ── Runtime state helpers ──
  function ensureRuntimeState(deviceId: string): DeviceRuntimeState {
    let state = runtimeStates.value.get(deviceId)
    if (!state) {
      state = {
        deviceId,
        connectionState: 'disconnected',
        battery: -1,
        lastBatteryRead: 0,
      }
      runtimeStates.value.set(deviceId, state)
    }
    return state
  }

  function updateRuntimeState(deviceId: string, patch: Partial<DeviceRuntimeState>): void {
    const state = ensureRuntimeState(deviceId)
    Object.assign(state, patch)
    // Trigger reactivity by replacing the map
    runtimeStates.value = new Map(runtimeStates.value)
  }

  // ── Persistence ──
  async function loadPairedDevices(): Promise<void> {
    const stored = await storageRepository.get<PairedDevice[]>(PAIRED_DEVICES_KEY, [])
    pairedDevices.value = stored ?? []
  }

  async function savePairedDevices(): Promise<void> {
    await storageRepository.set(PAIRED_DEVICES_KEY, pairedDevices.value)
  }

  // ── Initialize ──
  async function init(): Promise<void> {
    if (isInitialized.value) return
    try {
      await bleService.initAdapter()
      await loadPairedDevices()
      // Initialize runtime states for all paired devices
      for (const device of pairedDevices.value) {
        ensureRuntimeState(device.deviceId)
      }
      isInitialized.value = true
    } catch (e) {
      console.error('[DeviceStore] 初始化失败:', e)
      // Still load paired devices even if BLE init fails
      await loadPairedDevices()
      for (const device of pairedDevices.value) {
        ensureRuntimeState(device.deviceId)
      }
      isInitialized.value = true
    }
  }

  // ── Scanning ──
  async function startScan(): Promise<void> {
    if (isScanning.value) return
    discoveredDevices.value = []
    isScanning.value = true

    try {
      await bleService.startScan((device: BLEDevice) => {
        // Avoid duplicates
        const exists = discoveredDevices.value.some((d) => d.deviceId === device.deviceId)
        if (!exists) {
          discoveredDevices.value.push(device)
        }
      })
    } catch (e) {
      console.error('[DeviceStore] 扫描失败:', e)
      isScanning.value = false
      throw e
    }
  }

  async function stopScan(): Promise<void> {
    if (!isScanning.value) return
    try {
      await bleService.stopScan()
    } finally {
      isScanning.value = false
    }
  }

  // ── Battery polling ──
  function startBatteryPoll(deviceId: string): void {
    stopBatteryPoll(deviceId)

    const poll = async () => {
      const state = runtimeStates.value.get(deviceId)
      if (!state || state.connectionState !== 'connected') {
        stopBatteryPoll(deviceId)
        return
      }

      try {
        const battery = await bleService.readBattery(deviceId)
        const prevBattery = state.battery

        updateRuntimeState(deviceId, {
          battery,
          lastBatteryRead: Date.now(),
        })

        // Log battery change if value changed
        if (prevBattery !== battery && prevBattery !== -1) {
          await logEvent(
            'battery_change',
            `电量变化: ${prevBattery}% → ${battery}%`,
            deviceId,
          )
        }

        // Low battery warning
        if (battery >= 0 && battery < LOW_BATTERY_THRESHOLD) {
          console.warn(`[DeviceStore] 设备 ${deviceId} 低电量警告: ${battery}%`)
          uni.showToast({
            title: `设备电量低 (${battery}%)`,
            icon: 'none',
            duration: 3000,
          })
        }
      } catch (e) {
        console.error(`[DeviceStore] 读取电量失败 (${deviceId}):`, e)
      }
    }

    // Read immediately, then poll at interval
    poll()
    const timer = setInterval(poll, env.batteryPollInterval)
    batteryPollTimers.value.set(deviceId, timer)
  }

  function stopBatteryPoll(deviceId: string): void {
    const timer = batteryPollTimers.value.get(deviceId)
    if (timer) {
      clearInterval(timer)
      batteryPollTimers.value.delete(deviceId)
    }
  }

  // ── Auto-reconnect ──
  function scheduleReconnect(deviceId: string): void {
    const attempts = reconnectAttempts.value.get(deviceId) ?? 0
    if (attempts >= env.maxReconnectRetries) {
      console.warn(`[DeviceStore] 设备 ${deviceId} 重连已达上限 (${env.maxReconnectRetries} 次)`)
      reconnectAttempts.value.delete(deviceId)
      uni.showToast({
        title: '设备连接已断开，请手动重连',
        icon: 'none',
        duration: 3000,
      })
      return
    }

    const nextAttempt = attempts + 1
    reconnectAttempts.value.set(deviceId, nextAttempt)

    console.log(`[DeviceStore] 设备 ${deviceId} 将在 ${RECONNECT_DELAY_MS}ms 后重连 (第 ${nextAttempt} 次)`)

    const timer = setTimeout(async () => {
      reconnectTimers.value.delete(deviceId)

      await logEvent(
        'ble_reconnect_attempt',
        `自动重连尝试 (第 ${nextAttempt}/${env.maxReconnectRetries} 次)`,
        deviceId,
      )

      try {
        await connectDevice(deviceId)
        // Reconnect succeeded — reset counter
        reconnectAttempts.value.delete(deviceId)
        console.log(`[DeviceStore] 设备 ${deviceId} 重连成功`)
      } catch {
        // Reconnect failed — schedule next attempt
        scheduleReconnect(deviceId)
      }
    }, RECONNECT_DELAY_MS)

    reconnectTimers.value.set(deviceId, timer)
  }

  function cancelReconnect(deviceId: string): void {
    const timer = reconnectTimers.value.get(deviceId)
    if (timer) {
      clearTimeout(timer)
      reconnectTimers.value.delete(deviceId)
    }
    reconnectAttempts.value.delete(deviceId)
  }

  // ── Connection state change handler ──
  function handleDisconnect(deviceId: string): void {
    updateRuntimeState(deviceId, { connectionState: 'disconnected' })
    stopBatteryPoll(deviceId)

    logEvent('ble_disconnected', '蓝牙连接已断开', deviceId)

    // Only auto-reconnect if device is still paired
    const isPaired = pairedDevices.value.some((d) => d.deviceId === deviceId)
    if (isPaired) {
      scheduleReconnect(deviceId)
    }
  }

  // ── Connect / Disconnect ──
  async function connectDevice(deviceId: string): Promise<void> {
    updateRuntimeState(deviceId, { connectionState: 'connecting' })

    try {
      await bleService.connect(deviceId)
      updateRuntimeState(deviceId, { connectionState: 'connected' })

      await logEvent('ble_connected', '蓝牙连接成功', deviceId)

      // Enable alarm signal Notify subscription so BLE alarm events are received
      try {
        await bleService.enableAlarmNotify(deviceId)
      } catch (e) {
        console.error(`[DeviceStore] 启用报警通知失败 (${deviceId}):`, e)
      }

      // Start battery polling
      startBatteryPoll(deviceId)

      // Read firmware version
      try {
        const firmware = await bleService.readFirmwareVersion(deviceId)
        const device = pairedDevices.value.find((d) => d.deviceId === deviceId)
        if (device) {
          device.firmwareVersion = firmware
          await savePairedDevices()
        }
        await logEvent('firmware_read', `固件版本: ${firmware}`, deviceId)
      } catch (e) {
        console.error(`[DeviceStore] 读取固件版本失败 (${deviceId}):`, e)
      }
    } catch (e) {
      updateRuntimeState(deviceId, { connectionState: 'disconnected' })
      throw e
    }
  }

  async function disconnectDevice(deviceId: string): Promise<void> {
    cancelReconnect(deviceId)
    stopBatteryPoll(deviceId)

    try {
      await bleService.disconnect(deviceId)
    } finally {
      updateRuntimeState(deviceId, { connectionState: 'disconnected' })
      await logEvent('ble_disconnected', '蓝牙连接已主动断开', deviceId)
    }
  }

  // ── Pair / Remove ──
  async function pairDevice(device: BLEDevice): Promise<void> {
    if (pairedDevices.value.length >= MAX_PAIRED_DEVICES) {
      throw new Error(`已达到最大配对数量 (${MAX_PAIRED_DEVICES})`)
    }

    // Check if already paired
    if (pairedDevices.value.some((d) => d.deviceId === device.deviceId)) {
      throw new Error('该设备已配对')
    }

    // Connect first
    await connectDevice(device.deviceId)

    // Add to paired list
    const paired: PairedDevice = {
      deviceId: device.deviceId,
      name: device.name,
      pairedAt: Date.now(),
    }
    pairedDevices.value.push(paired)
    await savePairedDevices()
  }

  async function removeDevice(deviceId: string): Promise<void> {
    // Disconnect if connected
    const state = runtimeStates.value.get(deviceId)
    if (state && state.connectionState !== 'disconnected') {
      await disconnectDevice(deviceId)
    }

    cancelReconnect(deviceId)
    stopBatteryPoll(deviceId)

    // Remove from paired list
    pairedDevices.value = pairedDevices.value.filter((d) => d.deviceId !== deviceId)
    runtimeStates.value.delete(deviceId)
    runtimeStates.value = new Map(runtimeStates.value)
    await savePairedDevices()
  }

  // ── Manual reconnect ──
  async function manualReconnect(deviceId: string): Promise<void> {
    cancelReconnect(deviceId)
    await connectDevice(deviceId)
  }

  // ── Cleanup ──
  function dispose(): void {
    // Stop all battery polls
    for (const [deviceId] of batteryPollTimers.value) {
      stopBatteryPoll(deviceId)
    }
    // Cancel all reconnect timers
    for (const [deviceId] of reconnectTimers.value) {
      cancelReconnect(deviceId)
    }
    // Remove alarm signal listener
    bleService.offAlarmSignal()
  }

  /** Register alarm signal listener — delegates to BLE service */
  function onAlarmSignal(callback: (deviceId: string) => void): void {
    bleService.onAlarmSignal(callback)
  }

  /** Remove alarm signal listener */
  function offAlarmSignal(): void {
    bleService.offAlarmSignal()
  }

  return {
    // State
    pairedDevices,
    runtimeStates,
    discoveredDevices,
    isScanning,
    isInitialized,

    // Computed
    pairedDeviceList,
    canPairMore,

    // Getters
    getRuntimeState,
    getConnectionState,

    // Actions
    init,
    startScan,
    stopScan,
    pairDevice,
    removeDevice,
    connectDevice,
    disconnectDevice,
    manualReconnect,
    onAlarmSignal,
    offAlarmSignal,
    dispose,

    // Exposed for testing
    handleDisconnect,
    logEvent,
  }
})
