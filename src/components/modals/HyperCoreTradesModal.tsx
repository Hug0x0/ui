'use client'

import { useAppStore } from '@/stores/app.store'
import { formatUSD, formatNumber, shortenValue } from '@/utils/format.util'
import StyledTooltip from '@/components/common/StyledTooltip'
import LinkWrapper from '@/components/common/LinkWrapper'
import { TradeRowTemplate } from '@/components/app/account/tables/TradeRowTemplate'
import { DateWrapperAccurate } from '@/components/common/DateWrapper'
import { SideBadge } from '@/components/common/SideBadge'
import { cn } from '@/utils'
import BaseModal from '@/components/common/BaseModal'
import EmptyState from '@/components/common/EmptyState'
import RawDataTooltip from '@/components/common/RawDataTooltip'
import { calculateTradeStats, getPnLColorClass } from '@/utils/trade-aggregation.util'
import { TABLE_HEADER_CLASSES } from '@/config/constants.config'
import { getHyperCoreExplorerUrl } from '@/utils/explorer.util'

interface HyperCoreTradesModalProps {
    isOpen: boolean
    onClose: () => void
    address?: string
}

export default function HyperCoreTradesModal({ isOpen, onClose, address }: HyperCoreTradesModalProps) {
    // Get trades from the store
    const hypercoreTrades = useAppStore((state) => state.hypercoreTrades)

    // Sort by timestamp descending (most recent first)
    const sortedTrades = [...hypercoreTrades].sort((a, b) => b.timestamp - a.timestamp)

    // Calculate stats using utility functions
    const stats = calculateTradeStats(sortedTrades)

    const subtitle = (
        <>
            <span>Last {sortedTrades.length} trades</span>
            {address && <span>for {address}</span>}
        </>
    )

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="HyperCore Trading History" subtitle={subtitle} maxWidth="max-w-7xl">
            {/* Content */}
            <div className="flex flex-1 overflow-auto">
                {sortedTrades.length === 0 ? (
                    <EmptyState title="No trades found" description="HyperCore trades will appear here once executed" />
                ) : (
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-max">
                            {/* Header */}
                            <TradeRowTemplate
                                time={<span className="">Time</span>}
                                coin={<span className="">Asset</span>}
                                side={<span className="">Side</span>}
                                size={<span className="text-right">Size</span>}
                                price={<span className="text-right">Price</span>}
                                value={<span className="text-right">Value</span>}
                                pnl={<span className="text-right">PnL</span>}
                                fee={<span className="text-right">Fee</span>}
                                hash={<span className="text-right">Tx Hash</span>}
                                raw={<span className="">Raw</span>}
                                className={`${TABLE_HEADER_CLASSES} text-xs text-default/60`}
                            />
                            {/* Body */}
                            <div className="divide-y divide-default/10">
                                {sortedTrades.map((trade, index) => {
                                    const isBuy = trade.side === 'buy' || trade.side === 'long'
                                    const isLiquidation = trade.type === 'liquidation'

                                    return (
                                        <TradeRowTemplate
                                            key={`${trade.hash}-${index}`}
                                            time={
                                                <p className="text-sm">
                                                    <DateWrapperAccurate date={new Date(trade.timestamp)} />
                                                </p>
                                            }
                                            coin={
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-medium">{trade.coin}</span>
                                                    {isLiquidation && (
                                                        <StyledTooltip content="Liquidation">
                                                            <span className="text-error">LIQ</span>
                                                        </StyledTooltip>
                                                    )}
                                                </div>
                                            }
                                            side={<SideBadge side={isBuy ? 'long' : 'short'}>{isBuy ? 'Buy' : 'Sell'}</SideBadge>}
                                            size={<p className="text-sm font-medium">{formatNumber(trade.size, 4)}</p>}
                                            price={<p className="text-sm">{formatUSD(trade.price)}</p>}
                                            value={<p className="text-sm font-medium">{formatUSD(trade.value)}</p>}
                                            pnl={
                                                trade.pnl ? (
                                                    <StyledTooltip content={`Realized PnL: ${formatUSD(trade.pnl)}`}>
                                                        <p
                                                            className={cn(
                                                                'text-sm font-medium',
                                                                trade.pnl > 0 ? 'text-success' : trade.pnl < 0 ? 'text-error' : 'text-default',
                                                            )}
                                                        >
                                                            {trade.pnl > 0 ? '+' : ''}
                                                            {formatUSD(trade.pnl)}
                                                        </p>
                                                    </StyledTooltip>
                                                ) : undefined
                                            }
                                            fee={<p className="text-sm text-default/60">{formatUSD(trade.fee)}</p>}
                                            hash={
                                                trade.hash ? (
                                                    <LinkWrapper href={getHyperCoreExplorerUrl(trade.hash)} target="_blank">
                                                        <StyledTooltip content={`View on HyperCore Explorer`}>
                                                            <p className="text-primary hover:underline">{shortenValue(trade.hash)}</p>
                                                        </StyledTooltip>
                                                    </LinkWrapper>
                                                ) : (
                                                    <span className="text-default/30">-</span>
                                                )
                                            }
                                            raw={<RawDataTooltip data={trade} />}
                                            className="py-3 transition-colors hover:bg-default/5"
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with summary stats */}
            {sortedTrades.length > 0 && (
                <div className="border-t border-default/10 px-6 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-default/60">Total trades</span>
                                <span className="font-medium">{sortedTrades.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-default/60">Total fees</span>
                                <span className="font-medium">{formatUSD(stats.totalFees)}</span>
                            </div>
                            {stats.hasPnL && (
                                <div className="flex items-center gap-2">
                                    <span className="text-default/60">Total PnL</span>
                                    <span className={cn('font-medium', getPnLColorClass(stats.totalPnL))}>{formatUSD(stats.totalPnL)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
