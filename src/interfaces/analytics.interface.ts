import type { LPMetrics } from './dex.interface'

export interface AnalyticsSummary {
    totalValueUSD: number
    totalUnclaimedFeesUSD: number
    averageFeeAPR: number
    positionsInRange: number
    byDex: Record<string, DexSummary>
}

export interface DexSummary {
    count: number
    totalValueUSD: number
    averageFeeAPR: number
}

export interface AnalyticsResult {
    metrics: LPMetrics[]
    summary: AnalyticsSummary
}

export interface AnalyticsSnapshot extends AnalyticsResult {
    id?: string
    timestamp: Date
    chainId: number
}
