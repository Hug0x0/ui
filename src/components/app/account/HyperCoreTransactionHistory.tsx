'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { HyperCoreTransactionResponse } from '@/interfaces/api.interface'
import { DEFAULT_TRANSACTION_LIMIT, TIME_INTERVALS, REFRESH_INTERVALS } from '@/config/app.config'
import { getHyperCoreAssetBySymbol } from '@/config/hypercore-assets.config'
import { HyperCoreTradeRowTemplate } from './tables/TableTemplates'
import { cn, formatUSD, shortenValue } from '@/utils'
import { IconIds } from '@/enums'
import IconWrapper from '@/components/icons/IconWrapper'
import { DateWrapperAccurate } from '@/components/common/DateWrapper'
import StyledTooltip from '@/components/common/StyledTooltip'
import LinkWrapper from '@/components/common/LinkWrapper'
import { SideBadge } from '@/components/common/SideBadge'

interface HyperCoreTransactionHistoryProps {
    account: string
    limit?: number
    className?: string
}

async function fetchTransactions(account: string, limit: number): Promise<HyperCoreTransactionResponse> {
    const params = new URLSearchParams({
        limit: limit.toString(),
    })

    const response = await fetch(`/api/trades/${account}?${params}`)
    if (!response.ok) {
        throw new Error('Failed to fetch HyperCore trades')
    }
    return response.json()
}

export function HyperCoreTransactionHistoryTableHeader() {
    return (
        <HyperCoreTradeRowTemplate
            time={<p className="truncate">Time</p>}
            hash={<p className="truncate">Trade ID</p>}
            type={<p className="truncate">Type</p>}
            coin={<p className="truncate">Coin</p>}
            side={<p className="truncate">Side</p>}
            size={<p className="truncate text-right">Size</p>}
            price={<p className="truncate text-right">Price</p>}
            value={<p className="truncate text-right">Value</p>}
            pnl={<p className="truncate text-right">PnL</p>}
            className="h-8 border-b border-default/10 text-xs text-default/50"
        />
    )
}

export function HyperCoreTransactionHistory({ account, limit = DEFAULT_TRANSACTION_LIMIT, className }: HyperCoreTransactionHistoryProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const { data, isLoading, error } = useQuery({
        queryKey: ['hypercore-trades', account, limit],
        queryFn: () => fetchTransactions(account, limit),
        enabled: !!account,
        staleTime: TIME_INTERVALS.MINUTE_1,
        gcTime: REFRESH_INTERVALS.CACHE_GC,
        refetchOnWindowFocus: false,
    })

    if (isLoading) {
        return (
            <div className={cn('overflow-x-auto', className)}>
                <div className="min-w-max">
                    <HyperCoreTransactionHistoryTableHeader />
                    <div className="space-y-1 py-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 animate-pulse rounded bg-default/5" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={cn('overflow-x-auto', className)}>
                <div className="min-w-max">
                    <HyperCoreTransactionHistoryTableHeader />
                    <div className="py-8 text-center text-sm text-red-500">
                        Error: {error instanceof Error ? error.message : 'Failed to load transactions'}
                    </div>
                </div>
            </div>
        )
    }

    if (!data?.success || !data.transactions || data.transactions.length === 0) {
        return (
            <div className={cn('overflow-x-auto', className)}>
                <div className="min-w-max">
                    <HyperCoreTransactionHistoryTableHeader />
                    <div className="py-8 text-center text-default/50">No recent trades</div>
                </div>
            </div>
        )
    }

    const formatSize = (size: number, coin: string) => {
        const asset = getHyperCoreAssetBySymbol(coin)
        const decimals = asset?.decimalsForRounding ?? 4
        return size.toFixed(decimals)
    }

    const formatPrice = (price: number) => {
        return `$${price.toFixed(2)}`
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'trade':
                return 'text-blue-600 dark:text-blue-400'
            case 'liquidation':
                return 'text-red-600 dark:text-red-400'
            case 'funding':
                return 'text-purple-600 dark:text-purple-400'
            default:
                return 'text-default/50'
        }
    }

    const toggleRow = (hash: string, index: number) => {
        const key = `${hash}-${index}`
        setExpandedRows((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(key)) {
                newSet.delete(key)
            } else {
                newSet.add(key)
            }
            return newSet
        })
    }

    // Get HyperLiquid explorer URL
    const getExplorerUrl = (address: string) => {
        return `https://app.hyperliquid.xyz/explorer/tx/${address}`
    }

    return (
        <div className={cn('overflow-x-auto', className)}>
            <div className="min-w-max">
                <HyperCoreTransactionHistoryTableHeader />
                <div className="divide-y divide-default/5">
                    {data.transactions.map((tx, index) => {
                        const key = `${tx.hash}-${index}`
                        const isExpanded = expandedRows.has(key)

                        return (
                            <div key={key}>
                                <div onClick={() => toggleRow(tx.hash, index)} className="cursor-pointer hover:bg-default/5">
                                    <HyperCoreTradeRowTemplate
                                        time={
                                            <div className="flex items-center gap-1.5">
                                                <IconWrapper
                                                    id={isExpanded ? IconIds.CHEVRON_DOWN : IconIds.CHEVRON_RIGHT}
                                                    className="size-3 text-default/40"
                                                />
                                                <DateWrapperAccurate date={tx.timestamp} className="text-default/70" />
                                            </div>
                                        }
                                        hash={
                                            <StyledTooltip
                                                content={
                                                    <div className="space-y-1">
                                                        <p className="font-mono text-xs">{tx.hash}</p>
                                                        <p className="text-xs text-default/70">Click to view on HyperLiquid</p>
                                                    </div>
                                                }
                                            >
                                                <LinkWrapper
                                                    href={getExplorerUrl(tx.hash)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    {shortenValue(tx.hash)}
                                                </LinkWrapper>
                                            </StyledTooltip>
                                        }
                                        type={<span className={cn('capitalize', getTypeColor(tx.type))}>{tx.type}</span>}
                                        coin={<span className="font-medium text-default">{tx.coin}</span>}
                                        side={<SideBadge side={tx.side}>{tx.side.toUpperCase()}</SideBadge>}
                                        size={<span className="text-default/70">{formatSize(tx.size, tx.coin)}</span>}
                                        price={<span className="text-default/70">{formatPrice(tx.price)}</span>}
                                        value={<span className="text-default">{formatUSD(tx.value)}</span>}
                                        pnl={
                                            tx.pnl !== undefined ? (
                                                <span
                                                    className={cn(
                                                        tx.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                                                    )}
                                                >
                                                    {tx.pnl >= 0 ? '+' : ''}
                                                    {formatUSD(tx.pnl)}
                                                </span>
                                            ) : (
                                                <span className="text-default/30">-</span>
                                            )
                                        }
                                        className="py-2"
                                    />
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-default/5 bg-default/5 px-4 py-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-default/50">Trade Hash</span>{' '}
                                                <span className="font-mono">{tx.hash.slice(0, 16)}...</span>
                                            </div>
                                            <div>
                                                <span className="text-default/50">Status</span>{' '}
                                                <span
                                                    className={
                                                        tx.status === 'success'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }
                                                >
                                                    {tx.status}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-default/50">Fee</span> <span>{tx.fee ? formatUSD(tx.fee) : '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-default/50">Notional</span> <span>{formatUSD(tx.value)}</span>
                                            </div>
                                            {tx.fundingRate !== undefined && (
                                                <div>
                                                    <span className="text-default/50">Funding Rate</span>{' '}
                                                    <span>{(tx.fundingRate * 100).toFixed(4)}%</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-default/50">Timestamp</span>{' '}
                                                <span>{new Date(tx.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
