'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DexTransactionResponse } from '@/interfaces/api.interface'
import { ProtocolType, IconIds } from '@/enums'
import { DEFAULT_TRANSACTION_LIMIT, TIME_INTERVALS, REFRESH_INTERVALS } from '@/config/app.config'
import { TransactionRowTemplate } from './tables/TableTemplates'
import { cn } from '@/utils'
import IconWrapper from '@/components/icons/IconWrapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import { DateWrapperAccurate } from '@/components/common/DateWrapper'
import StyledTooltip from '@/components/common/StyledTooltip'

interface TransactionHistoryProps {
    account: string
    limit?: number
    className?: string
}

async function fetchTransactions(account: string, limit: number = 10): Promise<DexTransactionResponse> {
    const params = new URLSearchParams({
        limit: limit.toString(),
    })

    const response = await fetch(`/api/transactions/${account}?${params}`)
    if (!response.ok) {
        throw new Error('Failed to fetch transactions')
    }
    return response.json()
}

export function TransactionHistoryTableHeader() {
    return (
        <TransactionRowTemplate
            time={<p className="truncate">Time</p>}
            hash={<p className="truncate">Tx Hash</p>}
            type={<p className="truncate">Type</p>}
            tokens={<p className="truncate">Tokens</p>}
            dex={<p className="truncate">DEX</p>}
            nonce={<p className="truncate text-right">Nonce</p>}
            status={<p className="truncate text-center">Status</p>}
            className="h-8 border-b border-default/10 text-sm text-default/50"
        />
    )
}

export function TransactionHistory({ account, limit = DEFAULT_TRANSACTION_LIMIT, className }: TransactionHistoryProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const { data, isLoading, error } = useQuery({
        queryKey: ['transactions', account, limit],
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
                    <TransactionHistoryTableHeader />
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
                    <TransactionHistoryTableHeader />
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
                    <TransactionHistoryTableHeader />
                    <div className="py-8 text-center text-default/50">
                        {data?.message ? 'Transaction history unavailable' : 'No recent transactions'}
                    </div>
                </div>
            </div>
        )
    }

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'swap':
                return 'text-blue-600 dark:text-blue-400'
            case 'addLiquidity':
                return 'text-green-600 dark:text-green-400'
            case 'removeLiquidity':
                return 'text-red-600 dark:text-red-400'
            case 'collect':
                return 'text-purple-600 dark:text-purple-400'
            case 'transfer':
                return 'text-indigo-600 dark:text-indigo-400'
            case 'contract':
                return 'text-orange-600 dark:text-orange-400'
            default:
                return 'text-default/50'
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'swap':
                return 'Swap'
            case 'addLiquidity':
                return 'Add Liquidity'
            case 'removeLiquidity':
                return 'Remove Liquidity'
            case 'collect':
                return 'Collect Fees'
            case 'transfer':
                return 'Transfer'
            case 'contract':
                return 'Contract Call'
            default:
                return type
        }
    }

    const getDexName = (dex: ProtocolType) => {
        const names: Record<ProtocolType, string> = {
            [ProtocolType.HYPERSWAP]: 'Hyperswap',
            [ProtocolType.HYBRA]: 'Hybra',
            [ProtocolType.PRJTX]: 'Project X',
            [ProtocolType.HYPERBRICK]: 'HyperBrick',
            [ProtocolType.HYPERDRIVE]: 'HyperDrive',
        }
        return names[dex] || '-'
    }

    const toggleRow = (txHash: string) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(txHash)) {
                newSet.delete(txHash)
            } else {
                newSet.add(txHash)
            }
            return newSet
        })
    }

    return (
        <div className={cn('overflow-x-auto', className)}>
            <div className="min-w-max">
                <TransactionHistoryTableHeader />
                <div className="divide-y divide-default/5">
                    {data.transactions.map((tx) => {
                        const isExpanded = expandedRows.has(tx.txHash)

                        return (
                            <div key={tx.txHash}>
                                <div onClick={() => toggleRow(tx.txHash)} className="cursor-pointer hover:bg-default/5">
                                    <TransactionRowTemplate
                                        time={
                                            <div className="flex items-center gap-1.5">
                                                <IconWrapper
                                                    id={isExpanded ? IconIds.CHEVRON_DOWN : IconIds.CHEVRON_RIGHT}
                                                    className="size-3 text-default/40"
                                                />
                                                <DateWrapperAccurate date={tx.timestamp * 1000} className="text-default/70" />
                                            </div>
                                        }
                                        hash={
                                            <StyledTooltip
                                                content={
                                                    <div className="space-y-1">
                                                        <p className="font-mono text-xs">{tx.txHash}</p>
                                                        <p className="text-xs text-default/70">Click to view on explorer</p>
                                                    </div>
                                                }
                                            >
                                                <LinkWrapper
                                                    href={`https://hyperevmscan.io/tx/${tx.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    {formatAddress(tx.txHash)}
                                                </LinkWrapper>
                                            </StyledTooltip>
                                        }
                                        type={<span className={getTypeColor(tx.type)}>{getTypeLabel(tx.type)}</span>}
                                        tokens={
                                            tx.token0Symbol && tx.token1Symbol ? (
                                                <span className="text-default/70">
                                                    {tx.token0Symbol}/{tx.token1Symbol}
                                                </span>
                                            ) : (
                                                <span className="text-default/30">-</span>
                                            )
                                        }
                                        dex={<span className="text-default/70">{getDexName(tx.dex)}</span>}
                                        nonce={<span className="text-default/50">{tx.nonce || '-'}</span>}
                                        status={
                                            <span
                                                className={cn(
                                                    'rounded px-2 py-0.5',
                                                    tx.status === 'success'
                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                        : 'bg-red-500/10 text-red-600 dark:text-red-400',
                                                )}
                                            >
                                                {tx.status === 'success' ? '✓' : '✗'}
                                            </span>
                                        }
                                        className="py-2"
                                    />
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-default/5 bg-default/5 px-4 py-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-default/50">From:</span>{' '}
                                                <span className="font-mono">{formatAddress(tx.from)}</span>
                                            </div>
                                            <div>
                                                <span className="text-default/50">To:</span>{' '}
                                                <span className="font-mono">
                                                    {formatAddress(tx.to || '0x0000000000000000000000000000000000000000')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-default/50">Block:</span> <span>{tx.blockNumber.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-default/50">Gas Used:</span> <span>{tx.gasUsed}</span>
                                            </div>
                                            {tx.token0Amount && (
                                                <div>
                                                    <span className="text-default/50">{tx.token0Symbol}:</span> <span>{tx.token0Amount}</span>
                                                </div>
                                            )}
                                            {tx.token1Amount && (
                                                <div>
                                                    <span className="text-default/50">{tx.token1Symbol}:</span> <span>{tx.token1Amount}</span>
                                                </div>
                                            )}
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
