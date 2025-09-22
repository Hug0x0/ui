'use client'

import { useState } from 'react'
import { SideBadge } from '@/components/common/SideBadge'
// import type { HyperEvmBalance } from '@/interfaces'
import { FileIds, IconIds } from '@/enums'
import FileMapper from '@/components/common/FileMapper'
import IconWrapper from '@/components/icons/IconWrapper'
import { WalletRowTemplate } from './TableTemplates'
import { formatNumber, formatUSD } from '@/utils/format.util'
import { cn, shortenValue } from '@/utils'
import { NATIVE_HYPE_ADDRESS } from '@/config/hyperevm-tokens.config'
import StyledTooltip from '@/components/common/StyledTooltip'
import { useAppStore } from '@/stores/app.store'
import { RoundedAmount } from '@/components/common/RoundedAmount'
import { EmptyTablePlaceholder } from './EmptyTablePlaceholder'
import numeral from 'numeral'
import LinkWrapper from '@/components/common/LinkWrapper'

interface WalletBalancesTableProps {
    className?: string
}

export function WalletBalancesTableHeader() {
    return (
        <WalletRowTemplate
            token={
                <span role="columnheader" className="truncate">
                    Token
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
            address={
                <span role="columnheader" className="truncate">
                    Address
                </span>
            }
            className="h-8 border-b border-default/10 text-xs text-default/50"
        />
    )
}

export function WalletBalancesTable({ className }: WalletBalancesTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // Get balances directly from the store
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const balances = snapshot?.positions?.idle?.balances || []

    if (!balances || balances.length === 0) {
        return <EmptyTablePlaceholder message="No wallet balances" className={className} />
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
                <WalletBalancesTableHeader />
                <div role="rowgroup" className="divide-y divide-default/5">
                    {sortedBalances
                        .sort((a, b) => a.symbol.localeCompare(b.symbol))
                        .map((balance) => {
                            const isExpanded = expandedRows.has(balance.id)
                            const formattedBalance = Number(balance.balance) / 10 ** balance.decimals
                            const price = balance.valueUSD / formattedBalance

                            return (
                                <div key={balance.id}>
                                    <div onClick={() => toggleRow(balance.id)} className="cursor-pointer">
                                        <WalletRowTemplate
                                            token={
                                                <div className="flex items-center gap-1.5">
                                                    <FileMapper
                                                        id={
                                                            balance.symbol === 'HYPE' || balance.symbol === 'WHYPE'
                                                                ? FileIds.TOKEN_HYPE
                                                                : balance.symbol === 'USDT0'
                                                                  ? FileIds.TOKEN_USDT0
                                                                  : balance.symbol === 'USDC'
                                                                    ? FileIds.TOKEN_USDC
                                                                    : undefined
                                                        }
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full"
                                                    />
                                                    <span className="text-default">{balance.symbol}</span>
                                                    {(balance.symbol === 'HYPE' || balance.symbol === 'WHYPE') && (
                                                        <SideBadge side="long">LONG</SideBadge>
                                                    )}
                                                </div>
                                            }
                                            balance={
                                                formattedBalance > 0.0001 ? (
                                                    <StyledTooltip content={`${formatNumber(formattedBalance, 8)} ${balance.symbol}`}>
                                                        <span className="font-medium hover:underline">
                                                            {formatNumber(formattedBalance, balance.decimals === 18 ? 4 : 2)}
                                                        </span>
                                                    </StyledTooltip>
                                                ) : (
                                                    <span className="text-default/50">-</span>
                                                )
                                            }
                                            value={<RoundedAmount amount={balance.valueUSD}>{formatUSD(balance.valueUSD)}</RoundedAmount>}
                                            price={
                                                formattedBalance > 0 ? (
                                                    <StyledTooltip
                                                        content={
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-sm text-default/50">Price per {balance.symbol}</p>
                                                                <p>{formatUSD(price)}</p>
                                                                {balance.symbol === 'HYPE' && (
                                                                    <>
                                                                        <p className="text-sm text-default/50">Market Cap</p>
                                                                        <p>{formatUSD(price * 1000000000)}</p>
                                                                    </>
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
                                            address={
                                                balance.address === NATIVE_HYPE_ADDRESS ? (
                                                    <span className="text-default/70">Native</span>
                                                ) : (
                                                    <StyledTooltip content={balance.address}>
                                                        <LinkWrapper href={`https://hyperevmscan.io/address/${balance.address}`} target="_blank">
                                                            <span className="truncate text-default/70 hover:text-default hover:underline">
                                                                {shortenValue(balance.address)}
                                                            </span>
                                                        </LinkWrapper>
                                                    </StyledTooltip>
                                                )
                                            }
                                            className="h-10 text-sm transition-colors hover:bg-default/5"
                                        />
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="space-y-4 border-t border-default/10 bg-default/5 px-4 py-4">
                                            {/* Token Details Grid */}
                                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-4">
                                                {/* Token Information Section */}
                                                <div className="col-span-full mb-2">
                                                    <h4 className="text-sm font-semibold text-default/80">Token Details</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Symbol</p>
                                                    <p className="text-sm font-medium">{balance.symbol}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Decimals</p>
                                                    <p className="text-sm font-medium">{balance.decimals}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Type</p>
                                                    <p className="text-sm font-medium">
                                                        {balance.address === NATIVE_HYPE_ADDRESS ? 'Native Token' : 'ERC-20'}
                                                    </p>
                                                </div>

                                                {balance.symbol === 'HYPE' && (
                                                    <div>
                                                        <p className="text-sm text-default/50">Position Type</p>
                                                        <p className="font-medium text-green-600">LONG</p>
                                                    </div>
                                                )}

                                                {/* Contract Address - Full Width */}
                                                <div className="col-span-2">
                                                    <p className="text-sm text-default/50">Contract Address</p>
                                                    <p className="break-all text-sm">
                                                        {balance.address === NATIVE_HYPE_ADDRESS ? 'Native Token (No Contract)' : balance.address}
                                                    </p>
                                                </div>

                                                {/* Balance Information Section */}
                                                <div className="col-span-full mb-2 mt-3">
                                                    <h4 className="text-sm font-semibold text-default/80">Balance Information</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Raw Balance</p>
                                                    <p className="text-sm">{balance.balance}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Formatted Balance</p>
                                                    <p className="text-sm font-medium">{formatNumber(formattedBalance, 8)}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Display Amount</p>
                                                    <p className="text-sm font-medium">
                                                        {formatNumber(formattedBalance, balance.decimals === 18 ? 4 : 2)}
                                                    </p>
                                                </div>

                                                {/* Percentage of total wallet value */}
                                                {(() => {
                                                    const totalValue = balances.reduce((sum, b) => sum + b.valueUSD, 0)
                                                    const percentage = totalValue > 0 ? (balance.valueUSD / totalValue) * 100 : 0
                                                    return (
                                                        <div>
                                                            <p className="text-sm text-default/50">% of Wallet</p>
                                                            <p className="text-sm font-medium">{numeral(percentage / 100).format('0,0.0%')}</p>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Value & Pricing Section */}
                                                <div className="col-span-full mb-2 mt-3">
                                                    <h4 className="text-sm font-semibold text-default/80">Value & Pricing</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Price per Token</p>
                                                    <p className="text-sm font-medium">{formatUSD(price)}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Total Value</p>
                                                    <p className="font-bold text-primary">{formatUSD(balance.valueUSD)}</p>
                                                </div>

                                                {balance.symbol === 'HYPE' && (
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
                                                            <p className="font-medium text-green-600">+{formatNumber(formattedBalance, 2)} HYPE</p>
                                                        </div>
                                                    </>
                                                )}

                                                {(balance.symbol === 'USDT0' || balance.symbol === 'USDC') && (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-default/50">Type</p>
                                                            <p className="text-sm font-medium">Stablecoin</p>
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
                                                    </>
                                                )}
                                            </div>

                                            {/* Note about native token */}
                                            {balance.address === NATIVE_HYPE_ADDRESS && (
                                                <div className="col-span-full mt-2 text-sm text-default/40">
                                                    * Native HYPE is the gas token for HyperEVM
                                                </div>
                                            )}

                                            {/* Raw JSON Data */}
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-sm text-default/40">Raw data available via tooltips →</span>
                                                <div className="flex gap-2">
                                                    <StyledTooltip
                                                        content={
                                                            <pre className="max-h-96 max-w-2xl overflow-auto text-xs">
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
                                                    {balance.address !== NATIVE_HYPE_ADDRESS && (
                                                        <LinkWrapper href={`https://hyperevmscan.io/address/${balance.address}`} target="_blank">
                                                            <div className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-sm hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30">
                                                                <IconWrapper id={IconIds.ARROW_UP_RIGHT} className="size-3 text-blue-600" />
                                                                <span className="text-blue-600">Explorer</span>
                                                            </div>
                                                        </LinkWrapper>
                                                    )}
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
