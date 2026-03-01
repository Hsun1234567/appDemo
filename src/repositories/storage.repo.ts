/**
 * Storage 仓库 - 封装 uni-app 本地存储 API
 * 提供泛型类型安全的 set / get / remove 方法
 */

export interface IStorageRepository {
  /** 保存数据 */
  set<T>(key: string, value: T): Promise<void>
  /** 读取数据 */
  get<T>(key: string, defaultValue?: T): Promise<T | undefined>
  /** 删除数据 */
  remove(key: string): Promise<void>
}

export const storageRepository: IStorageRepository = {
  set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.setStorage({
        key,
        data: value,
        success: () => resolve(),
        fail: (err) => reject(err),
      })
    })
  },

  get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return new Promise((resolve) => {
      uni.getStorage({
        key,
        success: (res) => resolve(res.data as T),
        fail: () => resolve(defaultValue),
      })
    })
  },

  remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.removeStorage({
        key,
        success: () => resolve(),
        fail: (err) => reject(err),
      })
    })
  },
}
