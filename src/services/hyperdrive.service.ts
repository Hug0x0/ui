import type { HyperDriveApiResponse, HyperDriveCurrentAPR, HyperDriveMarketHistoryResponse } from '@/types/hyperdrive.types'

const HYPERDRIVE_API_BASE = 'https://api.hyperdrive.fi'
const CHAIN_ID = 999 // HyperEVM chain ID
const MARKET_ID = 1 // HyperDrive HYPE LST Market ID

/**
 * Parse percentage text like "7.653%" to number 7.653
 */
function parsePercentage(text: string): number {
    if (!text) return 0
    const cleaned = text.replace('%', '').trim()
    return parseFloat(cleaned) || 0
}

/**
 * Fetch current APR/APY data for a HyperDrive market using the market history endpoint
 * @returns Current APR/APY data including 7d and 28d averages
 */
export async function fetchHyperDriveAPR(): Promise<HyperDriveCurrentAPR | null> {
    try {
        // Use the market history endpoint which provides supply rates (APY)
        const timestamp = Math.floor(Date.now() / 1000)
        const url = `${HYPERDRIVE_API_BASE}/markets/${CHAIN_ID}/${MARKET_ID}/history?timestamp=${timestamp}&limit=1`

        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
            },
            next: {
                revalidate: 300, // Cache for 5 minutes
            },
        })

        if (!response.ok) {
            console.error(`[HyperDrive] Failed to fetch market data: ${response.status} ${response.statusText}`)
            return null
        }

        const result: HyperDriveMarketHistoryResponse = await response.json()

        if (!result.data || result.data.length === 0) {
            console.warn('[HyperDrive] No market data available')
            return null
        }

        // Get the most recent data point
        const latestData = result.data[0]

        return {
            // Use supply_rate_text for current APR
            current: parsePercentage(latestData.supply_rate_text),
            // Use supply_rate_7d_text for 7d APR
            apr7d: parsePercentage(latestData.supply_rate_7d_text),
            // Use supply_rate_28d_text for 28d APR
            apr28d: parsePercentage(latestData.supply_rate_28d_text),
            // Also include APY values
            apy7d: parsePercentage(latestData.supply_rate_7d_apy_text),
            apy28d: parsePercentage(latestData.supply_rate_28d_apy_text),
            timestamp: latestData.timestamp,
        }
    } catch (error) {
        console.error('[HyperDrive] Error fetching market data:', error)
        return null
    }
}

/**
 * Fetch historical APR data for a HyperDrive market
 * @param marketAddress The market address
 * @param limit Number of data points to fetch (default: 28 for ~4 weeks of daily data)
 * @returns Array of historical APR data
 */
export async function fetchHyperDriveHistoricalAPR(marketAddress: string, limit: number = 28): Promise<HyperDriveApiResponse | null> {
    try {
        const normalizedAddress = marketAddress.toLowerCase()
        const url = `${HYPERDRIVE_API_BASE}/vaults/${CHAIN_ID}/${normalizedAddress}/data?limit=${limit}`

        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
            },
            next: {
                revalidate: 300, // Cache for 5 minutes
            },
        })

        if (!response.ok) {
            console.error(`[HyperDrive] Failed to fetch historical data: ${response.status} ${response.statusText}`)
            return null
        }

        const result: HyperDriveApiResponse = await response.json()
        return result
    } catch (error) {
        console.error('[HyperDrive] Error fetching historical data:', error)
        return null
    }
}

/**
 * Get the latest APR as a percentage string (e.g., "0.57%" for display)
 * @returns Formatted APR string or null if unavailable
 */
export async function getFormattedHyperDriveAPR(): Promise<string | null> {
    const aprData = await fetchHyperDriveAPR()

    if (!aprData) {
        return null
    }

    // Use 28d APR as the primary display value, fallback to 7d, then current
    const displayAPR = aprData.apr28d || aprData.apr7d || aprData.current

    // Convert to percentage (multiply by 100)
    const percentage = displayAPR * 100

    // Format with 2 decimal places
    return `${percentage.toFixed(2)}%`
}

/**
 * Get APR data for all HyperDrive markets from config
 */
export async function getAllHyperDriveAPRs(): Promise<Map<string, HyperDriveCurrentAPR>> {
    const aprMap = new Map<string, HyperDriveCurrentAPR>()

    // Currently only one market, fetch its APR
    const apr = await fetchHyperDriveAPR()
    if (apr) {
        // Use a standard market address as key
        aprMap.set('hyperdrive-market-1', apr)
    }

    return aprMap
}
