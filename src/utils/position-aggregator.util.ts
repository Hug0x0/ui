/**
 * Position aggregator utility
 * Aggregates metrics across different position types
 */

import type { PositionProcessingResult, PositionTypeConfig } from '@/interfaces/position-leg.interface'

/**
 * Combined APR calculation result
 */
export interface CombinedAPR {
    weighted24h: number | null
    weighted7d: number | null
    weighted30d: number | null
}

/**
 * Portfolio-wide metrics
 */
export interface PortfolioMetrics {
    // Total values
    totalValueUSD: number
    deployedValueUSD: number // Value in yield-generating positions
    idleValueUSD: number // Wallet balances, spot, etc.

    // Delta metrics
    totalDeltaHYPE: number
    longDeltaHYPE: number // From long legs (LP, staking, etc.)
    shortDeltaHYPE: number // From short legs (perps)
    netDeltaHYPE: number
    hedgeEfficiencyRatio: number // How well hedged (0 = perfect, 1 = no hedge)

    // Combined yield metrics
    combinedAPR: CombinedAPR
}

/**
 * Aggregate metrics from multiple position types
 */
export class PositionAggregator {
    /**
     * Calculate combined APR from multiple position types
     */
    static calculateCombinedAPR(results: Array<{ type: string; result: PositionProcessingResult }>, configs: Array<PositionTypeConfig>): CombinedAPR {
        // This function calculates the weighted APR for long legs only
        // The portfolio-wide APR (combining long + short) is calculated in the API route
        const periods = ['avg24h', 'avg7d', 'avg30d'] as const
        const combined: CombinedAPR = {
            weighted24h: null,
            weighted7d: null,
            weighted30d: null,
        }

        for (const period of periods) {
            let totalWeightedAPR = 0
            let totalWeight = 0
            let hasData = false

            // Use actual position values as weights for accurate weighted average
            results.forEach(({ type, result }) => {
                const config = configs.find((c) => c.type === type && c.enabled)
                if (!config) return

                const apr = result.metrics.weightedAPR[period === 'avg24h' ? 'avg24h' : period === 'avg7d' ? 'avg7d' : 'avg30d']
                const positionValue = result.metrics.totalValueUSD || 0

                if (apr !== null && positionValue > 0) {
                    totalWeightedAPR += apr * positionValue
                    totalWeight += positionValue
                    hasData = true
                }
            })

            if (hasData && totalWeight > 0) {
                const key = period === 'avg24h' ? 'weighted24h' : period === 'avg7d' ? 'weighted7d' : 'weighted30d'
                combined[key] = totalWeightedAPR / totalWeight
            }
        }

        return combined
    }

    /**
     * Aggregate portfolio-wide metrics
     */
    static aggregatePortfolioMetrics(
        longLegs: Array<{ type: string; result: PositionProcessingResult }>,
        shortMetrics: {
            valueUSD: number
            deltaHYPE: number
        },
        idleMetrics: {
            balancesUSD: number
            spotsUSD: number
            withdrawableUSDC: number
            balancesDeltaHYPE: number
            spotsDeltaHYPE: number
        },
        configs: Array<PositionTypeConfig>,
    ): PortfolioMetrics {
        // Aggregate long leg metrics
        let longValueUSD = 0
        let longDeltaHYPE = 0
        let longUnclaimedUSD = 0

        longLegs.forEach(({ result }) => {
            if (!result.error) {
                // Only include successful results
                longValueUSD += result.metrics.totalValueUSD
                longDeltaHYPE += result.metrics.totalDeltaHYPE
                longUnclaimedUSD += result.metrics.totalUnclaimedUSD
            }
        })

        // Calculate totals
        const deployedValueUSD = longValueUSD + longUnclaimedUSD + shortMetrics.valueUSD
        const idleValueUSD = idleMetrics.balancesUSD + idleMetrics.spotsUSD + idleMetrics.withdrawableUSDC
        const totalValueUSD = deployedValueUSD + idleValueUSD

        // Calculate deltas
        const shortDeltaHYPE = shortMetrics.deltaHYPE
        const idleDeltaHYPE = idleMetrics.balancesDeltaHYPE + idleMetrics.spotsDeltaHYPE
        const totalDeltaHYPE = longDeltaHYPE + shortDeltaHYPE + idleDeltaHYPE
        const netDeltaHYPE = totalDeltaHYPE

        // Calculate hedge efficiency (0 = perfect hedge, 1 = no hedge)
        const hedgeEfficiencyRatio = longDeltaHYPE !== 0 ? Math.abs((longDeltaHYPE + shortDeltaHYPE) / longDeltaHYPE) : 0

        // Calculate combined APR
        const combinedAPR = this.calculateCombinedAPR(longLegs, configs)

        return {
            totalValueUSD,
            deployedValueUSD,
            idleValueUSD,
            totalDeltaHYPE,
            longDeltaHYPE,
            shortDeltaHYPE,
            netDeltaHYPE,
            hedgeEfficiencyRatio,
            combinedAPR,
        }
    }

    /**
     * Calculate strategy delta (long + short hedge)
     */
    static calculateStrategyDelta(longDeltaHYPE: number, shortDeltaHYPE: number): number {
        return longDeltaHYPE + shortDeltaHYPE
    }
}
