/**
 * Shared validation utilities
 */

/**
 * Validate Twitter ID format
 * @param twitterId - Twitter ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidTwitterId(twitterId: string): boolean {
    if (!twitterId || typeof twitterId !== 'string') {
        return false
    }
    // Twitter IDs are numeric strings between 5-20 characters
    return /^\d+$/.test(twitterId) && twitterId.length >= 5 && twitterId.length <= 20
}

/**
 * Validate Twitter handle format
 * @param handle - Twitter handle to validate
 * @returns true if valid, false otherwise
 */
export function isValidTwitterHandle(handle: string): boolean {
    if (!handle || typeof handle !== 'string') {
        return false
    }
    // Twitter handles are 1-15 characters, alphanumeric and underscore only
    return /^[a-zA-Z0-9_]{1,15}$/.test(handle)
}

/**
 * Sanitize string input to prevent XSS
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(input: string | null | undefined, maxLength: number = 100): string {
    if (!input) return ''
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, maxLength)
        .trim()
}

/**
 * Get client IP address from request headers
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
    return ip
}
