import type { HyperCoreTransaction } from '@/services/explorers/hypercore.service'

/**
 * Trade aggregation utilities following DRY and Single Responsibility principles
 * Extracts repeated calculation logic from components
 */

/**
 * Calculate total fees from trades
 */
export function calculateTotalFees(trades: HyperCoreTransaction[]): number {
    return trades.reduce((sum, trade) => sum + trade.fee, 0)
}

/**
 * Calculate total PnL from trades
 */
export function calculateTotalPnL(trades: HyperCoreTransaction[]): number {
    return trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
}

/**
 * Calculate trade statistics
 */
export function calculateTradeStats(trades: HyperCoreTransaction[]) {
    return {
        totalTrades: trades.length,
        totalFees: calculateTotalFees(trades),
        totalPnL: calculateTotalPnL(trades),
        hasPnL: trades.some((t) => t.pnl !== undefined && t.pnl !== null),
    }
}

/**
 * Get PnL color class based on value
 */
export function getPnLColorClass(pnl: number): string {
    if (pnl > 0) return 'text-success'
    if (pnl < 0) return 'text-error'
    return 'text-default'
}
