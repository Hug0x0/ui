import { NextResponse } from 'next/server'
import { HyperCoreService, type HyperCoreTransaction } from '@/services/explorers/hypercore.service'
import { DEFAULT_TRANSACTION_LIMIT } from '@/config/app.config'

interface CachedResponse {
    success: boolean
    account: string
    transactions: HyperCoreTransaction[]
    pagination: {
        limit: number
        total: number
        requestedLimit?: number
        actualLimit?: number
    }
}

// Simple in-memory cache for transactions
const transactionCache = new Map<string, { data: CachedResponse; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export async function GET(request: Request, context: { params: Promise<{ account: string }> }) {
    try {
        const params = await context.params
        const { account } = params

        if (!account) {
            return NextResponse.json({ success: false, error: 'Account address is required' }, { status: 400 })
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const requestedLimit = parseInt(searchParams.get('limit') || String(DEFAULT_TRANSACTION_LIMIT))
        const limit = Math.min(Math.max(1, requestedLimit), 500) // Clamp between 1 and 500

        // Check cache first
        const cacheKey = `${account}-${limit}`
        const cached = transactionCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

        // Create service instance
        const hypercoreService = new HyperCoreService()

        // Fetch transactions from HyperCore
        const transactions = await hypercoreService.getTransactionHistory(account, limit)

        const response: CachedResponse = {
            success: true,
            account,
            transactions,
            pagination: {
                limit,
                total: transactions.length,
                requestedLimit, // Include what was requested
                actualLimit: limit, // Include what was actually used
            },
        }

        // Cache the response
        transactionCache.set(cacheKey, {
            data: response,
            timestamp: Date.now(),
        })

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching HyperCore transactions:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch transactions',
            },
            { status: 500 },
        )
    }
}
