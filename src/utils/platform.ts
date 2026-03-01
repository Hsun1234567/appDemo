/**
 * 平台检测工具
 * 使用 uni-app 条件编译区分 H5 端和 App 端
 */

/**
 * 检测当前是否运行在 H5 端
 */
export function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 检测当前是否运行在 App 端
 */
export function isApp(): boolean {
  // #ifdef APP-PLUS
  return true
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

/**
 * 硬件功能列表 — H5 端不可用的功能
 */
export const HARDWARE_FEATURES = [
  'bluetooth',   // 蓝牙扫描/连接
  'phone',       // 拨打电话
  'sms',         // 发送短信
  'gps',         // GPS 定位
] as const

export type HardwareFeature = (typeof HARDWARE_FEATURES)[number]

/**
 * 检测指定硬件功能在当前平台是否可用
 * App 端全部可用，H5 端全部不可用
 */
export function isFeatureAvailable(feature: HardwareFeature): boolean {
  return isApp()
}
