import { NextResponse } from 'next/server'
import { HyperEVMScanService } from '@/services/explorers/hyperevmscan.service'
import { filterDexTransactions, groupTransactionsByDex, getTransactionStats } from '@/services/explorers/transaction-parser'
import type { ParsedDexTransaction } from '@/interfaces'
import { ProtocolType } from '@/enums'
import { env } from '@/env/t3-env'

interface CachedResponse {
    success: boolean
    account: string
    transactions: ParsedDexTransaction[]
    groupedByDex: Record<ProtocolType, ParsedDexTransaction[]>
    stats: ReturnType<typeof getTransactionStats>
    pagination: {
        limit: number
        startBlock?: number
        endBlock?: number
        total: number
        filteredCount: number
        requestedLimit?: number
        actualLimit?: number
    }
    message?: string
}

// Simple in-memory cache for transactions
const transactionCache = new Map<string, { data: CachedResponse; timestamp: number }>()
const CACHE_TTL = 5000 // 5 seconds cache

export async function GET(request: Request, context: { params: Promise<{ account: string }> }) {
    try {
        const params = await context.params
        const { account } = params

        if (!account) {
            return NextResponse.json({ success: false, error: 'Account address is required' }, { status: 400 })
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const requestedLimit = parseInt(searchParams.get('limit') || '100')
        const limit = Math.min(Math.max(1, requestedLimit), 1000) // Clamp between 1 and 1000
        const startBlock = searchParams.get('startblock') ? parseInt(searchParams.get('startblock')!) : undefined
        const endBlock = searchParams.get('endblock') ? parseInt(searchParams.get('endblock')!) : undefined
        const onlyHypeUsdt = searchParams.get('onlyHypeUsdt') === 'true'

        // Parse DEX protocols from query
        const dexParam = searchParams.get('dexes')
        const targetDexes = dexParam
            ? (dexParam.split(',').filter((d) => Object.values(ProtocolType).includes(d as ProtocolType)) as ProtocolType[])
            : [ProtocolType.HYPERSWAP, ProtocolType.HYBRA, ProtocolType.PRJTX, ProtocolType.HYPERBRICK]

        // Check cache first
        const cacheKey = `${account}-${limit}-${onlyHypeUsdt}-${dexParam || 'all'}`
        const cached = transactionCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

        // Try to proceed even without API key (some explorers work without it for basic queries)
        if (!env.HYPEREVM_SCAN_API_KEY) {
            console.warn('HYPEREVM_SCAN_API_KEY not configured - attempting without API key')
        }

        // Create service instance (with or without API key)
        const hyperevmscanService = new HyperEVMScanService({
            apiKey: env.HYPEREVM_SCAN_API_KEY || undefined,
        })

        try {
            // Fetch transactions from HyperEVMScan
            const transactions = await hyperevmscanService.getTransactions({
                address: account,
                limit,
                startBlock,
                endBlock,
            })

            // If we got no transactions, return empty array
            if (transactions.length === 0) {
                return NextResponse.json({
                    success: true,
                    account,
                    transactions: [],
                    groupedByDex: {},
                    stats: {
                        total: 0,
                        byType: {
                            swap: 0,
                            addLiquidity: 0,
                            removeLiquidity: 0,
                            collect: 0,
                            mint: 0,
                            burn: 0,
                            unknown: 0,
                        },
                        byDex: {},
                        successful: 0,
                        failed: 0,
                    },
                    pagination: {
                        limit,
                        startBlock,
                        endBlock,
                        total: 0,
                        filteredCount: 0,
                        requestedLimit,
                        actualLimit: limit,
                    },
                    message: env.HYPEREVM_SCAN_API_KEY ? undefined : 'Explorer API key not configured',
                })
            }

            // Parse all transactions into a standardized format
            const parsedTransactions: ParsedDexTransaction[] = transactions.slice(0, limit).map((tx) => ({
                txHash: tx.hash,
                blockNumber: tx.blockNumber,
                timestamp: tx.timestamp,
                from: tx.from,
                to: tx.to || '',
                gasUsed: tx.gasUsed,
                status: tx.status,
                nonce: tx.nonce,
                type: tx.functionName?.includes('swap')
                    ? 'swap'
                    : tx.functionName?.includes('mint') || tx.functionName?.includes('add')
                      ? 'addLiquidity'
                      : tx.functionName?.includes('burn') || tx.functionName?.includes('remove')
                        ? 'removeLiquidity'
                        : tx.functionName?.includes('collect')
                          ? 'collect'
                          : 'unknown',
                dex: ProtocolType.HYPERSWAP, // Default to HYPERSWAP for now
                token0Symbol: '',
                token1Symbol: '',
                token0Amount: '',
                token1Amount: '',
                poolAddress: tx.to || '',
            }))

            // Try to get DEX-specific transactions for better parsing
            const dexTransactions = filterDexTransactions(transactions, {
                dexProtocols: targetDexes,
                onlyHypeUsdt: false, // Don't filter by token pair
            })

            // Use DEX transactions if available, otherwise use all transactions
            const finalTransactions = dexTransactions.length > 0 ? dexTransactions : parsedTransactions

            // Group by DEX (only meaningful for actual DEX transactions)
            const groupedByDex =
                dexTransactions.length > 0
                    ? groupTransactionsByDex(dexTransactions)
                    : ({
                          [ProtocolType.HYPERSWAP]: [],
                          [ProtocolType.PRJTX]: [],
                          [ProtocolType.HYBRA]: [],
                          [ProtocolType.HYPERBRICK]: [],
                          [ProtocolType.HYPERDRIVE]: [],
                      } as Record<ProtocolType, ParsedDexTransaction[]>)

            // Get statistics
            const stats = getTransactionStats(finalTransactions)

            const responseData = {
                success: true,
                account,
                transactions: finalTransactions,
                groupedByDex,
                stats,
                pagination: {
                    limit,
                    startBlock,
                    endBlock,
                    total: transactions.length,
                    filteredCount: finalTransactions.length,
                    requestedLimit,
                    actualLimit: limit,
                },
            }

            // Cache the response
            transactionCache.set(cacheKey, {
                data: responseData,
                timestamp: Date.now(),
            })

            // Clean old cache entries periodically
            if (transactionCache.size > 100) {
                const now = Date.now()
                for (const [key, value] of transactionCache.entries()) {
                    if (now - value.timestamp > CACHE_TTL * 2) {
                        transactionCache.delete(key)
                    }
                }
            }

            return NextResponse.json(responseData)
        } catch (innerError) {
            console.error('Error processing transactions:', innerError)
            // Return empty transactions on error
            return NextResponse.json({
                success: true,
                account,
                transactions: [],
                groupedByDex: {},
                stats: {
                    total: 0,
                    byType: {
                        swap: 0,
                        addLiquidity: 0,
                        removeLiquidity: 0,
                        collect: 0,
                        mint: 0,
                        burn: 0,
                        unknown: 0,
                    },
                    byDex: {},
                    successful: 0,
                    failed: 0,
                },
                pagination: {
                    limit,
                    startBlock,
                    endBlock,
                    total: 0,
                    filteredCount: 0,
                },
                message: 'Failed to fetch transactions',
            })
        }
    } catch (error) {
        console.error('Error fetching account transactions:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch transactions',
            },
            { status: 500 },
        )
    }
}
