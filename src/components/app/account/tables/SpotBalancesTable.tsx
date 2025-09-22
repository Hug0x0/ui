'use client'

import { useState } from 'react'
import { SideBadge } from '@/components/common/SideBadge'
// import type { SpotBalance } from '@/interfaces'
import { IconIds } from '@/enums'
import FileMapper from '@/components/common/FileMapper'
import IconWrapper from '@/components/icons/IconWrapper'
import { getHyperCoreAssetBySymbol } from '@/config/hypercore-assets.config'
import { SpotRowTemplate } from './TableTemplates'
import { formatNumber, formatUSD } from '@/utils/format.util'
import { cn } from '@/utils'
import StyledTooltip from '@/components/common/StyledTooltip'
import { useAppStore } from '@/stores/app.store'
import { RoundedAmount } from '@/components/common/RoundedAmount'
import { EmptyTablePlaceholder } from './EmptyTablePlaceholder'
import numeral from 'numeral'
import LinkWrapper from '@/components/common/LinkWrapper'

interface SpotBalancesTableProps {
    className?: string
}

export function SpotBalancesTableHeader() {
    return (
        <SpotRowTemplate
            asset={
                <span role="columnheader" className="truncate">
                    Asset
                </span>
            }
            balance={
                <span role="columnheader" className="truncate text-right">
                    Balance
                </span>
            }
            value={
                <span role="columnheader" className="truncate text-right">
                    Value $
                </span>
            }
            price={
                <span role="columnheader" className="truncate text-right">
                    Price
                </span>
            }
            className="h-8 border-b border-default/10 text-sm text-default/50"
        />
    )
}

export function SpotBalancesTable({ className }: SpotBalancesTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // Get balances directly from the store
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const balances = snapshot?.positions?.idle?.spots || []

    if (!balances || balances.length === 0) {
        return <EmptyTablePlaceholder message="No spot balances" className={className} />
    }

    const toggleRow = (id: string) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const sortedBalances = [...balances].sort((a, b) => b.valueUSD - a.valueUSD)

    return (
        <div role="table" className={cn('overflow-x-auto', className)}>
            <div className="min-w-max">
                <SpotBalancesTableHeader />
                <div role="rowgroup" className="divide-y divide-default/5">
                    {sortedBalances.map((balance) => {
                        const isExpanded = expandedRows.has(balance.id)
                        const balanceNum = typeof balance.balance === 'string' ? parseFloat(balance.balance) : balance.balance
                        const displayBalance = balanceNum > 1e10 ? balanceNum / 1e18 : balanceNum
                        const price = balance.valueUSD > 0 && displayBalance > 0 ? balance.valueUSD / displayBalance : 0

                        return (
                            <div key={balance.id}>
                                <div onClick={() => toggleRow(balance.id)} className="cursor-pointer">
                                    <SpotRowTemplate
                                        asset={
                                            <div className="flex items-center gap-1.5">
                                                {getHyperCoreAssetBySymbol(balance.asset)?.fileId && (
                                                    <FileMapper
                                                        id={getHyperCoreAssetBySymbol(balance.asset)!.fileId}
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full"
                                                    />
                                                )}
                                                <span className="text-sm">{balance.asset}</span>
                                                {balance.asset === 'HYPE' && <SideBadge side="long">LONG</SideBadge>}
                                            </div>
                                        }
                                        balance={
                                            displayBalance > 0.0001 ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Exact Balance</p>
                                                                <p className="text-sm font-medium">
                                                                    {formatNumber(displayBalance, 8)} {balance.asset}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Raw Value</p>
                                                                <p className="text-sm font-medium">{balance.balance}</p>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <span className="font-medium hover:underline">
                                                        {formatNumber(displayBalance, balance.asset === 'HYPE' ? 4 : 2)}
                                                    </span>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/50">-</span>
                                            )
                                        }
                                        value={<RoundedAmount amount={balance.valueUSD}>{formatUSD(balance.valueUSD)}</RoundedAmount>}
                                        price={
                                            price > 0 ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">{balance.asset} Price</p>
                                                                <p className="text-sm font-medium">{formatUSD(price)}</p>
                                                            </div>
                                                            {balance.asset === 'HYPE' && (
                                                                <div>
                                                                    <p className="text-sm font-medium opacity-60">Market Cap</p>
                                                                    <p className="text-sm font-medium">{formatUSD(price * 1000000000)}</p>
                                                                </div>
                                                            )}
                                                            {(balance.asset === 'USDC' || balance.asset === 'USDT0') && (
                                                                <div>
                                                                    <p className="text-sm font-medium opacity-60">Peg Deviation</p>
                                                                    <p
                                                                        className={cn(
                                                                            'text-sm font-medium',
                                                                            Math.abs(price - 1) < 0.01 ? 'text-green-600' : 'text-orange-500',
                                                                        )}
                                                                    >
                                                                        {((price - 1) * 100).toFixed(3)}%
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    }
                                                >
                                                    <span className="hover:underline">{formatUSD(price)}</span>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/30">-</span>
                                            )
                                        }
                                        className="h-10 text-xs transition-colors hover:bg-default/5"
                                    />
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="space-y-4 border-t border-default/10 bg-default/5 px-4 py-4">
                                        {/* Spot Balance Details Grid */}
                                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-4">
                                            {/* Asset Information Section */}
                                            <div className="col-span-full mb-2">
                                                <h4 className="text-sm font-semibold text-default/80">Asset Details</h4>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Symbol</p>
                                                <p className="text-sm font-medium">{balance.asset}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Platform</p>
                                                <p className="text-sm font-medium">HyperCore</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Type</p>
                                                <p className="text-sm font-medium">Spot Asset</p>
                                            </div>

                                            {balance.asset === 'HYPE' && (
                                                <div>
                                                    <p className="text-sm text-default/50">Position Type</p>
                                                    <p className="text-sm font-medium text-green-600">LONG</p>
                                                </div>
                                            )}

                                            {balance.asset === 'USDC' && (
                                                <div>
                                                    <p className="text-sm text-default/50">Function</p>
                                                    <p className="text-sm font-medium">Margin Collateral</p>
                                                </div>
                                            )}

                                            {balance.asset === 'USDT0' && (
                                                <div>
                                                    <p className="text-sm text-default/50">Type</p>
                                                    <p className="text-sm font-medium">Stablecoin</p>
                                                </div>
                                            )}

                                            {/* Balance Information Section */}
                                            <div className="col-span-full mb-2 mt-3">
                                                <h4 className="text-sm font-semibold text-default/80">Balance Information</h4>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Raw Balance</p>
                                                <p className="text-sm">{balance.balance.toString()}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Formatted Balance</p>
                                                <p className="text-sm font-medium">{formatNumber(displayBalance, 8)}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Display Amount</p>
                                                <p className="text-sm font-medium">
                                                    {formatNumber(displayBalance, balance.asset === 'HYPE' ? 4 : 2)}
                                                </p>
                                            </div>

                                            {/* Percentage of total spot value */}
                                            {(() => {
                                                const totalValue = balances.reduce((sum, b) => sum + b.valueUSD, 0)
                                                const percentage = totalValue > 0 ? (balance.valueUSD / totalValue) * 100 : 0
                                                return (
                                                    <div>
                                                        <p className="text-sm text-default/50">% of Spot</p>
                                                        <p className="text-sm font-medium">{numeral(percentage / 100).format('0,0.0%')}</p>
                                                    </div>
                                                )
                                            })()}

                                            {/* Value & Pricing Section */}
                                            <div className="col-span-full mb-2 mt-3">
                                                <h4 className="text-sm font-semibold text-default/80">Value & Pricing</h4>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Current Price</p>
                                                <p className="text-sm font-medium">{price > 0 ? formatUSD(price) : 'N/A'}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-default/50">Total Value</p>
                                                <p className="text-sm font-bold text-primary">{formatUSD(balance.valueUSD)}</p>
                                            </div>

                                            {balance.asset === 'HYPE' && price > 0 && (
                                                <>
                                                    <div>
                                                        <p className="text-sm text-default/50">Market Cap (Est)</p>
                                                        <p className="text-sm font-medium">{formatUSD(price * 1000000000)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-default/50">FDV</p>
                                                        <p className="text-sm font-medium">{formatUSD(price * 1000000000)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-default/50">Delta Exposure</p>
                                                        <p className="text-sm font-medium text-green-600">+{formatNumber(displayBalance, 2)} HYPE</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-default/50">24h Volume</p>
                                                        <p className="text-sm font-medium text-default/50">-</p>
                                                    </div>
                                                </>
                                            )}

                                            {/* Collateral & Risk Info for USDC */}
                                            {balance.asset === 'USDC' && (
                                                <>
                                                    <div className="col-span-full mb-2 mt-3">
                                                        <h4 className="text-sm font-semibold text-default/80">Collateral Information</h4>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Peg Status</p>
                                                        <p
                                                            className={cn(
                                                                'font-medium',
                                                                Math.abs(price - 1) < 0.01 ? 'text-green-600' : 'text-orange-500',
                                                            )}
                                                        >
                                                            {Math.abs(price - 1) < 0.01 ? '✓ Stable' : '⚠ Off-peg'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Deviation</p>
                                                        <p
                                                            className={cn(
                                                                'font-medium',
                                                                Math.abs(price - 1) < 0.001
                                                                    ? 'text-green-600'
                                                                    : Math.abs(price - 1) < 0.01
                                                                      ? 'text-yellow-500'
                                                                      : 'text-orange-500',
                                                            )}
                                                        >
                                                            {price > 1 ? '+' : ''}
                                                            {((price - 1) * 100).toFixed(3)}%
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Available as Margin</p>
                                                        <p className="text-sm font-medium text-green-600">✓ Yes</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Max Leverage</p>
                                                        <p className="text-sm font-medium">50x</p>
                                                    </div>
                                                </>
                                            )}

                                            {/* USDT0 Stablecoin Info */}
                                            {balance.asset === 'USDT0' && (
                                                <>
                                                    <div className="col-span-full mb-2 mt-3">
                                                        <h4 className="text-sm font-semibold text-default/80">Stablecoin Information</h4>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Peg Status</p>
                                                        <p
                                                            className={cn(
                                                                'font-medium',
                                                                Math.abs(price - 1) < 0.01 ? 'text-green-600' : 'text-orange-500',
                                                            )}
                                                        >
                                                            {Math.abs(price - 1) < 0.01 ? '✓ Stable' : '⚠ Off-peg'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Deviation</p>
                                                        <p
                                                            className={cn(
                                                                'font-medium',
                                                                Math.abs(price - 1) < 0.001
                                                                    ? 'text-green-600'
                                                                    : Math.abs(price - 1) < 0.01
                                                                      ? 'text-yellow-500'
                                                                      : 'text-orange-500',
                                                            )}
                                                        >
                                                            {price > 1 ? '+' : ''}
                                                            {((price - 1) * 100).toFixed(3)}%
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-default/50">Bridge</p>
                                                        <p className="text-sm font-medium">Hyperliquid Native</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Note about USDC collateral */}
                                        {balance.asset === 'USDC' && (
                                            <div className="col-span-full mt-2 text-sm text-default/40">
                                                * USDC is used as margin collateral for perpetual positions
                                            </div>
                                        )}

                                        {/* Raw JSON Data */}
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-sm text-default/40">Raw data available via tooltips →</span>
                                            <div className="flex gap-2">
                                                <StyledTooltip
                                                    content={
                                                        <pre className="max-h-96 max-w-2xl overflow-auto text-sm">
                                                            {JSON.stringify(balance, null, 2)}
                                                        </pre>
                                                    }
                                                    placement="left"
                                                >
                                                    <div className="flex cursor-help items-center gap-1 rounded bg-default/10 px-2 py-1 text-sm hover:bg-default/20">
                                                        <IconWrapper id={IconIds.INFORMATION} className="size-3 text-default/60" />
                                                        <span className="text-default/60">Balance</span>
                                                    </div>
                                                </StyledTooltip>
                                                <LinkWrapper href={`https://app.hyperliquid.xyz/portfolio/spot`} target="_blank">
                                                    <div className="flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-sm hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30">
                                                        <IconWrapper id={IconIds.ARROW_UP_RIGHT} className="size-3 text-purple-600" />
                                                        <span className="text-purple-600">HyperCore</span>
                                                    </div>
                                                </LinkWrapper>
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
