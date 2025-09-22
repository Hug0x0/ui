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
import { getHyperCoreExplorerUrl } from '@/utils/explorer.util'
import type { RebalanceEvent } from '@/interfaces/rebalance.interface'
import type { HyperCoreTransaction } from '@/services/explorers/hypercore.service'

// Union type for combined transactions
type CombinedTransaction =
    | { type: 'rebalance'; data: RebalanceEvent; timestamp: number }
    | { type: 'trade'; data: HyperCoreTransaction; timestamp: number }

interface AllTransactionsModalProps {
    isOpen: boolean
    onClose: () => void
    address?: string
}

export default function AllTransactionsModal({ isOpen, onClose, address }: AllTransactionsModalProps) {
    // Get data from the store
    const rebalanceEvents = useAppStore((state) => state.rebalanceEvents)
    const hypercoreTrades = useAppStore((state) => state.hypercoreTrades)

    // Combine and sort all transactions
    const combinedTransactions: CombinedTransaction[] = [
        ...rebalanceEvents.map((rebalance) => ({
            type: 'rebalance' as const,
            data: rebalance,
            timestamp: new Date(rebalance.timestamp).getTime(),
        })),
        ...hypercoreTrades.map((trade) => ({
            type: 'trade' as const,
            data: trade,
            timestamp: trade.timestamp,
        })),
    ].sort((a, b) => b.timestamp - a.timestamp)

    // Calculate statistics
    const stats = {
        totalTransactions: combinedTransactions.length,
        totalRebalances: rebalanceEvents.length,
        totalTrades: hypercoreTrades.length,
        totalTradeFees: hypercoreTrades.reduce((sum, trade) => sum + trade.fee, 0),
        totalTradeVolume: hypercoreTrades.reduce((sum, trade) => sum + trade.value, 0),
        totalPnL: hypercoreTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
        hasPnL: hypercoreTrades.some((trade) => trade.pnl !== undefined && trade.pnl !== null),
    }

    const subtitle = (
        <>
            <span>{combinedTransactions.length} total transactions</span>
            {address && <span>for {address}</span>}
        </>
    )

    const getTransactionTypeBadge = (type: 'rebalance' | 'trade') => {
        if (type === 'rebalance') {
            return (
                <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-sm font-medium text-purple-400">
                    Rebalance
                </span>
            )
        }
        return <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-sm font-medium text-blue-400">Trade</span>
    }

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="All Transactions" subtitle={subtitle} maxWidth="max-w-7xl">
            {/* Content */}
            <div className="flex flex-1 overflow-auto">
                {combinedTransactions.length === 0 ? (
                    <EmptyState title="No transactions found" description="Rebalances and trades will appear here once executed" />
                ) : (
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-max">
                            {/* Header */}
                            <TradeRowTemplate
                                time={<span className="text-sm text-default/60">Time</span>}
                                coin={<span className="text-sm text-default/60">Type / Asset</span>}
                                side={<span className="text-sm text-default/60">Action</span>}
                                size={<span className="text-right text-sm text-default/60">Size</span>}
                                price={<span className="text-right text-sm text-default/60">Price</span>}
                                value={<span className="text-right text-sm text-default/60">Value</span>}
                                pnl={<span className="text-right text-sm text-default/60">PnL / Summary</span>}
                                fee={<span className="text-right text-sm text-default/60">Fee</span>}
                                hash={<span className="text-right text-sm text-default/60">Tx Hash</span>}
                                raw={<span className="text-sm text-default/60">Raw</span>}
                                className="sticky top-0 z-10 h-10 border-b border-default/10 bg-default/5 backdrop-blur"
                            />
                            {/* Body */}
                            <div className="divide-y divide-default/10">
                                {combinedTransactions.map((transaction, index) => {
                                    if (transaction.type === 'trade') {
                                        const trade = transaction.data
                                        const isBuy = trade.side === 'buy' || trade.side === 'long'
                                        const isLiquidation = trade.type === 'liquidation'

                                        return (
                                            <TradeRowTemplate
                                                key={`trade-${trade.hash}-${index}`}
                                                time={
                                                    <p className="text-sm">
                                                        <DateWrapperAccurate date={new Date(trade.timestamp)} />
                                                    </p>
                                                }
                                                coin={
                                                    <div className="flex items-center gap-2">
                                                        {getTransactionTypeBadge('trade')}
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm font-medium">{trade.coin}</span>
                                                            {isLiquidation && (
                                                                <StyledTooltip content="Liquidation">
                                                                    <span className="text-sm text-error">LIQ</span>
                                                                </StyledTooltip>
                                                            )}
                                                        </div>
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
                                                    ) : (
                                                        <span className="text-sm text-default/30">-</span>
                                                    )
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
                                    } else {
                                        // Rebalance event
                                        const rebalance = transaction.data
                                        const fromRange = rebalance.metadata?.fromRange
                                        const toRange = rebalance.metadata?.toRange
                                        const rangeText =
                                            fromRange && toRange
                                                ? `${formatNumber(fromRange[0], 2)}-${formatNumber(fromRange[1], 2)} → ${formatNumber(toRange[0], 2)}-${formatNumber(toRange[1], 2)}`
                                                : rebalance.metadata?.summary || 'Rebalance'

                                        return (
                                            <TradeRowTemplate
                                                key={`rebalance-${rebalance.id}`}
                                                time={
                                                    <p className="text-sm">
                                                        <DateWrapperAccurate date={new Date(rebalance.timestamp)} />
                                                    </p>
                                                }
                                                coin={
                                                    <div className="flex items-center gap-2">
                                                        {getTransactionTypeBadge('rebalance')}
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">
                                                                {rebalance.metadata?.dexName || 'LP Position'}
                                                            </span>
                                                            {rebalance.metadata?.token0Symbol && rebalance.metadata?.token1Symbol && (
                                                                <span className="text-sm text-default/60">
                                                                    {rebalance.metadata.token0Symbol}/{rebalance.metadata.token1Symbol}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                }
                                                side={
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium',
                                                            rebalance.status === 'completed'
                                                                ? 'bg-success/10 text-success'
                                                                : rebalance.status === 'failed'
                                                                  ? 'bg-error/10 text-error'
                                                                  : rebalance.status === 'pending'
                                                                    ? 'bg-warning/10 text-warning'
                                                                    : 'bg-default/10 text-default',
                                                        )}
                                                    >
                                                        {rebalance.status}
                                                    </span>
                                                }
                                                size={
                                                    rebalance.metadata?.currentPrice ? (
                                                        <p className="text-sm">@ {formatUSD(rebalance.metadata.currentPrice)}</p>
                                                    ) : (
                                                        <span className="text-default/30">-</span>
                                                    )
                                                }
                                                price={<span className="text-default/30">-</span>}
                                                value={<span className="text-default/30">-</span>}
                                                pnl={
                                                    <div className="flex flex-col">
                                                        <p className="text-sm">{rangeText}</p>
                                                        {rebalance.metadata?.reason && (
                                                            <p className="text-sm text-default/60">{rebalance.metadata.reason}</p>
                                                        )}
                                                    </div>
                                                }
                                                fee={
                                                    rebalance.metadata?.fee ? (
                                                        <p className="text-sm text-default/60">{formatUSD(rebalance.metadata.fee)}</p>
                                                    ) : (
                                                        <span className="text-default/30">-</span>
                                                    )
                                                }
                                                hash={
                                                    rebalance.metadata?.txs?.[0]?.hash && rebalance.metadata.txs[0].hash !== 'SKIPPED' ? (
                                                        <LinkWrapper
                                                            href={`https://hyperevmscan.io/tx/${rebalance.metadata.txs[0].hash.replace('0x0x', '0x')}`}
                                                            target="_blank"
                                                        >
                                                            <StyledTooltip content={`View on HyperEVM Explorer`}>
                                                                <p className="text-primary hover:underline">
                                                                    {shortenValue(rebalance.metadata.txs[0].hash.replace('0x0x', '0x'))}
                                                                </p>
                                                            </StyledTooltip>
                                                        </LinkWrapper>
                                                    ) : (
                                                        <span className="text-default/30">-</span>
                                                    )
                                                }
                                                raw={<RawDataTooltip data={rebalance} />}
                                                className="py-3 transition-colors hover:bg-default/5"
                                            />
                                        )
                                    }
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with summary stats */}
            {combinedTransactions.length > 0 && (
                <div className="border-t border-default/10 px-6 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-default/60">Total</span>
                                <span className="font-medium">{stats.totalTransactions}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-default/60">Rebalances</span>
                                <span className="font-medium">{stats.totalRebalances}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-default/60">Trades</span>
                                <span className="font-medium">{stats.totalTrades}</span>
                            </div>
                            {stats.totalTrades > 0 && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-default/60">Trade Volume</span>
                                        <span className="font-medium">{formatUSD(stats.totalTradeVolume)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-default/60">Trade Fees</span>
                                        <span className="font-medium">{formatUSD(stats.totalTradeFees)}</span>
                                    </div>
                                    {stats.hasPnL && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-default/60">Total PnL</span>
                                            <span
                                                className={cn(
                                                    'font-medium',
                                                    stats.totalPnL > 0 ? 'text-success' : stats.totalPnL < 0 ? 'text-error' : 'text-default',
                                                )}
                                            >
                                                {stats.totalPnL > 0 ? '+' : ''}
                                                {formatUSD(stats.totalPnL)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
