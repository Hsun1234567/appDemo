import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should have uni global available', () => {
    expect(uni).toBeDefined()
    expect(uni.getSystemInfoSync).toBeDefined()
  })

  it('should have storage APIs available', () => {
    uni.setStorageSync('test-key', { value: 42 })
    const result = uni.getStorageSync('test-key')
    expect(result).toEqual({ value: 42 })
    uni.removeStorageSync('test-key')
  })
})
