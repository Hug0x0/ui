import { createLogger } from '@/utils'

const logger = createLogger('Funding')

/**
 * Service for fetching historical funding rates from Hyperliquid
 */
class FundingHistoryService {
    private readonly HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info'

    /**
     * Fetch funding history for a specific asset
     * Returns funding snapshots at hourly intervals
     */
    async fetchFundingHistory(asset: string, lookbackDays: number = 30): Promise<Array<{ time: number; fundingRate: number }>> {
        try {
            // Calculate time range (milliseconds)
            const endTime = Date.now()
            const startTime = endTime - lookbackDays * 24 * 60 * 60 * 1000

            // Hyperliquid funding history endpoint
            const response = await fetch(this.HYPERLIQUID_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'fundingHistory',
                    coin: asset,
                    startTime: startTime,
                    endTime: endTime,
                }),
            })

            if (!response.ok) {
                console.error(`Failed to fetch funding history: ${response.status}`)
                return []
            }

            const data = await response.json()

            // Parse funding history data
            if (!Array.isArray(data)) {
                console.error('Unexpected funding history format:', data)
                return []
            }

            // Convert to our format
            return data.map((item: { time: number; fundingRate: string }) => ({
                time: item.time,
                fundingRate: parseFloat(item.fundingRate || '0'),
            }))
        } catch (error) {
            console.error('Error fetching funding history:', error)
            return []
        }
    }

    /**
     * Calculate average funding APR for different time periods
     * @param asset - The asset to get funding for (e.g., 'HYPE')
     * @returns Object with 24h, 7d, and 30d annualized funding APRs
     */
    async calculateHistoricalFundingAPRs(asset: string): Promise<{
        apr24h: number | null
        apr7d: number | null
        apr30d: number | null
    }> {
        try {
            // Fetch data for each specific period to ensure we get the right data
            const [history24h, history7d, history30d] = await Promise.all([
                this.fetchFundingHistory(asset, 1), // 24 hours
                this.fetchFundingHistory(asset, 7), // 7 days
                this.fetchFundingHistory(asset, 30), // 30 days
            ])

            // Calculate average funding rate for each period
            // Funding rate is HOURLY, so we need to annualize it
            const calculateAPR = (data: Array<{ time: number; fundingRate: number }>) => {
                if (!data || data.length === 0) return null

                // Average hourly funding rate (already as decimal fraction)
                const avgFundingRate = data.reduce((sum, h) => sum + h.fundingRate, 0) / data.length

                // Convert hourly rate to annual APR
                // 24 hours per day * 365 days = 8760 hours per year
                // fundingRate is already a decimal fraction, so multiply by 24 * 365 * 100 for percentage
                const annualizedAPR = avgFundingRate * 24 * 365 * 100

                return annualizedAPR
            }

            const result = {
                apr24h: calculateAPR(history24h),
                apr7d: calculateAPR(history7d),
                apr30d: calculateAPR(history30d),
            }

            logger.info(`${asset} APRs - 24h: ${result.apr24h?.toFixed(2)}%, 7d: ${result.apr7d?.toFixed(2)}%, 30d: ${result.apr30d?.toFixed(2)}%`)

            return result
        } catch (error) {
            logger.error('Error calculating historical funding APRs:', error)
            return { apr24h: null, apr7d: null, apr30d: null }
        }
    }

    /**
     * Calculate weighted average funding APRs for multiple assets
     * @param positions - Array of positions with asset and margin value
     * @returns Weighted average funding APRs for 24h, 7d, 30d (positive = shorts earn)
     */
    async calculateWeightedFundingAPRs(positions: Array<{ asset: string; marginValue: number; isShort: boolean }>): Promise<{
        apr24h: number | null
        apr7d: number | null
        apr30d: number | null
    }> {
        if (positions.length === 0) {
            return { apr24h: null, apr7d: null, apr30d: null }
        }

        try {
            // Get unique assets
            const uniqueAssets = [...new Set(positions.map((p) => p.asset))]

            // Fetch funding APRs for each asset
            const fundingAPRsByAsset = new Map<string, Awaited<ReturnType<typeof this.calculateHistoricalFundingAPRs>>>()

            await Promise.all(
                uniqueAssets.map(async (asset) => {
                    const aprs = await this.calculateHistoricalFundingAPRs(asset)
                    fundingAPRsByAsset.set(asset, aprs)
                }),
            )

            // Calculate weighted averages
            let totalMargin = 0
            const weightedSums = {
                apr24h: 0,
                apr7d: 0,
                apr30d: 0,
            }
            const hasData = {
                apr24h: false,
                apr7d: false,
                apr30d: false,
            }

            positions.forEach((position) => {
                const margin = Math.abs(position.marginValue)
                const aprs = fundingAPRsByAsset.get(position.asset)

                if (margin > 0 && aprs) {
                    totalMargin += margin

                    // For shorts: positive funding = income (positive return)
                    // For longs: positive funding = cost (negative return)
                    const directionMultiplier = position.isShort ? 1 : -1

                    if (aprs.apr24h !== null) {
                        weightedSums.apr24h += aprs.apr24h * directionMultiplier * margin
                        hasData.apr24h = true
                    }
                    if (aprs.apr7d !== null) {
                        weightedSums.apr7d += aprs.apr7d * directionMultiplier * margin
                        hasData.apr7d = true
                    }
                    if (aprs.apr30d !== null) {
                        weightedSums.apr30d += aprs.apr30d * directionMultiplier * margin
                        hasData.apr30d = true
                    }
                }
            })

            if (totalMargin === 0) {
                return { apr24h: null, apr7d: null, apr30d: null }
            }

            return {
                apr24h: hasData.apr24h ? weightedSums.apr24h / totalMargin : null,
                apr7d: hasData.apr7d ? weightedSums.apr7d / totalMargin : null,
                apr30d: hasData.apr30d ? weightedSums.apr30d / totalMargin : null,
            }
        } catch (error) {
            console.error('Error calculating weighted funding APRs:', error)
            return { apr24h: null, apr7d: null, apr30d: null }
        }
    }
}

export const fundingHistoryService = new FundingHistoryService()
