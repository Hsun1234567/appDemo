/**
 * App 端短信服务
 * 调用系统短信应用发送短信。
 * App 端优先使用 plus.messaging，不可用时回退到 href 方式。
 */

/** 短信服务接口 */
export interface ISMSService {
  /** 发送短信，成功返回 true，失败返回 false */
  sendSMS(phoneNumber: string, content: string): Promise<boolean>
}

export class SMSService implements ISMSService {
  async sendSMS(phoneNumber: string, content: string): Promise<boolean> {
    try {
      // #ifdef APP-PLUS
      return await this.sendViaPlusMessaging(phoneNumber, content)
      // #endif

      // #ifdef H5
      return this.sendViaHref(phoneNumber, content)
      // #endif
    } catch (err: any) {
      console.error('[SMS] 发送短信失败:', err?.message ?? err)
      return false
    }
  }

  // #ifdef APP-PLUS
  private sendViaPlusMessaging(phoneNumber: string, content: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const msg = (plus as any).messaging.createMessage(plus.messaging.TYPE_SMS)
        msg.to = [phoneNumber]
        msg.body = content
        ;(plus as any).messaging.sendMessage(msg, () => {
          console.log(`[SMS] 短信已发送至 ${phoneNumber}`)
          resolve(true)
        }, (err: any) => {
          console.error('[SMS] plus.messaging 发送失败:', err?.message ?? err)
          resolve(false)
        })
      } catch (err: any) {
        console.error('[SMS] plus.messaging 调用异常:', err?.message ?? err)
        resolve(false)
      }
    })
  }
  // #endif

  // #ifdef H5
  private sendViaHref(phoneNumber: string, content: string): boolean {
    try {
      const encoded = encodeURIComponent(content)
      window.location.href = `sms:${phoneNumber}?body=${encoded}`
      console.log(`[SMS] 已跳转系统短信应用: ${phoneNumber}`)
      return true
    } catch (err: any) {
      console.error('[SMS] href 跳转失败:', err?.message ?? err)
      return false
    }
  }
  // #endif
}
