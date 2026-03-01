/**
 * App 端定位服务
 * 使用 uni.getLocation 获取 GPS 经纬度坐标。
 */
import type { GPSLocation } from '@/models/types'

/** 定位服务接口 */
export interface ILocationService {
  /** 获取当前 GPS 位置，失败时返回 null */
  getCurrentLocation(): Promise<GPSLocation | null>
}

export class LocationService implements ILocationService {
  async getCurrentLocation(): Promise<GPSLocation | null> {
    try {
      const result = await new Promise<GPSLocation>((resolve, reject) => {
        uni.getLocation({
          type: 'gcj02',
          success: (res: any) => {
            console.log('[Location] 定位成功:', res.latitude, res.longitude)
            resolve({
              latitude: res.latitude,
              longitude: res.longitude,
              address: res.address || undefined,
              timestamp: Date.now(),
            })
          },
          fail: (err: any) => {
            reject(err)
          },
        })
      })
      return result
    } catch (err: any) {
      console.error('[Location] 定位失败:', err?.errMsg ?? err)
      return null
    }
  }
}
