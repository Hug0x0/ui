/**
 * HyperDrive position processor
 * Fetches and processes HyperDrive money market positions
 */

import { BasePositionProcessor } from './base.processor'
import type { HyperDrivePositionLeg, PositionProcessingResult, PositionTypeConfig } from '@/interfaces/position-leg.interface'
import { priceAggregator } from '@/services/price/price-aggregator.service'
import { getViemClient } from '@/lib/viem'
import { type Address, formatEther } from 'viem'
import { getProtocolConfig, ProtocolType } from '@/config/hyperevm-protocols.config'
import { fetchHyperDriveAPR } from '@/services/hyperdrive.service'

// Get HyperDrive markets from centralized protocol config
const HYPERDRIVE_MARKETS = getProtocolConfig(ProtocolType.HYPERDRIVE).lendingConfig?.markets || []

// ERC20 ABI for balance checking
const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'totalAssets',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const

export class HyperDrivePositionProcessor extends BasePositionProcessor<HyperDrivePositionLeg> {
    constructor(config: PositionTypeConfig) {
        super(config)
    }

    /**
     * Get unclaimed value from HyperDrive position
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected getUnclaimedValue(position: HyperDrivePositionLeg): number {
        // HyperDrive positions don't have unclaimed fees like LP positions
        // Interest is automatically compounded into the assets value
        return 0
    }

    /**
     * Process HyperDrive positions for an address
     */
    async process(address: string): Promise<PositionProcessingResult> {
        const startTime = Date.now()

        try {
            const client = getViemClient()
            const positions: HyperDrivePositionLeg[] = []

            // Check balance for each HyperDrive market
            for (const market of HYPERDRIVE_MARKETS) {
                try {
                    // Get user's share balance
                    const shareBalance = await client.readContract({
                        address: market.address,
                        abi: ERC20_ABI,
                        functionName: 'balanceOf',
                        args: [address as Address],
                    })

                    // Skip if no shares
                    if (!shareBalance || shareBalance === 0n) {
                        continue
                    }

                    // Get total supply and total assets for exchange rate calculation
                    const [totalSupply, totalAssets] = await Promise.all([
                        client.readContract({
                            address: market.address,
                            abi: ERC20_ABI,
                            functionName: 'totalSupply',
                        }),
                        client.readContract({
                            address: market.address,
                            abi: ERC20_ABI,
                            functionName: 'totalAssets',
                        }),
                    ])

                    // Calculate underlying assets from shares
                    // assets = shares * totalAssets / totalSupply
                    const underlyingAssets = totalSupply > 0n ? (shareBalance * totalAssets) / totalSupply : 0n

                    const underlyingAssetsNumber = Number(formatEther(underlyingAssets))
                    const sharesNumber = Number(formatEther(shareBalance))

                    // Skip if no underlying assets
                    if (underlyingAssetsNumber <= 0) continue

                    // Get HYPE price for value calculation
                    const hypePrice = (await priceAggregator.getTokenPrice('HYPE')) || 0
                    const valueUSD = underlyingAssetsNumber * hypePrice

                    // Fetch real APR data from HyperDrive API
                    const aprData = await fetchHyperDriveAPR()

                    // API now returns percentages directly (e.g., 7.5 for 7.5%)
                    const aprMetrics = aprData
                        ? {
                              current: aprData.apr28d || aprData.apr7d || aprData.current,
                              avg24h: aprData.current,
                              avg7d: aprData.apy7d, // Use APY for display to match HyperDrive website
                              avg30d: aprData.apy28d, // Use APY for display to match HyperDrive website
                          }
                        : {
                              current: 0,
                              avg24h: 0,
                              avg7d: 0,
                              avg30d: 0,
                          }

                    // For HyperDrive, assets = underlying, no liabilities for lending positions
                    const position: HyperDrivePositionLeg = {
                        type: 'hyperdrive',
                        id: `hyperdrive-${market.address}`,
                        protocol: 'HyperDrive',

                        // Value metrics
                        valueUSD,
                        deltaHYPE: underlyingAssetsNumber, // Direct HYPE exposure

                        // HyperDrive-specific fields
                        marketId: 0, // Convert BigInt to number
                        sharesUnits: sharesNumber,
                        assetsUnits: underlyingAssetsNumber,
                        liabilitiesUnits: 0, // No liabilities for lending position
                        borrowLimitUnits: 0,
                        liquidationLimitUnits: 0,
                        healthScore: 10000, // Max health for lending position

                        // Market info
                        collateralSymbol: market.underlyingSymbol,
                        collateralSuppliedUnits: underlyingAssetsNumber,
                        maxLTV: 0,
                        liquidationLTV: 0,

                        // APR metrics - now using real data from API
                        apr: aprMetrics,

                        lastUpdated: Date.now(),
                    }

                    positions.push(position)
                } catch {
                    // Silently handle errors for individual markets
                }
            }

            // Calculate aggregated metrics
            const metrics = this.aggregateMetrics(positions)
            const weightedAPR = this.calculateWeightedAPR(positions)

            return {
                positions,
                metrics: {
                    ...metrics,
                    weightedAPR,
                },
                fetchTimeMs: Date.now() - startTime,
            }
        } catch {
            // Silently handle errors - HyperDrive is optional
            return {
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
                fetchTimeMs: Date.now() - startTime,
            }
        }
    }
}
