/**
 * Rate Limiter Configuration
 */
export interface RateLimiterConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests per window
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Timestamp when the limit resets
}

/**
 * In-Memory Rate Limiter
 * For production, consider using Redis or similar distributed cache
 */
export class RateLimiter {
  private readonly requests: Map<string, number[]> = new Map()
  private readonly config: RateLimiterConfig

  constructor(config: RateLimiterConfig) {
    this.config = config

    // Cleanup old entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  /**
   * Check if the request should be allowed
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get user's request timestamps
    const userRequests = this.requests.get(identifier) || []

    // Filter out requests outside the current window
    const validRequests = userRequests.filter(time => time > windowStart)

    const remaining = Math.max(0, this.config.max - validRequests.length)
    const reset = windowStart + this.config.windowMs

    // Check if limit is exceeded
    if (validRequests.length >= this.config.max) {
      this.requests.set(identifier, validRequests)
      return {
        success: false,
        limit: this.config.max,
        remaining: 0,
        reset,
      }
    }

    // Add current request timestamp
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return {
      success: true,
      limit: this.config.max,
      remaining: remaining - 1,
      reset,
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear()
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart)

      if (validTimestamps.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validTimestamps)
      }
    }
  }

  /**
   * Get current statistics
   */
  getStats(): {
    totalIdentifiers: number
    totalRequests: number
  } {
    let totalRequests = 0
    for (const timestamps of this.requests.values()) {
      totalRequests += timestamps.length
    }

    return {
      totalIdentifiers: this.requests.size,
      totalRequests,
    }
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config)
}

/**
 * Predefined rate limiter configurations
 */
export const RateLimitPresets = {
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
  },
  moderate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  relaxed: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute (1 per second average)
  },
} as const
