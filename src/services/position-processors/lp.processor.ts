/**
 * LP position processor
 * Handles fetching and processing LP positions
 */

import { BasePositionProcessor } from './base.processor'
import type { LPPositionLeg, PositionProcessingResult, PositionTypeConfig, PositionTypeMetrics } from '@/interfaces/position-leg.interface'
import type { LPPosition } from '@/interfaces/positions.interface'
import { positionFetcher } from '@/services/core/position-fetcher.service'
import { poolAPRService } from '@/services/dex/pool-apr.service'
import { isHypeToken } from '@/utils/token.util'

export class LPPositionProcessor extends BasePositionProcessor<LPPositionLeg> {
    constructor(config: PositionTypeConfig) {
        super(config)
    }

    async process(address: string): Promise<PositionProcessingResult> {
        const startTime = Date.now()

        // Fetch LP positions from existing service
        const { lpData: rawLPPositions, timings } = await positionFetcher.fetchAllPositions(address)

        // Validate we have an array
        if (!Array.isArray(rawLPPositions)) {
            return {
                positions: [],
                metrics: this.createEmptyMetrics(),
                fetchTimeMs: Date.now() - startTime,
                error: 'Invalid LP positions data',
            }
        }

        // Get unique pool addresses
        const poolAddresses = [...new Set(rawLPPositions.map((lp) => lp.pool).filter(Boolean))] as string[]

        // Fetch APR data for pools
        const poolAPRData = poolAddresses.length > 0 ? await poolAPRService.fetchPoolAPRByAddresses(poolAddresses) : null

        // Keep raw positions for backward compatibility with table components
        // While also converting to LPPositionLeg for metrics calculation
        const positionLegs: LPPositionLeg[] = rawLPPositions.map((lp) => this.convertToPositionLeg(lp, poolAPRData))

        // Calculate metrics
        const baseMetrics = this.aggregateMetrics(positionLegs)
        const weightedAPR = this.calculateWeightedAPR(positionLegs)

        return {
            positions: rawLPPositions as unknown as LPPositionLeg[], // Return raw positions for table compatibility
            metrics: {
                ...baseMetrics,
                weightedAPR,
            },
            fetchTimeMs: timings.lpFetch || Date.now() - startTime,
        }
    }

    private createEmptyMetrics(): PositionTypeMetrics {
        return {
            totalValueUSD: 0,
            totalUnclaimedUSD: 0,
            totalPnlUSD: 0,
            totalDeltaHYPE: 0,
            weightedAPR: {
                current: null,
                avg24h: null,
                avg7d: null,
                avg30d: null,
            },
            positionCount: 0,
        }
    }

    /**
     * Convert raw LP position to position leg format
     */
    private convertToPositionLeg(lp: LPPosition, poolAPRData: unknown): LPPositionLeg {
        // Calculate delta in HYPE units
        const deltaHYPE = this.calculateLPDelta(lp)

        // Find APR data for this pool
        const aprData = poolAPRData as {
            pools?: Array<{
                poolAddress: string
                dex: string
                apr24h?: number
                apr7d?: number
                apr30d?: number
            }>
        } | null
        const poolAPR = aprData?.pools?.find(
            (pool) => pool.poolAddress.toLowerCase() === lp.pool?.toLowerCase() && pool.dex.toLowerCase() === lp.dex.toLowerCase(),
        )

        return {
            type: 'lp',
            id: `${lp.dex}-${lp.pool}-${lp.tokenId || '0'}`,
            protocol: lp.dex,

            // Values
            valueUSD: lp.valueUSD,
            deltaHYPE,

            // LP-specific
            poolAddress: lp.pool || '',
            token0Symbol: lp.token0Symbol,
            token1Symbol: lp.token1Symbol,
            token0AmountUnits: lp.token0Amount || 0,
            token1AmountUnits: lp.token1Amount || 0,
            lpTokenAmountUnits: undefined, // lpAmount field doesn't exist in LPPosition
            feeTier: lp.fee ? `${(lp.fee / 10000).toFixed(2)}%` : undefined,

            // Unclaimed
            unclaimedFeesUSD: lp.unclaimedFeesUSD || 0,

            // Range
            inRange: lp.inRange,
            priceLower: undefined, // priceLower field doesn't exist in LPPosition
            priceUpper: undefined, // priceUpper field doesn't exist in LPPosition

            // APR - map the pool APR metrics to the expected format
            apr: poolAPR
                ? {
                      current: poolAPR.apr24h || null, // Use 24h APR as current
                      avg24h: poolAPR.apr24h || null,
                      avg7d: poolAPR.apr7d || null,
                      avg30d: poolAPR.apr30d || null,
                  }
                : {
                      current: null,
                      avg24h: null,
                      avg7d: null,
                      avg30d: null,
                  },

            lastUpdated: Date.now(),
        }
    }

    /**
     * Calculate LP delta in HYPE units
     */
    private calculateLPDelta(lp: LPPosition): number {
        const token0IsHype = isHypeToken(lp.token0Symbol)
        const token1IsHype = isHypeToken(lp.token1Symbol)

        if (token0IsHype && lp.token0Amount) {
            return lp.token0Amount
        } else if (token1IsHype && lp.token1Amount) {
            return lp.token1Amount
        }
        return 0
    }

    protected getUnclaimedValue(position: LPPositionLeg): number {
        return position.unclaimedFeesUSD + (position.unclaimedRewardsUSD || 0)
    }
}
