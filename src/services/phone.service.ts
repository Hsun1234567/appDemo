/**
 * App 端电话服务
 * 调用系统拨号拨打电话。
 * App 端优先使用 plus.device.dial，回退到 uni.makePhoneCall。
 */

/** 电话服务接口 */
export interface IPhoneService {
  /** 拨打电话，成功返回 true，失败返回 false */
  makeCall(phoneNumber: string): Promise<boolean>
}

export class PhoneService implements IPhoneService {
  async makeCall(phoneNumber: string): Promise<boolean> {
    try {
      // #ifdef APP-PLUS
      return await this.callViaPlusDial(phoneNumber)
      // #endif

      // #ifdef H5
      return this.callViaUni(phoneNumber)
      // #endif
    } catch (err: any) {
      console.error('[Phone] 拨打电话失败:', err?.message ?? err)
      return false
    }
  }

  // #ifdef APP-PLUS
  private callViaPlusDial(phoneNumber: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        ;(plus as any).device.dial(phoneNumber, false)
        console.log(`[Phone] 已拨打电话: ${phoneNumber}`)
        resolve(true)
      } catch (err: any) {
        console.error('[Phone] plus.device.dial 失败，回退到 uni.makePhoneCall:', err?.message ?? err)
        // 回退到 uni.makePhoneCall
        uni.makePhoneCall({
          phoneNumber,
          success: () => {
            console.log(`[Phone] uni.makePhoneCall 拨打成功: ${phoneNumber}`)
            resolve(true)
          },
          fail: (callErr: any) => {
            console.error('[Phone] uni.makePhoneCall 失败:', callErr?.errMsg ?? callErr)
            resolve(false)
          },
        })
      }
    })
  }
  // #endif

  // #ifdef H5
  private callViaUni(phoneNumber: string): Promise<boolean> {
    return new Promise((resolve) => {
      uni.makePhoneCall({
        phoneNumber,
        success: () => {
          console.log(`[Phone] 拨打成功: ${phoneNumber}`)
          resolve(true)
        },
        fail: (err: any) => {
          console.error('[Phone] 拨打失败:', err?.errMsg ?? err)
          resolve(false)
        },
      })
    })
  }
  // #endif
}
