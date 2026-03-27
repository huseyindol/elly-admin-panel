import {
  createRateLimiter,
  RateLimiter,
  RateLimitPresets,
} from '@/lib/rate-limiter'
import { beforeEach, describe, expect, it } from 'vitest'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 1000, // 1 second
      max: 3, // 3 requests
    })
  })

  describe('check', () => {
    it('should allow requests within limit', async () => {
      const result1 = await rateLimiter.check('test-ip')
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = await rateLimiter.check('test-ip')
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = await rateLimiter.check('test-ip')
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('should block requests exceeding limit', async () => {
      // Make 3 requests (max)
      await rateLimiter.check('test-ip')
      await rateLimiter.check('test-ip')
      await rateLimiter.check('test-ip')

      // 4th request should be blocked
      const result = await rateLimiter.check('test-ip')
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different IPs separately', async () => {
      const result1 = await rateLimiter.check('ip-1')
      const result2 = await rateLimiter.check('ip-2')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(2)
      expect(result2.remaining).toBe(2)
    })

    it('should return correct limit and reset values', async () => {
      const before = Date.now()
      const result = await rateLimiter.check('test-ip')
      const after = Date.now()

      expect(result.limit).toBe(3)
      // Reset time should be within the time window (1 second)
      expect(result.reset).toBeGreaterThanOrEqual(before)
      expect(result.reset).toBeLessThanOrEqual(after + 1000)
    })

    it('should reset after time window', async () => {
      // Use 3 requests
      await rateLimiter.check('test-ip')
      await rateLimiter.check('test-ip')
      await rateLimiter.check('test-ip')

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be allowed again
      const result = await rateLimiter.check('test-ip')
      expect(result.success).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset rate limit for specific identifier', async () => {
      await rateLimiter.check('test-ip')
      await rateLimiter.check('test-ip')
      await rateLimiter.check('test-ip')

      // Reset
      rateLimiter.reset('test-ip')

      // Should be allowed again
      const result = await rateLimiter.check('test-ip')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)
    })
  })

  describe('clear', () => {
    it('should clear all rate limit data', async () => {
      await rateLimiter.check('ip-1')
      await rateLimiter.check('ip-2')

      rateLimiter.clear()

      const stats = rateLimiter.getStats()
      expect(stats.totalIdentifiers).toBe(0)
      expect(stats.totalRequests).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await rateLimiter.check('ip-1')
      await rateLimiter.check('ip-1')
      await rateLimiter.check('ip-2')

      const stats = rateLimiter.getStats()
      expect(stats.totalIdentifiers).toBe(2)
      expect(stats.totalRequests).toBe(3)
    })
  })

  describe('presets', () => {
    it('should have correct preset configurations', () => {
      expect(RateLimitPresets.strict).toEqual({
        windowMs: 15 * 60 * 1000,
        max: 50,
      })

      expect(RateLimitPresets.moderate).toEqual({
        windowMs: 15 * 60 * 1000,
        max: 100,
      })

      expect(RateLimitPresets.relaxed).toEqual({
        windowMs: 15 * 60 * 1000,
        max: 200,
      })

      expect(RateLimitPresets.api).toEqual({
        windowMs: 1 * 60 * 1000,
        max: 60,
      })
    })
  })

  describe('createRateLimiter', () => {
    it('should create a rate limiter instance', () => {
      const limiter = createRateLimiter({
        windowMs: 1000,
        max: 5,
      })

      expect(limiter).toBeInstanceOf(RateLimiter)
    })
  })
})
