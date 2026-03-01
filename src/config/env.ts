/**
 * 环境配置
 * 定义开发/生产环境变量，包括 API 地址、日志级别、调试开关
 */

/** 日志级别 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

/** 环境配置接口 */
export interface EnvConfig {
  /** 当前环境名称 */
  mode: 'development' | 'production'
  /** API 基础地址（预留，当前无后端） */
  apiBaseUrl: string
  /** 日志级别 */
  logLevel: LogLevel
  /** 是否启用调试模式 */
  debug: boolean
  /** 应用版本号 */
  appVersion: string
  /** BLE 扫描超时时间（毫秒） */
  bleScanTimeout: number
  /** 电量轮询间隔（毫秒） */
  batteryPollInterval: number
  /** 重连最大重试次数 */
  maxReconnectRetries: number
}

/**
 * 从 Vite 环境变量读取配置，支持 .env.development / .env.staging / .env.production
 */
function resolveConfig(): EnvConfig {
  const isProd = process.env.NODE_ENV === 'production'
  const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env ?? {} : {}

  return {
    mode: isProd ? 'production' : 'development',
    apiBaseUrl: viteEnv.VITE_API_BASE_URL ?? (isProd ? 'https://api.example.com' : 'http://localhost:3000/api'),
    logLevel: (viteEnv.VITE_LOG_LEVEL as LogLevel) ?? (isProd ? 'warn' : 'debug'),
    debug: viteEnv.VITE_ENABLE_DEBUG === 'true' || (!isProd && viteEnv.VITE_ENABLE_DEBUG !== 'false'),
    appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0',
    bleScanTimeout: 30000,
    batteryPollInterval: 60000,
    maxReconnectRetries: 3,
  }
}

/** 当前环境配置 */
export const env: EnvConfig = resolveConfig()

/** 全局常量类型声明 */
declare const __APP_VERSION__: string
