import { describe, it, expect } from 'vitest'
import { isH5, isApp, HARDWARE_FEATURES, isFeatureAvailable, type HardwareFeature } from '@/utils/platform'

describe('Platform Detection Utils', () => {
  describe('isH5', () => {
    it('should return a boolean value', () => {
      const result = isH5()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isApp', () => {
    it('should return a boolean value', () => {
      const result = isApp()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('HARDWARE_FEATURES', () => {
    it('should contain bluetooth, phone, sms, and gps', () => {
      expect(HARDWARE_FEATURES).toContain('bluetooth')
      expect(HARDWARE_FEATURES).toContain('phone')
      expect(HARDWARE_FEATURES).toContain('sms')
      expect(HARDWARE_FEATURES).toContain('gps')
    })

    it('should have exactly 4 hardware features', () => {
      expect(HARDWARE_FEATURES).toHaveLength(4)
    })
  })

  describe('isFeatureAvailable', () => {
    it('should return a boolean for each hardware feature', () => {
      for (const feature of HARDWARE_FEATURES) {
        const result = isFeatureAvailable(feature)
        expect(typeof result).toBe('boolean')
      }
    })

    it('should return the same value as isApp() for all features', () => {
      // Hardware features are available only on App platform
      const appResult = isApp()
      for (const feature of HARDWARE_FEATURES) {
        expect(isFeatureAvailable(feature)).toBe(appResult)
      }
    })
  })
})
