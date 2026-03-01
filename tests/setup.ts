// Test setup for Vitest
// Mock uni-app global APIs for testing environment

const storage = new Map<string, string>()

const uni = {
  getSystemInfoSync: () => ({
    platform: 'devtools',
    language: 'zh-CN',
    screenWidth: 375,
    screenHeight: 812,
  }),
  setStorageSync: (key: string, data: unknown) => {
    storage.set(key, JSON.stringify(data))
  },
  getStorageSync: (key: string) => {
    const val = storage.get(key)
    return val ? JSON.parse(val) : ''
  },
  removeStorageSync: (key: string) => {
    storage.delete(key)
  },
  setStorage: ({ key, data, success, fail }: any) => {
    try {
      storage.set(key, JSON.stringify(data))
      success?.({ errMsg: 'setStorage:ok' })
    } catch (e) {
      fail?.({ errMsg: 'setStorage:fail' })
    }
  },
  getStorage: ({ key, success, fail }: any) => {
    try {
      const val = storage.get(key)
      if (val !== undefined) {
        success?.({ data: JSON.parse(val) })
      } else {
        fail?.({ errMsg: 'getStorage:fail data not found' })
      }
    } catch (e) {
      fail?.({ errMsg: 'getStorage:fail' })
    }
  },
  removeStorage: ({ key, success }: any) => {
    storage.delete(key)
    success?.({ errMsg: 'removeStorage:ok' })
  },
  showToast: () => {},
  showModal: () => {},
  showLoading: () => {},
  hideLoading: () => {},
}

// @ts-expect-error - mock uni global
globalThis.uni = uni
