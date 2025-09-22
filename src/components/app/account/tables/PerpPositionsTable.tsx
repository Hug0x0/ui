'use client'

import { useState } from 'react'
import { SideBadge } from '@/components/common/SideBadge'
// import type { PerpPosition } from '@/interfaces'
import { FileIds, IconIds } from '@/enums'
import FileMapper from '@/components/common/FileMapper'
import IconWrapper from '@/components/icons/IconWrapper'
import { getHyperCoreAssetBySymbol } from '@/config/hypercore-assets.config'
import { PerpRowTemplate, SpotRowTemplate } from './TableTemplates'
import { formatUSD, formatNumber, shortenValue } from '@/utils/format.util'
import { cn } from '@/utils'
import StyledTooltip from '@/components/common/StyledTooltip'
import { useAppStore } from '@/stores/app.store'
import { RoundedAmount } from '@/components/common/RoundedAmount'
import { SECTION_CONFIG, SectionType } from '@/config/sections.config'
import { EmptyTablePlaceholder } from './EmptyTablePlaceholder'
import { SubSectionHeader } from '../sections/SubSectionHeader'

interface PerpPositionsTableProps {
    className?: string
}

function WithdrawableUSDCTable({ withdrawableUSDC }: { withdrawableUSDC: number }) {
    if (withdrawableUSDC <= 0) return null

    return (
        <div className="mb-4">
            <SubSectionHeader title={SECTION_CONFIG[SectionType.PERPS].subSections?.idleUSDC || 'Idle USDC'} />
            <div role="table" className="overflow-x-auto">
                <div className="min-w-max">
                    <SpotRowTemplate
                        asset={
                            <span role="columnheader" className="truncate text-sm text-default/50">
                                Asset
                            </span>
                        }
                        balance={
                            <span role="columnheader" className="truncate text-right text-sm text-default/50">
                                Available
                            </span>
                        }
                        value={
                            <span role="columnheader" className="truncate text-right text-sm text-default/50">
                                Value $
                            </span>
                        }
                        className="h-8 border-b border-default/10 text-xs text-default/50"
                    />
                    <SpotRowTemplate
                        asset={
                            <div className="flex items-center gap-1.5">
                                <FileMapper id={FileIds.TOKEN_USDC} width={20} height={20} className="rounded-full" />
                                <span className="text-sm font-medium">USDC</span>
                            </div>
                        }
                        balance={<span className="font-medium">{formatNumber(withdrawableUSDC, 2)}</span>}
                        value={
                            <RoundedAmount amount={withdrawableUSDC}>
                                <span className="font-semibold text-green-600">{formatUSD(withdrawableUSDC)}</span>
                            </RoundedAmount>
                        }
                        className="h-10 text-sm transition-colors hover:bg-default/5"
                    />
                </div>
            </div>
        </div>
    )
}

export function PerpPositionsTableHeader() {
    return (
        <PerpRowTemplate
            asset={
                <span role="columnheader" className="font-medium text-default/60">
                    Asset
                </span>
            }
            side={
                <span role="columnheader" className="font-medium text-default/60">
                    Side
                </span>
            }
            size={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    Size
                </span>
            }
            notional={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    Notional
                </span>
            }
            entry={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    Entry
                </span>
            }
            mark={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    Mark
                </span>
            }
            pnl={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    PnL
                </span>
            }
            funding={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    8h Funding
                </span>
            }
            margin={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    Margin
                </span>
            }
            leverage={
                <span role="columnheader" className="text-right font-medium text-default/60">
                    Lev
                </span>
            }
            className="h-8 border-b border-default/10 text-sm text-default/50"
        />
    )
}

export function PerpPositionsTable({ className }: PerpPositionsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // Get positions directly from the store
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const positions = snapshot?.positions?.shortLegs?.perps || []
    const withdrawableUSDC = snapshot?.metrics?.shortLegs?.values?.withdrawableUSDC || 0

    if (!positions || positions.length === 0) {
        return (
            <div className={className}>
                <WithdrawableUSDCTable withdrawableUSDC={withdrawableUSDC} />
                <EmptyTablePlaceholder message="No perpetual positions" />
            </div>
        )
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

    const sortedPositions = [...positions].sort((a, b) => Math.abs(b.notionalValueUSD) - Math.abs(a.notionalValueUSD))

    return (
        <div className={className}>
            <WithdrawableUSDCTable withdrawableUSDC={withdrawableUSDC} />

            {withdrawableUSDC > 0 && <SubSectionHeader title={SECTION_CONFIG[SectionType.PERPS].subSections?.shortPositions || 'Short Positions'} />}
            <div role="table" className="overflow-x-auto">
                <div className="min-w-max">
                    <PerpPositionsTableHeader />
                    <div role="rowgroup" className="divide-y divide-default/5">
                        {sortedPositions.map((position) => {
                            const isExpanded = expandedRows.has(position.id)
                            const isLong = position.sizeUnits > 0
                            const pnlPercentage =
                                position.entryPriceUSD !== 0
                                    ? (position.unrealizedPnlUSD / (Math.abs(position.sizeUnits) * position.entryPriceUSD)) * 100
                                    : 0
                            const leverage = position.marginUsedUSD > 0 ? Math.abs(position.notionalValueUSD) / position.marginUsedUSD : 0

                            // We show aggregated funding APR in the header, not per position
                            const annualizedAPR = 0
                            // Calculate 8-hour rate from annualized APR (3 periods per day)
                            const eightHourRate = (annualizedAPR / (365 * 3)) * 100

                            return (
                                <div key={position.id}>
                                    <div onClick={() => toggleRow(position.id)} className="cursor-pointer">
                                        <PerpRowTemplate
                                            asset={
                                                <div className="flex items-center gap-1.5">
                                                    {getHyperCoreAssetBySymbol(position.asset)?.fileId && (
                                                        <FileMapper
                                                            id={getHyperCoreAssetBySymbol(position.asset)!.fileId}
                                                            width={20}
                                                            height={20}
                                                            className="rounded-full"
                                                        />
                                                    )}
                                                    <span className="text-sm">{position.asset}</span>
                                                </div>
                                            }
                                            side={<SideBadge side={isLong ? 'long' : 'short'}>{isLong ? 'LONG' : 'SHORT'}</SideBadge>}
                                            size={
                                                <span className={`font-medium ${isLong ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatNumber(Math.abs(position.sizeUnits), 4)}
                                                </span>
                                            }
                                            notional={
                                                <RoundedAmount className="font-medium" amount={Math.abs(position.notionalValueUSD)}>
                                                    {formatUSD(Math.abs(position.notionalValueUSD))}
                                                </RoundedAmount>
                                            }
                                            entry={<span>{formatUSD(position.entryPriceUSD)}</span>}
                                            mark={<span>{formatUSD(position.markPriceUSD)}</span>}
                                            pnl={
                                                <div>
                                                    <span
                                                        className={`font-medium ${position.unrealizedPnlUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                                    >
                                                        {formatUSD(position.unrealizedPnlUSD)}
                                                    </span>
                                                    <span
                                                        className={`ml-1 text-sm ${position.unrealizedPnlUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                                    >
                                                        ({pnlPercentage >= 0 ? '+' : ''}
                                                        {Math.abs(pnlPercentage) < 0.05 ? '0' : pnlPercentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            }
                                            funding={
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-1 text-sm">
                                                            <p className="font-medium">Funding Rate</p>
                                                            <p className="text-default/70">
                                                                8h: {!isLong ? '+' : '-'}
                                                                {Math.abs(eightHourRate).toFixed(4)}%
                                                            </p>
                                                            <p className="text-default/70">
                                                                APR: {!isLong ? '+' : '-'}
                                                                {Math.abs(annualizedAPR).toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    }
                                                >
                                                    <span className={`font-medium ${!isLong ? 'text-green-600' : 'text-red-600'}`}>
                                                        {!isLong ? '+' : '-'}
                                                        {Math.abs(eightHourRate).toFixed(3)}%
                                                    </span>
                                                </StyledTooltip>
                                            }
                                            margin={<span>{formatUSD(position.marginUsedUSD)}</span>}
                                            leverage={<span className="font-medium">{leverage.toFixed(1)}x</span>}
                                            className="h-10 transition-colors hover:bg-default/5"
                                        />
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="space-y-4 border-t border-default/10 bg-default/5 px-4 py-4">
                                            {/* Position Details Grid */}
                                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-4">
                                                {/* Core Position Info */}
                                                <div className="col-span-full mb-2">
                                                    <h4 className="text-sm font-semibold text-default/80">Position Details</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Position ID</p>
                                                    <p className="text-sm">{shortenValue(position.id)}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Asset</p>
                                                    <p className="font-medium">{position.asset}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Direction</p>
                                                    <SideBadge side={isLong ? 'long' : 'short'}>{isLong ? 'LONG' : 'SHORT'}</SideBadge>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Size</p>
                                                    <p className="font-medium">
                                                        {formatNumber(Math.abs(position.sizeUnits), 6)} {position.asset}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Notional Value</p>
                                                    <p className="font-bold text-primary">{formatUSD(Math.abs(position.notionalValueUSD))}</p>
                                                </div>

                                                {/* Price Information Section */}
                                                <div className="col-span-full mb-2 mt-3">
                                                    <h4 className="text-sm font-semibold text-default/80">Price Information</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Entry Price</p>
                                                    <p className="font-medium">{formatUSD(position.entryPriceUSD)}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Mark Price</p>
                                                    <p className="font-medium">{formatUSD(position.markPriceUSD)}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Price Change</p>
                                                    <p
                                                        className={cn(
                                                            'font-medium',
                                                            position.markPriceUSD > position.entryPriceUSD ? 'text-green-600' : 'text-red-600',
                                                        )}
                                                    >
                                                        {(((position.markPriceUSD - position.entryPriceUSD) / position.entryPriceUSD) * 100).toFixed(
                                                            2,
                                                        )}
                                                        %
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Liquidation Price</p>
                                                    <p className="font-medium text-orange-500">
                                                        {formatUSD(isLong ? position.entryPriceUSD * 0.85 : position.entryPriceUSD * 1.15)}
                                                    </p>
                                                </div>

                                                {/* PnL Section */}
                                                <div className="col-span-full mb-2 mt-3">
                                                    <h4 className="text-sm font-semibold text-default/80">Profit & Loss</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Unrealized PnL</p>
                                                    <p
                                                        className={cn(
                                                            'font-bold',
                                                            position.unrealizedPnlUSD >= 0 ? 'text-green-600' : 'text-red-600',
                                                        )}
                                                    >
                                                        {position.unrealizedPnlUSD >= 0 ? '+' : ''}
                                                        {formatUSD(position.unrealizedPnlUSD)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">PnL %</p>
                                                    <p className={cn('font-medium', pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600')}>
                                                        {pnlPercentage >= 0 ? '+' : ''}
                                                        {Math.abs(pnlPercentage) < 0.005 ? '0' : pnlPercentage.toFixed(2)}%
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">ROI</p>
                                                    <p
                                                        className={cn(
                                                            'font-medium',
                                                            position.unrealizedPnlUSD >= 0 ? 'text-green-600' : 'text-red-600',
                                                        )}
                                                    >
                                                        {((position.unrealizedPnlUSD / position.marginUsedUSD) * 100).toFixed(1)}%
                                                    </p>
                                                </div>

                                                {/* Margin & Risk Section */}
                                                <div className="col-span-full mb-2 mt-3">
                                                    <h4 className="text-sm font-semibold text-default/80">Margin & Risk</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Margin Used</p>
                                                    <p className="font-medium">{formatUSD(position.marginUsedUSD)}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Leverage</p>
                                                    <p
                                                        className={cn(
                                                            'font-medium',
                                                            leverage > 5 ? 'text-orange-500' : leverage > 3 ? 'text-yellow-500' : 'text-default',
                                                        )}
                                                    >
                                                        {leverage.toFixed(2)}x
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Margin Ratio</p>
                                                    <p className="font-medium">
                                                        {((position.marginUsedUSD / Math.abs(position.notionalValueUSD)) * 100).toFixed(1)}%
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Distance to Liq</p>
                                                    <p
                                                        className={cn(
                                                            'font-medium',
                                                            Math.abs(
                                                                (position.markPriceUSD -
                                                                    (isLong ? position.entryPriceUSD * 0.85 : position.entryPriceUSD * 1.15)) /
                                                                    position.markPriceUSD,
                                                            ) < 0.1
                                                                ? 'text-red-500'
                                                                : 'text-default',
                                                        )}
                                                    >
                                                        {(
                                                            Math.abs(
                                                                (position.markPriceUSD -
                                                                    (isLong ? position.entryPriceUSD * 0.85 : position.entryPriceUSD * 1.15)) /
                                                                    position.markPriceUSD,
                                                            ) * 100
                                                        ).toFixed(1)}
                                                        %
                                                    </p>
                                                </div>

                                                {/* Funding Section */}
                                                <div className="col-span-full mb-2 mt-3">
                                                    <h4 className="text-sm font-semibold text-default/80">Funding Information</h4>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Total Funding Paid</p>
                                                    <p
                                                        className={cn(
                                                            'font-medium',
                                                            position.fundingPaidUSD >= 0 ? 'text-green-600' : 'text-red-600',
                                                        )}
                                                    >
                                                        {formatUSD(position.fundingPaidUSD)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Current 8h Rate</p>
                                                    <p className={cn('font-medium', !isLong ? 'text-green-600' : 'text-red-600')}>
                                                        {!isLong ? '+' : '-'}
                                                        {Math.abs(eightHourRate).toFixed(4)}%
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Annualized APR</p>
                                                    <p className={cn('font-medium', !isLong ? 'text-green-600' : 'text-red-600')}>
                                                        {!isLong ? '+' : '-'}
                                                        {Math.abs(annualizedAPR).toFixed(2)}%
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Est. Daily Funding (3×8h)</p>
                                                    <p className={cn('font-medium', !isLong ? 'text-green-600' : 'text-red-600')}>
                                                        {!isLong ? '+' : '-'}
                                                        {formatUSD(Math.abs(position.notionalValueUSD) * (eightHourRate / 100) * 3)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-default/50">Est. Monthly Funding</p>
                                                    <p className={cn('font-medium', !isLong ? 'text-green-600' : 'text-red-600')}>
                                                        {!isLong ? '+' : '-'}
                                                        {formatUSD((Math.abs(position.notionalValueUSD) * (annualizedAPR / 100)) / 12)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Raw Data */}
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-sm text-default/40">Raw data available via tooltip →</span>
                                                <StyledTooltip
                                                    content={
                                                        <pre className="max-h-96 max-w-2xl overflow-auto text-sm">
                                                            {JSON.stringify(position, null, 2)}
                                                        </pre>
                                                    }
                                                    placement="left"
                                                >
                                                    <div className="flex cursor-help items-center gap-1 rounded bg-default/10 px-2 py-1 text-sm hover:bg-default/20">
                                                        <IconWrapper id={IconIds.INFORMATION} className="size-3 text-default/60" />
                                                        <span className="text-default/60">Position Data</span>
                                                    </div>
                                                </StyledTooltip>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
