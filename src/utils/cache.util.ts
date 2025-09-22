import { NextResponse } from 'next/server'

/**
 * Simple in-memory cache implementation
 */
export class MemoryCache<T> {
    private cache = new Map<string, { data: T; timestamp: number }>()
    private maxSize: number
    private ttl: number

    constructor(ttlMs: number, maxSize = 100) {
        this.ttl = ttlMs
        this.maxSize = maxSize
    }

    get(key: string): T | null {
        const cached = this.cache.get(key)
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.data
        }
        return null
    }

    set(key: string, data: T): void {
        // Clean up old entries if cache is too large
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            if (firstKey) this.cache.delete(firstKey)
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        })
    }

    getCacheAge(key: string): number | null {
        const cached = this.cache.get(key)
        if (cached) {
            return Date.now() - cached.timestamp
        }
        return null
    }

    clear(): void {
        this.cache.clear()
    }
}

/**
 * Helper to create cached API response with cache headers
 */
export function createCachedResponse<T>(data: T, cacheHit: boolean, cacheAge?: number | null): NextResponse<T> {
    const headers: Record<string, string> = {
        'X-Cache': cacheHit ? 'HIT' : 'MISS',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
    }

    if (cacheHit && cacheAge !== null && cacheAge !== undefined) {
        headers['X-Cache-Age'] = String(cacheAge)
    }

    return NextResponse.json(data, { headers })
}
