import { NextRequest, NextResponse } from 'next/server'
import { positionFetcher } from '@/services/core/position-fetcher.service'
import { fundingHistoryService } from '@/services/core/funding-history.service'
import { priceAggregator } from '@/services/price/price-aggregator.service'
import { hyperEvmRpcService } from '@/services/evm/hyperevm-rpc.service'
import { calculateSpotDelta, calculatePerpDelta, calculateWalletDelta } from '@/utils/delta.util'
import { MemoryCache, createCachedResponse } from '@/utils/cache.util'
import { PositionAggregator } from '@/utils/position-aggregator.util'
import type { AccountSnapshot } from '@/interfaces/account.interface'
import { SCHEMA_VERSION } from '@/config/constants.config'
import { processAllPositions } from '@/services/position-processors/base.processor'
import { POSITION_CONFIGS } from '@/config/position-types.config'
import { AppUrls } from '@/enums/app.enum'
import { SITE_DOMAIN } from '@/config/app.config'

// Simple in-memory cache with 2-second TTL
const cache = new MemoryCache<AccountSnapshot>(2000)

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ account: string }> },
): Promise<NextResponse<AccountSnapshot | { success: false; error: string }>> {
    try {
        const params = await context.params
        const { account } = params

        // Validate Ethereum address format
        if (!account || !/^0x[a-fA-F0-9]{40}$/.test(account)) {
            return NextResponse.json({ success: false, error: 'Invalid Ethereum address format' }, { status: 400 })
        }

        const accountAddress = account.toLowerCase()
        const cacheKey = accountAddress

        // Check cache first
        const cachedData = cache.get(cacheKey)
        if (cachedData) {
            return createCachedResponse(cachedData, true, cache.getCacheAge(cacheKey))
        }

        // Track API user (fire and forget)
        fetch(`${SITE_DOMAIN}${AppUrls.API_TRACK_USER}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: accountAddress }),
        }).catch(() => {
            // Silently ignore tracking failures
        })

        // Fetch base position data (perps, spots, balances)
        const positionsData = await positionFetcher.fetchAllPositions(accountAddress)
        const {
            spotData: spotBalances,
            perpData: perpPositions,
            withdrawableUSDC,
            hyperEvmData: hyperEvmBalances,
            timings: fetchTimings,
        } = positionsData

        // Process all long leg positions in parallel
        const longLegResults = await processAllPositions(accountAddress, POSITION_CONFIGS)

        // Fetch HyperEVM nonce
        const hyperEvmNonce = await hyperEvmRpcService.getNonce(accountAddress)

        // Calculate idle capital metrics
        const spotsValueUSD = spotBalances.reduce((sum, spot) => sum + spot.valueUSD, 0)
        const balancesValueUSD = hyperEvmBalances.reduce((sum, bal) => sum + bal.valueUSD, 0)
        const spotsDeltaHYPE = calculateSpotDelta(spotBalances)
        const balancesDeltaHYPE = calculateWalletDelta(hyperEvmBalances)

        // Calculate perp metrics
        const perpsNotionalUSD = perpPositions.reduce((sum, perp) => sum + perp.notionalValueUSD, 0)
        const perpsPnlUSD = perpPositions.reduce((sum, perp) => sum + perp.unrealizedPnlUSD, 0)
        const perpsMarginUSD = perpPositions.reduce((sum, perp) => sum + perp.marginUsedUSD, 0)
        const perpsValueUSD = perpsMarginUSD + perpsPnlUSD
        const perpsDeltaHYPE = calculatePerpDelta(perpPositions)

        // Calculate perp aggregates
        const perpAggregates = {
            totalMarginUSD: perpsMarginUSD,
            totalNotionalUSD: perpPositions.reduce((sum, p) => sum + Math.abs(p.notionalValueUSD), 0),
            totalPnlUSD: perpsPnlUSD,
            avgLeverageRatio: perpsMarginUSD > 0 ? perpPositions.reduce((sum, p) => sum + Math.abs(p.notionalValueUSD), 0) / perpsMarginUSD : 0,
        }

        // Calculate funding APR
        const fundingAPRs = {
            avgAPR24h: null as number | null,
            avgAPR7d: null as number | null,
            avgAPR30d: null as number | null,
        }

        if (perpPositions.length > 0) {
            const positionsForFunding = perpPositions.map((p) => ({
                asset: p.asset,
                marginValue: p.marginUsedUSD,
                isShort: p.sizeUnits < 0,
            }))

            const historicalFunding = await fundingHistoryService.calculateWeightedFundingAPRs(positionsForFunding)
            fundingAPRs.avgAPR24h = historicalFunding.apr24h
            fundingAPRs.avgAPR7d = historicalFunding.apr7d
            fundingAPRs.avgAPR30d = historicalFunding.apr30d
        }

        // Aggregate portfolio metrics
        const portfolioMetrics = PositionAggregator.aggregatePortfolioMetrics(
            longLegResults,
            { valueUSD: perpsValueUSD, deltaHYPE: perpsDeltaHYPE },
            {
                balancesUSD: balancesValueUSD,
                spotsUSD: spotsValueUSD,
                withdrawableUSDC,
                balancesDeltaHYPE,
                spotsDeltaHYPE,
            },
            POSITION_CONFIGS,
        )

        // Calculate allocation percentages
        const longValueUSD = longLegResults.reduce((sum, r) => sum + (r.result.metrics.totalValueUSD || 0), 0)
        const shortValueUSD = perpsValueUSD
        const totalDeployedUSD = longValueUSD + shortValueUSD

        const allocation = {
            longPercentage: totalDeployedUSD > 0 ? (longValueUSD / totalDeployedUSD) * 100 : 0,
            shortPercentage: totalDeployedUSD > 0 ? (shortValueUSD / totalDeployedUSD) * 100 : 0,
        }

        // Calculate weighted long APR (combining all long leg types)
        const calculateWeightedLongAPR = (period: 'avg24h' | 'avg7d' | 'avg30d') => {
            let totalWeightedAPR = 0
            let totalWeight = 0

            longLegResults.forEach(({ result }) => {
                const apr = result.metrics.weightedAPR[period]
                const weight = result.metrics.totalValueUSD || 0

                if (apr !== null && weight > 0) {
                    totalWeightedAPR += apr * weight
                    totalWeight += weight
                }
            })

            return totalWeight > 0 ? totalWeightedAPR / totalWeight : null
        }

        const aprSources = {
            longAPR24h: calculateWeightedLongAPR('avg24h'),
            longAPR7d: calculateWeightedLongAPR('avg7d'),
            longAPR30d: calculateWeightedLongAPR('avg30d'),
            fundingAPR24h: fundingAPRs.avgAPR24h,
            fundingAPR7d: fundingAPRs.avgAPR7d,
            fundingAPR30d: fundingAPRs.avgAPR30d,
        }

        // Build long legs positions array
        const longLegsPositions = longLegResults.map(({ type, result }) => ({
            type,
            positions: result.positions,
        }))

        // Build long legs metrics array
        const longLegsMetrics = longLegResults.map(({ type, result }) => ({
            type,
            metrics: result.metrics,
        }))

        // Build long legs timings array
        const longLegsTimings = longLegResults.map(({ type, result }) => ({
            type,
            fetchTimeMs: result.fetchTimeMs,
        }))

        // Get market data (for backward compatibility, get from LP processor if available)
        const lpResult = longLegResults.find((r) => r.type === 'lp')
        const poolAPRData =
            lpResult && lpResult.result.positions.length > 0
                ? await (async () => {
                      // This is a simplified version - in production, you'd want to extract this properly
                      const { poolAPRService } = await import('@/services/dex/pool-apr.service')
                      const poolAddresses = [
                          ...new Set(
                              (lpResult.result.positions as Array<{ pool?: string; poolAddress?: string }>)
                                  .map((p) => p.pool || p.poolAddress)
                                  .filter(Boolean),
                          ),
                      ] as string[]
                      return poolAddresses.length > 0 ? await poolAPRService.fetchPoolAPRByAddresses(poolAddresses) : undefined
                  })()
                : undefined

        // Build the account snapshot
        const accountData: AccountSnapshot = {
            success: true,
            schemaVersion: SCHEMA_VERSION.CURRENT,
            timestamp: Date.now(),
            address: accountAddress,

            positions: {
                longLegs: longLegsPositions,
                shortLegs: {
                    perps: perpPositions,
                },
                idle: {
                    balances: hyperEvmBalances,
                    spots: spotBalances,
                },
            },

            metrics: {
                longLegs: longLegsMetrics,
                shortLegs: {
                    values: {
                        perpsNotionalUSD,
                        perpsPnlUSD,
                        perpsMarginUSD,
                        perpsValueUSD,
                        withdrawableUSDC,
                    },
                    deltas: {
                        perpsDeltaHYPE: perpsDeltaHYPE,
                    },
                    perpAggregates,
                    apr: {
                        avgFundingAPR24h: fundingAPRs.avgAPR24h,
                        avgFundingAPR7d: fundingAPRs.avgAPR7d,
                        avgFundingAPR30d: fundingAPRs.avgAPR30d,
                    },
                },
                idle: {
                    values: {
                        balancesValueUSD: balancesValueUSD,
                        spotValueUSD: spotsValueUSD,
                        totalValueUSD: balancesValueUSD + spotsValueUSD,
                    },
                    deltas: {
                        balancesDeltaHYPE: balancesDeltaHYPE,
                        spotDeltaHYPE: spotsDeltaHYPE,
                        totalDeltaHYPE: balancesDeltaHYPE + spotsDeltaHYPE,
                    },
                },
                portfolio: {
                    totalValueUSD: portfolioMetrics.totalValueUSD,
                    deployedValueUSD: portfolioMetrics.deployedValueUSD,
                    idleValueUSD: portfolioMetrics.idleValueUSD,
                    longDeltaHYPE: portfolioMetrics.longDeltaHYPE,
                    shortDeltaHYPE: portfolioMetrics.shortDeltaHYPE,
                    netDeltaHYPE: portfolioMetrics.netDeltaHYPE,
                    strategyDeltaHYPE: PositionAggregator.calculateStrategyDelta(portfolioMetrics.longDeltaHYPE, portfolioMetrics.shortDeltaHYPE),
                    hedgeEfficiencyRatio: portfolioMetrics.hedgeEfficiencyRatio,
                    apr: (() => {
                        // Pre-calculate ratios once to avoid repeated divisions
                        const longRatio = allocation.longPercentage / 100
                        const shortRatio = allocation.shortPercentage / 100

                        return {
                            // Portfolio-wide APR combining long legs and short legs based on allocation
                            // If long APR is null but we have positions, treat it as 0% APR
                            combined24h:
                                totalDeployedUSD > 0 ? longRatio * (aprSources.longAPR24h || 0) + shortRatio * (aprSources.fundingAPR24h || 0) : null,
                            combined7d:
                                totalDeployedUSD > 0 ? longRatio * (aprSources.longAPR7d || 0) + shortRatio * (aprSources.fundingAPR7d || 0) : null,
                            combined30d:
                                totalDeployedUSD > 0 ? longRatio * (aprSources.longAPR30d || 0) + shortRatio * (aprSources.fundingAPR30d || 0) : null,
                        }
                    })(),
                    allocation,
                    aprSources,
                },
            },

            marketData: {
                poolAPR: poolAPRData,
            },

            prices: {
                HYPE: (await positionFetcher.getTokenPrice('HYPE')) || (await priceAggregator.getTokenPrice('HYPE')) || 0,
                USDC: 1,
                USDT: 1,
            },

            timings: {
                longLegs: longLegsTimings,
                shortLegs: {
                    perpsMs: fetchTimings.perpFetch,
                },
                idle: {
                    balancesMs: fetchTimings.evmFetch,
                    spotsMs: fetchTimings.spotFetch,
                },
            },

            wallet: {
                hyperEvmNonce,
            },
        }

        // Store in cache
        cache.set(cacheKey, accountData)

        return createCachedResponse(accountData, false)
    } catch (error) {
        console.error('Error fetching positions:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch positions',
            },
            { status: 500 },
        )
    }
}
