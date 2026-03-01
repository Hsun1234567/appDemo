/**
 * 调试工具函数
 * 提供环境信息打印、BLE 状态检查、存储数据查看和结构化日志输出。
 * 用于真机调试和问题排查。
 */

import { isH5, isApp } from '@/utils/platform'

/** 已知的存储键列表，用于 inspectStorage 全量扫描 */
const KNOWN_STORAGE_KEYS = [
  'emergency_contacts',
  'alarm_template',
  'alarm_mode',
  'paired_devices',
  'app_settings',
  'fake_call_config',
] as const

/**
 * 结构化调试日志输出
 * 格式: [TAG] HH:MM:SS.mmm message
 */
export function logEvent(tag: string, message: string): void {
  const now = new Date()
  const time = now.toTimeString().split(' ')[0]
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  console.log(`[${tag}] ${time}.${ms} ${message}`)
}

/**
 * 打印平台、系统信息和应用版本
 * 输出当前运行环境的关键信息，便于排查兼容性问题。
 */
export async function printEnvInfo(): Promise<void> {
  const info: Record<string, string> = {
    platform: isApp() ? 'App' : isH5() ? 'H5' : 'unknown',
  }

  try {
    const systemInfo = uni.getSystemInfoSync()
    info.brand = systemInfo.brand ?? '-'
    info.model = systemInfo.model ?? '-'
    info.system = systemInfo.system ?? '-'
    info.platform_detail = systemInfo.platform ?? '-'
    info.screenWidth = `${systemInfo.screenWidth ?? '-'}px`
    info.screenHeight = `${systemInfo.screenHeight ?? '-'}px`
    info.language = systemInfo.language ?? '-'
    info.SDKVersion = systemInfo.SDKVersion ?? '-'

    // uni-app 特有字段
    if ((systemInfo as any).uniPlatform) {
      info.uniPlatform = (systemInfo as any).uniPlatform
    }
    if ((systemInfo as any).uniCompileVersion) {
      info.uniCompileVersion = (systemInfo as any).uniCompileVersion
    }
  } catch (e) {
    info.systemInfoError = String(e)
  }

  // 读取 manifest 中的版本号
  info.appVersion = __APP_VERSION__ ?? '-'

  logEvent('ENV', '========== 环境信息 ==========')
  for (const [key, value] of Object.entries(info)) {
    logEvent('ENV', `  ${key}: ${value}`)
  }
  logEvent('ENV', '==============================')
}

/**
 * 检查蓝牙适配器是否可用
 * @returns true 表示蓝牙可用，false 表示不可用或不支持
 */
export async function checkBLEStatus(): Promise<boolean> {
  if (isH5()) {
    logEvent('BLE', '当前为 H5 端，蓝牙不可用')
    return false
  }

  return new Promise((resolve) => {
    try {
      uni.openBluetoothAdapter({
        success: () => {
          logEvent('BLE', '蓝牙适配器可用 ✓')
          // 关闭适配器，避免影响正常业务流程
          uni.closeBluetoothAdapter({ success() {}, fail() {} })
          resolve(true)
        },
        fail: (err) => {
          logEvent('BLE', `蓝牙适配器不可用 ✗ — ${err.errMsg ?? JSON.stringify(err)}`)
          resolve(false)
        },
      })
    } catch (e) {
      logEvent('BLE', `蓝牙检查异常: ${String(e)}`)
      resolve(false)
    }
  })
}

/**
 * 读取并打印本地存储数据
 * @param key 指定 key 则只查看该项；不传则遍历所有已知 key
 */
export async function inspectStorage(key?: string): Promise<void> {
  logEvent('STORAGE', '========== 存储数据 ==========')

  const keys = key ? [key] : KNOWN_STORAGE_KEYS

  for (const k of keys) {
    try {
      const result = uni.getStorageSync(k)
      if (result !== '' && result !== undefined && result !== null) {
        const display = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
        logEvent('STORAGE', `[${k}] ${display}`)
      } else {
        logEvent('STORAGE', `[${k}] (空)`)
      }
    } catch (e) {
      logEvent('STORAGE', `[${k}] 读取失败: ${String(e)}`)
    }
  }

  logEvent('STORAGE', '==============================')
}

/**
 * 全局版本号声明
 * 通过 vite define 或 uni-app 条件编译注入
 */
declare const __APP_VERSION__: string | undefined
