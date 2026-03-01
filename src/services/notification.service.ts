/**
 * 本地通知推送服务
 * App 端使用 plus.push.createMessage 创建本地通知。
 * H5 端降级为 console 输出（浏览器通知需用户授权，此处不强制）。
 */

/** 通知服务接口 */
export interface INotificationService {
  /** 推送本地通知，失败返回 false */
  pushLocal(title: string, content: string): Promise<boolean>
}

export class NotificationService implements INotificationService {
  async pushLocal(title: string, content: string): Promise<boolean> {
    try {
      // #ifdef APP-PLUS
      return this.pushViaPlusApi(title, content)
      // #endif

      // #ifdef H5
      return this.pushViaConsole(title, content)
      // #endif
    } catch (err: any) {
      console.error('[Notification] 推送通知失败:', err?.message ?? err)
      return false
    }
  }

  // #ifdef APP-PLUS
  private pushViaPlusApi(title: string, content: string): boolean {
    try {
      ;(plus as any).push.createMessage(content, JSON.stringify({ title }), {
        title,
      })
      console.log(`[Notification] 本地通知已推送: ${title}`)
      return true
    } catch (err: any) {
      console.error('[Notification] plus.push.createMessage 失败:', err?.message ?? err)
      return false
    }
  }
  // #endif

  // #ifdef H5
  private pushViaConsole(title: string, content: string): boolean {
    console.log(`[Notification][H5] ${title}: ${content}`)
    return true
  }
  // #endif
}
