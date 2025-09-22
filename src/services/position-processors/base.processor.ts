/**
 * Base processor for position legs
 * Implements strategy pattern for processing different position types
 */

import type { PositionLeg, PositionProcessingResult, PositionTypeConfig } from '@/interfaces/position-leg.interface'

/**
 * Abstract base class for position processors
 */
export abstract class BasePositionProcessor<T extends PositionLeg = PositionLeg> {
    constructor(protected readonly config: PositionTypeConfig) {}

    /**
     * Fetch and process positions for a given address
     */
    abstract process(address: string): Promise<PositionProcessingResult>

    /**
     * Calculate weighted APR from positions
     */
    protected calculateWeightedAPR(positions: T[]): {
        current: number | null
        avg24h: number | null
        avg7d: number | null
        avg30d: number | null
    } {
        if (positions.length === 0) {
            return { current: null, avg24h: null, avg7d: null, avg30d: null }
        }

        let totalValueUSD = 0
        const weightedSums = {
            current: 0,
            avg24h: 0,
            avg7d: 0,
            avg30d: 0,
        }

        positions.forEach((position) => {
            if (position.valueUSD <= 0 || !position.apr) return

            totalValueUSD += position.valueUSD

            if (position.apr.current !== null) {
                weightedSums.current += position.apr.current * position.valueUSD
            }
            if (position.apr.avg24h !== null) {
                weightedSums.avg24h += position.apr.avg24h * position.valueUSD
            }
            if (position.apr.avg7d !== null) {
                weightedSums.avg7d += position.apr.avg7d * position.valueUSD
            }
            if (position.apr.avg30d !== null) {
                weightedSums.avg30d += position.apr.avg30d * position.valueUSD
            }
        })

        if (totalValueUSD === 0) {
            return { current: null, avg24h: null, avg7d: null, avg30d: null }
        }

        // If we have positions but no APR data, use mock data for testing
        const hasAnyAPR = weightedSums.current > 0 || weightedSums.avg24h > 0 || weightedSums.avg7d > 0 || weightedSums.avg30d > 0

        if (!hasAnyAPR && totalValueUSD > 0) {
            // Return 0% APR when positions exist but APR data is missing
            // This happens when pools don't have APR data available yet
            return {
                current: 0,
                avg24h: 0,
                avg7d: 0,
                avg30d: 0,
            }
        }

        return {
            current: weightedSums.current > 0 ? weightedSums.current / totalValueUSD : null,
            avg24h: weightedSums.avg24h > 0 ? weightedSums.avg24h / totalValueUSD : null,
            avg7d: weightedSums.avg7d > 0 ? weightedSums.avg7d / totalValueUSD : null,
            avg30d: weightedSums.avg30d > 0 ? weightedSums.avg30d / totalValueUSD : null,
        }
    }

    /**
     * Aggregate metrics from positions
     */
    protected aggregateMetrics(positions: T[]): {
        totalValueUSD: number
        totalUnclaimedUSD: number
        totalPnlUSD: number
        totalDeltaHYPE: number
        positionCount: number
    } {
        return positions.reduce(
            (acc, position) => ({
                totalValueUSD: acc.totalValueUSD + position.valueUSD,
                totalUnclaimedUSD: acc.totalUnclaimedUSD + this.getUnclaimedValue(position),
                totalPnlUSD: acc.totalPnlUSD + (position.pnlUSD || 0),
                totalDeltaHYPE: acc.totalDeltaHYPE + position.deltaHYPE,
                positionCount: acc.positionCount + 1,
            }),
            {
                totalValueUSD: 0,
                totalUnclaimedUSD: 0,
                totalPnlUSD: 0,
                totalDeltaHYPE: 0,
                positionCount: 0,
            },
        )
    }

    /**
     * Get unclaimed value from position (override in subclasses)
     */
    protected abstract getUnclaimedValue(position: T): number
}

/**
 * Factory for creating position processors
 */
export async function createProcessor(type: string, config: PositionTypeConfig): Promise<BasePositionProcessor | null> {
    switch (type) {
        case 'lp': {
            // Import dynamically to avoid circular dependencies
            const { LPPositionProcessor } = await import('./lp.processor')
            return new LPPositionProcessor(config)
        }
        case 'hyperdrive': {
            const { HyperDrivePositionProcessor } = await import('./hyperdrive.processor')
            return new HyperDrivePositionProcessor(config)
        }
        // Add other processor types as they are implemented:
        // case 'staking':
        //     const { StakingProcessor } = await import('./staking.processor')
        //     return new StakingProcessor(config)
        default:
            return null
    }
}

/**
 * Process all enabled position types for an address
 */
export async function processAllPositions(
    address: string,
    configs: PositionTypeConfig[],
): Promise<Array<{ type: string; result: PositionProcessingResult }>> {
    const enabledConfigs = configs.filter((c) => c.enabled)

    // Process all in parallel
    const promises = enabledConfigs.map(async (config) => {
        const processor = await createProcessor(config.type, config)
        if (!processor) {
            return {
                type: config.type,
                result: {
                    positions: [],
                    metrics: {
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
                    },
                    fetchTimeMs: 0,
                    error: `No processor for type: ${config.type}`,
                },
            }
        }

        try {
            const result = await processor.process(address)
            return { type: config.type, result }
        } catch (error) {
            console.error(`Error processing ${config.type} positions:`, error)
            return {
                type: config.type,
                result: {
                    positions: [],
                    metrics: {
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
                    },
                    fetchTimeMs: 0,
                    error: error instanceof Error ? error.message : 'Processing failed',
                },
            }
        }
    })

    return Promise.all(promises)
}
