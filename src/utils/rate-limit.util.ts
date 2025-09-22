/**
 * Rate limiting utility for API routes
 * Implements a simple in-memory rate limiter with sliding window
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const record = rateLimitMap.get(key)

    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
        return true
    }

    if (record.count >= maxRequests) {
        return false
    }

    record.count++
    return true
}

/**
 * Clean up expired rate limit records to prevent memory leaks
 * Should be called periodically in production
 */
export function cleanupRateLimits(): void {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key)
        }
    }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
