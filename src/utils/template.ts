import type { TemplateVariables } from '@/models/types'

/**
 * 将模板中的变量占位符替换为实际值
 * 支持占位符: {GPS位置}, {时间}, {用户名}
 */
export function render(template: string, variables: TemplateVariables): string {
  let result = template

  if (variables.gpsLocation !== undefined) {
    result = result.replaceAll('{GPS位置}', variables.gpsLocation)
  }

  if (variables.time !== undefined) {
    result = result.replaceAll('{时间}', variables.time)
  }

  if (variables.userName !== undefined) {
    result = result.replaceAll('{用户名}', variables.userName)
  }

  return result
}

/**
 * 检测模板是否缺少 {GPS位置} 占位符
 * 返回 true 表示模板中没有 {GPS位置}，建议用户添加
 */
export function hasMissingGPSPlaceholder(template: string): boolean {
  return !template.includes('{GPS位置}')
}
