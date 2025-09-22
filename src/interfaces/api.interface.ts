/**
 * API response interfaces
 */

import type { ParsedDexTransaction } from './explorer.interface'
import type { HyperCoreTransaction } from '@/services/explorers/hypercore.service'
import type { ProtocolType } from '@/enums'

// Generic transaction response for HyperEVM
export interface DexTransactionResponse {
    success: boolean
    transactions: ParsedDexTransaction[]
    stats: {
        total: number
        byType: Record<string, number>
        byDex: Record<ProtocolType, number>
        successful: number
        failed: number
    }
    pagination: {
        limit: number
        startBlock?: number
        endBlock?: number
        total: number
        filteredCount: number
    }
    message?: string // Optional message for API key not configured
}

// Transaction response for HyperCore
export interface HyperCoreTransactionResponse {
    success: boolean
    transactions: HyperCoreTransaction[]
    pagination: {
        limit: number
        total: number
    }
}

export interface PaginatedResponse<T> {
    data: T[]
    count: number
    hasMore: boolean
    nextCursor?: string
}

export interface ApiError {
    error: string
    message?: string
    statusCode?: number
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
}
