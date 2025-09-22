import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env/t3-env'

/**
 * Validates API key for internal endpoints
 * Uses X-API-Key header or apiKey query parameter
 */
export function validateApiKey(request: NextRequest): boolean {
    // Get API key from environment
    const validApiKey = env.INTERNAL_API_KEY

    if (!validApiKey) {
        // In development, allow access without key
        if (process.env.NODE_ENV === 'development') {
            return true
        }
        console.error('INTERNAL_API_KEY not configured')
        return false
    }

    // Check header first
    const headerKey = request.headers.get('X-API-Key')
    if (headerKey === validApiKey) {
        return true
    }

    // Check query parameter as fallback
    const url = new URL(request.url)
    const queryKey = url.searchParams.get('apiKey')
    if (queryKey === validApiKey) {
        return true
    }

    return false
}

/**
 * Middleware wrapper for API authentication
 */
export function withApiAuth(handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>) {
    return async (request: NextRequest, context?: unknown) => {
        // Validate API key
        if (!validateApiKey(request)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized - Invalid or missing API key',
                },
                { status: 401 },
            )
        }

        // Log the API call
        const url = new URL(request.url)

        // Call the actual handler
        try {
            return await handler(request, context)
        } catch (error) {
            console.error(`[API] Error in ${url.pathname}:`, error)
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Internal server error',
                },
                { status: 500 },
            )
        }
    }
}

/**
 * Rate limiting configuration
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000, // 1 minute
): boolean {
    const now = Date.now()
    const limit = rateLimitMap.get(identifier)

    if (!limit || now > limit.resetTime) {
        // Reset or initialize
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + windowMs,
        })
        return true
    }

    if (limit.count >= maxRequests) {
        return false
    }

    limit.count++
    return true
}
