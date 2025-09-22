'use client'

import { useState } from 'react'
import { FileIds, IconIds } from '@/enums'
import type { ProtocolType } from '@/config/hyperevm-protocols.config'
import FileMapper from '@/components/common/FileMapper'
import IconWrapper from '@/components/icons/IconWrapper'
import type { LPPosition } from '@/interfaces'
import type { PoolAPRData } from '@/interfaces/pool-apr.interface'
import { LPRowTemplate } from './TableTemplates'
import { formatUSD, formatNumber, shortenValue } from '@/utils/format.util'
import { cn } from '@/utils'
import StyledTooltip from '@/components/common/StyledTooltip'
import { SideBadge } from '@/components/common/SideBadge'
import { useAppStore } from '@/stores/app.store'
import numeral from 'numeral'
import LinkWrapper from '@/components/common/LinkWrapper'
import { getProtocolByName, getProtocolConfig } from '@/config'
import PositionIframeModal from '@/components/modals/PositionIframeModal'
import RebalanceModal from '@/components/modals/RebalanceModal'
import { EmptyTablePlaceholder } from './EmptyTablePlaceholder'

interface LPPositionsTableProps {
    className?: string
}

export function LPPositionsTableHeader() {
    return (
        <LPRowTemplate
            dex={
                <span role="columnheader" className="truncate">
                    DEX
                </span>
            }
            feeTier={
                <span role="columnheader" className="truncate">
                    Fee
                </span>
            }
            status={
                <span role="columnheader" className="truncate font-medium">
                    Status
                </span>
            }
            poolAddress={
                <span role="columnheader" className="truncate">
                    Pool
                </span>
            }
            nftId={
                <span role="columnheader" className="truncate">
                    NFT ID
                </span>
            }
            hype={
                <div role="columnheader" className="mx-auto flex items-center justify-center gap-1">
                    <FileMapper id={FileIds.TOKEN_HYPE} width={16} height={16} className="rounded-full" />
                    <span className="truncate text-sm">Δ</span>
                </div>
            }
            usdt={
                <span role="columnheader">
                    <FileMapper id={FileIds.TOKEN_USDT0} width={18} height={18} className="mx-auto rounded-full" />
                </span>
            }
            value={
                <span role="columnheader" className="truncate">
                    Value $
                </span>
            }
            split={
                <span role="columnheader" className="truncate">
                    Split
                </span>
            }
            tvl={
                <span role="columnheader" className="truncate">
                    TVL $
                </span>
            }
            apr24h={
                <span role="columnheader" className="truncate">
                    24h APR
                </span>
            }
            apr7d={
                <span role="columnheader" className="truncate">
                    7d APR
                </span>
            }
            apr30d={
                <span role="columnheader" className="truncate">
                    30d APR
                </span>
            }
            positionId={
                <span role="columnheader" className="truncate">
                    Position ID
                </span>
            }
            className="sticky top-0 h-8 border-b border-default/10 text-xs text-default/50"
        />
    )
}

export function LPPositionsTable({ className }: LPPositionsTableProps) {
    const [selectedPosition, setSelectedPosition] = useState<LPPosition | null>(null)
    const [showClosedPositions, setShowClosedPositions] = useState(false)
    const [showRebalanceModal, setShowRebalanceModal] = useState(false)

    // Get positions and APR data directly from the store
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const positions = (snapshot?.positions?.longLegs?.find((l) => l.type === 'lp')?.positions as unknown as LPPosition[]) || []
    const poolAPRData = snapshot?.marketData?.poolAPR

    // Helper to find matching APR for a position
    const findPoolSnapshot = (position: LPPosition): PoolAPRData | null => {
        if (!poolAPRData?.pools || !position.pool) return null

        return (
            poolAPRData.pools.find(
                (pool) =>
                    position.pool &&
                    pool.poolAddress.toLowerCase() === position.pool.toLowerCase() &&
                    pool.dex.toLowerCase() === position.dex.toLowerCase(),
            ) || null
        )
    }

    if (!positions || positions.length === 0) {
        return <EmptyTablePlaceholder message="No liquidity positions" className={className} />
    }

    const handlePositionClick = (position: LPPosition) => {
        setSelectedPosition(position)
    }

    const handleCloseModal = () => {
        setSelectedPosition(null)
    }

    const handleShowRebalances = () => {
        setShowRebalanceModal(true)
    }

    const handleCloseRebalanceModal = () => {
        setShowRebalanceModal(false)
    }

    return (
        <div role="table" className={cn('overflow-x-auto', className)}>
            <div className="max-h-[300px] min-w-max overflow-y-auto">
                <LPPositionsTableHeader />
                <div role="rowgroup" className="divide-y divide-default/5">
                    {positions
                        // Filter based on showClosedPositions state
                        .filter((position) => showClosedPositions || !position.isClosed)
                        .sort((a, b) => {
                            if (a.isClosed && !b.isClosed) return 1
                            if (!a.isClosed && b.isClosed) return -1
                            return 0
                        })
                        .map((position) => {
                            const isHypeToken0 = position.token0Symbol === 'HYPE' || position.token0Symbol === 'WHYPE'
                            const hypeAmount = isHypeToken0 ? position.token0Amount : position.token1Amount
                            const hypeValueUSD = isHypeToken0 ? position.token0ValueUSD : position.token1ValueUSD

                            const isUsdtToken0 = position.token0Symbol === 'USDT0' || position.token0Symbol === 'USD₮0'
                            const usdtAmount = isUsdtToken0
                                ? position.token0Amount
                                : position.token1Symbol === 'USDT0' || position.token1Symbol === 'USD₮0'
                                  ? position.token1Amount
                                  : 0
                            const usdtValueUSD = isUsdtToken0 ? position.token0ValueUSD : position.token1ValueUSD

                            const poolSnapshot = findPoolSnapshot(position)
                            return (
                                <div
                                    key={position.id}
                                    onClick={() => handlePositionClick(position)}
                                    className="cursor-pointer transition-colors hover:bg-default/5"
                                    role="presentation"
                                >
                                    <LPRowTemplate
                                        dex={
                                            <div className="flex items-center gap-1.5">
                                                <FileMapper
                                                    id={getProtocolByName(position.dex as ProtocolType)?.fileId || ''}
                                                    width={18}
                                                    height={18}
                                                    className="rounded"
                                                />
                                                <IconWrapper id={IconIds.EXPAND} className="size-3 text-default/40" />
                                            </div>
                                        }
                                        feeTier={<p className="truncate">{position.feeTier}</p>}
                                        positionId={
                                            <StyledTooltip
                                                content={
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium opacity-60">Position ID</p>
                                                        <p className="text-sm font-medium">{position.id}</p>
                                                    </div>
                                                }
                                            >
                                                <LinkWrapper
                                                    href={getProtocolConfig(position.dex as ProtocolType)?.portfolioUrl || ''}
                                                    target="_blank"
                                                >
                                                    <p className="truncate">{position.id}</p>
                                                </LinkWrapper>
                                            </StyledTooltip>
                                        }
                                        nftId={<p className="truncate">#{position.tokenId}</p>}
                                        status={
                                            <StyledTooltip
                                                content={
                                                    position.tickLower !== undefined &&
                                                    position.tickUpper !== undefined &&
                                                    position.tickCurrent !== undefined ? (
                                                        <div className="space-y-3">
                                                            <div className="space-y-1 pb-2">
                                                                <div className="text-sm font-medium">Position Range Details</div>
                                                                <div className="text-sm opacity-60">Current position within liquidity range</div>
                                                            </div>

                                                            {/* Tick Information */}
                                                            <div className="space-y-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium">Tick Range</span>
                                                                    <span className="font-medium">
                                                                        {position.tickLower} → {position.tickUpper}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="flex justify-between gap-6">
                                                                        <span className="opacity-60">Current tick</span>
                                                                        <span className="opacity-60">{position.tickCurrent}</span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-6">
                                                                        <span className="opacity-60">Range width</span>
                                                                        <span className="opacity-60">
                                                                            {position.tickUpper - position.tickLower} ticks
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Price Range */}
                                                            {(() => {
                                                                const priceLower = Math.pow(1.0001, position.tickLower)
                                                                const priceUpper = Math.pow(1.0001, position.tickUpper)
                                                                const priceCurrent = Math.pow(1.0001, position.tickCurrent)
                                                                const lowerPercent = ((priceLower - priceCurrent) / priceCurrent) * 100
                                                                const upperPercent = ((priceUpper - priceCurrent) / priceCurrent) * 100
                                                                const positionInRange = position.inRange
                                                                    ? ((priceCurrent - priceLower) / (priceUpper - priceLower)) * 100
                                                                    : 0

                                                                return (
                                                                    <>
                                                                        <div className="space-y-0">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-medium">Price Range</span>
                                                                                <span className="font-medium">
                                                                                    {lowerPercent.toFixed(1)}% to +{upperPercent.toFixed(1)}%
                                                                                </span>
                                                                            </div>
                                                                            <div className="ml-3">
                                                                                <div className="flex justify-between gap-6">
                                                                                    <span className="opacity-60">Lower bound</span>
                                                                                    <span className="opacity-60">
                                                                                        {lowerPercent.toFixed(1)}% from current
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between gap-6">
                                                                                    <span className="opacity-60">Upper bound</span>
                                                                                    <span className="opacity-60">
                                                                                        +{upperPercent.toFixed(1)}% from current
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="border-t border-default/20 pt-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-medium">Position Status</span>
                                                                                <span
                                                                                    className={`font-medium ${position.inRange ? 'text-success' : 'text-warning'}`}
                                                                                >
                                                                                    {!position.inRange
                                                                                        ? priceCurrent < priceLower
                                                                                            ? `Below by ${Math.abs(lowerPercent).toFixed(1)}%`
                                                                                            : `Above by ${(((priceCurrent - priceUpper) / priceUpper) * 100).toFixed(1)}%`
                                                                                        : `${positionInRange.toFixed(0)}% through range`}
                                                                                </span>
                                                                            </div>
                                                                            {position.inRange && (
                                                                                <div className="ml-3 mt-1">
                                                                                    <div className="flex justify-between gap-6">
                                                                                        <span className="opacity-60">Distance to lower</span>
                                                                                        <span className="opacity-60">
                                                                                            {Math.abs(lowerPercent).toFixed(1)}%
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between gap-6">
                                                                                        <span className="opacity-60">Distance to upper</span>
                                                                                        <span className="opacity-60">{upperPercent.toFixed(1)}%</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>
                                                    ) : null
                                                }
                                            >
                                                <p className="truncate">
                                                    {position.isClosed ? (
                                                        <span className="text-default/40">Closed</span>
                                                    ) : position.inRange !== undefined ? (
                                                        <SideBadge side={position.inRange ? 'long' : 'short'}>
                                                            {position.inRange ? 'In Range' : 'Out'}
                                                        </SideBadge>
                                                    ) : (
                                                        <span className="text-default/50">-</span>
                                                    )}
                                                </p>
                                            </StyledTooltip>
                                        }
                                        poolAddress={
                                            <StyledTooltip
                                                content={
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium opacity-60">Pool Address</p>
                                                        <p className="text-sm font-medium">{position.pool}</p>
                                                        <p className="text-sm opacity-60">Click to view pool</p>
                                                    </div>
                                                }
                                            >
                                                <LinkWrapper
                                                    href={getProtocolConfig(position.dex as ProtocolType)?.portfolioUrl || ''}
                                                    target="_blank"
                                                >
                                                    <p className="truncate">{shortenValue(position.pool || '')}</p>
                                                </LinkWrapper>
                                            </StyledTooltip>
                                        }
                                        hype={
                                            hypeAmount ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Amount</p>
                                                                <div className="flex items-center gap-1">
                                                                    <FileMapper
                                                                        id={FileIds.TOKEN_HYPE}
                                                                        width={16}
                                                                        height={16}
                                                                        className="rounded-full"
                                                                    />
                                                                    <p className="text-sm font-medium">{formatNumber(hypeAmount, 2)}</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Price (USD)</p>
                                                                <p className="text-sm font-medium">{formatUSD((hypeValueUSD || 0) / hypeAmount)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Value (USD)</p>
                                                                <p className="text-sm font-medium">{formatUSD(hypeValueUSD || 0)}</p>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <p className="font-medium hover:underline">{formatNumber(hypeAmount, 2)}</p>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/50">-</span>
                                            )
                                        }
                                        usdt={
                                            usdtAmount ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Amount</p>
                                                                <div className="flex items-center gap-1">
                                                                    <FileMapper
                                                                        id={FileIds.TOKEN_USDT0}
                                                                        width={16}
                                                                        height={16}
                                                                        className="rounded-full"
                                                                    />
                                                                    <p className="text-sm font-medium">{formatNumber(usdtAmount, 0)}</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Price (USD)</p>
                                                                <p className="text-sm font-medium">{formatUSD((usdtValueUSD || 0) / usdtAmount)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium opacity-60">Value (USD)</p>
                                                                <p className="text-sm font-medium">{formatUSD(usdtValueUSD || 0)}</p>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <p className="font-medium hover:underline">{formatNumber(usdtAmount, 0)}</p>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/50">-</span>
                                            )
                                        }
                                        value={
                                            position.unclaimedFeesUSD && position.unclaimedFeesUSD > 0.01 ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-sm font-medium opacity-60">Position Value</span>
                                                                <span className="text-sm font-medium">
                                                                    {numeral(position.valueUSD).format('0,0.00$')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-sm font-medium opacity-60">Unclaimed Fees</span>
                                                                <span className="text-sm font-medium text-success">
                                                                    {numeral(position.unclaimedFeesUSD).format('0,0.00$')}
                                                                </span>
                                                            </div>
                                                            {(position.unclaimedFees0 || position.unclaimedFees1) && (
                                                                <div className="space-y-1 border-t border-default/10 pt-2">
                                                                    {position.unclaimedFees0 && position.unclaimedFees0 > 0 && (
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-sm opacity-60">{position.token0Symbol}</span>
                                                                            <span className="text-sm">
                                                                                {formatNumber(position.unclaimedFees0, 4)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {position.unclaimedFees1 && position.unclaimedFees1 > 0 && (
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-sm opacity-60">{position.token1Symbol}</span>
                                                                            <span className="text-sm">
                                                                                {formatNumber(position.unclaimedFees1, 4)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="border-t border-default/10 pt-2">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-sm font-medium">Total</span>
                                                                    <span className="text-sm font-semibold">
                                                                        {numeral(position.valueUSD + position.unclaimedFeesUSD).format('0,0.00$')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-medium">
                                                            {formatUSD(position.valueUSD + position.unclaimedFeesUSD)}
                                                        </span>
                                                        {/* <span className="text-sm text-success">+{formatUSD(position.unclaimedFeesUSD)} fees</span> */}
                                                    </div>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="font-medium">{formatUSD(position.valueUSD)}</span>
                                            )
                                        }
                                        split={
                                            <StyledTooltip
                                                content={
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <FileMapper
                                                            id={
                                                                position.token0Symbol === 'HYPE' || position.token0Symbol === 'WHYPE'
                                                                    ? FileIds.TOKEN_HYPE
                                                                    : FileIds.TOKEN_USDT0
                                                            }
                                                            width={16}
                                                            height={16}
                                                            className="rounded-full"
                                                        />
                                                        <span>{position.token0Symbol}</span>
                                                        <span className="text-default/50">{formatUSD(position.token0ValueUSD || 0)}</span>
                                                        <span className="text-default/50">+</span>
                                                        <FileMapper
                                                            id={
                                                                position.token1Symbol === 'HYPE' || position.token1Symbol === 'WHYPE'
                                                                    ? FileIds.TOKEN_HYPE
                                                                    : FileIds.TOKEN_USDT0
                                                            }
                                                            width={16}
                                                            height={16}
                                                            className="rounded-full"
                                                        />
                                                        <span>{position.token1Symbol}</span>
                                                        <span className="text-default/50">{formatUSD(position.token1ValueUSD || 0)}</span>
                                                    </div>
                                                }
                                            >
                                                <div className="flex items-center justify-end">
                                                    {/* percentage of hype and usdt */}
                                                    <p className="truncate">
                                                        {numeral((position.token0ValueUSD || 0) / position.valueUSD).format('0,0%')} /{' '}
                                                        {numeral((position.token1ValueUSD || 0) / position.valueUSD).format('0,0%')}
                                                    </p>
                                                </div>
                                            </StyledTooltip>
                                        }
                                        tvl={
                                            <StyledTooltip
                                                content={
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium opacity-60">Total Value Locked in pool</p>
                                                        <p className="text-sm font-medium">
                                                            {numeral(poolSnapshot?.tvlUSD || 0).format('0,0.[00000]$')}
                                                        </p>
                                                    </div>
                                                }
                                            >
                                                <span className="font-medium">{formatUSD(poolSnapshot?.tvlUSD || 0)}</span>
                                            </StyledTooltip>
                                        }
                                        apr24h={(() => {
                                            return poolSnapshot ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium opacity-60">24h historical APR</p>
                                                            <p className="text-sm font-medium">
                                                                {numeral(poolSnapshot.apr24h).divide(100).format('0,0.[00]%')}
                                                            </p>
                                                            <p className="text-sm opacity-60">Not a projection of future performance</p>
                                                        </div>
                                                    }
                                                >
                                                    <p className="font-medium hover:underline">
                                                        {numeral(poolSnapshot.apr24h).divide(100).format('0,0%')}
                                                    </p>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/30">-</span>
                                            )
                                        })()}
                                        apr7d={(() => {
                                            return poolSnapshot ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium opacity-60">7d historical APR</p>
                                                            <p className="text-sm font-medium">
                                                                {numeral(poolSnapshot.apr7d).divide(100).format('0,0.[00]%')}
                                                            </p>
                                                            <p className="text-sm opacity-60">Not a projection of future performance</p>
                                                        </div>
                                                    }
                                                >
                                                    <p className="font-medium hover:underline">
                                                        {numeral(poolSnapshot.apr7d).divide(100).format('0,0%')}
                                                    </p>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/30">-</span>
                                            )
                                        })()}
                                        apr30d={(() => {
                                            return poolSnapshot ? (
                                                <StyledTooltip
                                                    content={
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium opacity-60">30d historical APR</p>
                                                            <p className="text-sm font-medium">
                                                                {numeral(poolSnapshot.apr30d).divide(100).format('0,0.[00]%')}
                                                            </p>
                                                            <p className="text-sm opacity-60">Not a projection of future performance</p>
                                                        </div>
                                                    }
                                                >
                                                    <p className="font-medium hover:underline">
                                                        {numeral(poolSnapshot.apr30d).divide(100).format('0,0%')}
                                                    </p>
                                                </StyledTooltip>
                                            ) : (
                                                <span className="text-default/30">-</span>
                                            )
                                        })()}
                                        className="h-10 text-sm transition-colors hover:bg-default/5"
                                    />
                                </div>
                            )
                        })}
                </div>
            </div>

            {/* Footer with action buttons */}
            {positions.length > 0 && (
                <div className="mt-3 flex flex-col justify-between px-3 pb-2 sm:flex-row">
                    {/* Show/Hide Closed Positions Toggle */}
                    {positions.some((p) => p.isClosed) ? (
                        <button
                            onClick={() => setShowClosedPositions(!showClosedPositions)}
                            className="flex items-center gap-1 text-xs text-default/40 transition-colors hover:text-primary"
                        >
                            {showClosedPositions ? (
                                <>
                                    <p className="truncate">Click to hide {positions.filter((p) => p.isClosed).length} closed positions</p>
                                    <IconWrapper id={IconIds.FILTER_REMOVE} className="size-3" />
                                </>
                            ) : (
                                <>
                                    <p className="truncate">Click to show {positions.filter((p) => p.isClosed).length} closed positions</p>
                                    <IconWrapper id={IconIds.FILTER_ADD} className="size-3" />
                                </>
                            )}
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {/* Rebalance Transactions Button */}
                    <button
                        onClick={handleShowRebalances}
                        className="flex items-center gap-1 text-xs text-default/40 transition-colors hover:text-primary"
                    >
                        <p className="truncate">Click to see rebalances</p>
                        <IconWrapper id={IconIds.LIST} className="size-3" />
                    </button>
                </div>
            )}

            {/* DEX Iframe Modal */}
            <PositionIframeModal
                isOpen={!!selectedPosition}
                onClose={handleCloseModal}
                position={selectedPosition}
                url={selectedPosition ? getProtocolByName(selectedPosition.dex as ProtocolType)?.portfolioUrl : undefined}
                title={selectedPosition ? `${selectedPosition.dex} Position` : undefined}
            />

            {/* Rebalance Modal */}
            <RebalanceModal isOpen={showRebalanceModal} onClose={handleCloseRebalanceModal} vaultAddress={snapshot?.address} />
        </div>
    )
}
