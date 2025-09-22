import type { Address } from 'viem'
import { HYPEREVM_CHAIN_ID } from '@/lib/viem'
import { NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS, USDT0_ADDRESS } from '@/config/hyperevm-tokens.config'

// Hyperliquid API endpoint (public API, no authentication needed)
const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info'

// Token addresses on HyperEVM
const HYPE_ADDRESSES = [
    WRAPPED_HYPE_ADDRESS, // WHYPE (Wrapped HYPE)
    NATIVE_HYPE_ADDRESS, // HYPE (native/unwrapped)
]

const STABLE_ADDRESSES = [
    USDT0_ADDRESS, // USDT0
    '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70', // feUSD (USD stablecoin)
]

// Cache for price data
interface PriceCache {
    hype: number
    timestamp: number
    source: 'oracle' | 'spot' | 'mark'
}

let priceCache: PriceCache | null = null
const CACHE_DURATION_MS = 10 * 1000 // 10 seconds

/**
 * Fetch HYPE price from Hyperliquid using oracle prices
 * The oracle price is the weighted median from validators and is used for funding rates
 */
async function fetchHypePrice(): Promise<number> {
    try {
        // Check cache first
        if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION_MS) {
            return priceCache.hype
        }

        // First try to get oracle price from perpetuals (most accurate)
        const perpResponse = await fetch(HYPERLIQUID_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'metaAndAssetCtxs',
            }),
        })

        if (perpResponse.ok) {
            const perpData = await perpResponse.json()

            // perpData is [meta, assetCtxs] array
            if (Array.isArray(perpData) && perpData.length >= 2) {
                const [meta, assetCtxs] = perpData

                // Find HYPE in the universe
                const hypeIndex = meta?.universe?.findIndex((asset: { name: string }) => asset.name === 'HYPE')

                if (hypeIndex >= 0 && assetCtxs?.[hypeIndex]) {
                    const hypeCtx = assetCtxs[hypeIndex]

                    // Use oracle price (most accurate), fallback to mark price
                    const price = hypeCtx.oraclePx ? parseFloat(hypeCtx.oraclePx) : hypeCtx.markPx ? parseFloat(hypeCtx.markPx) : null

                    if (price) {
                        priceCache = {
                            hype: price,
                            timestamp: Date.now(),
                            source: hypeCtx.oraclePx ? 'oracle' : 'mark',
                        }
                        return price
                    }
                }
            }
        }

        // Fallback to spot market data
        const spotResponse = await fetch(HYPERLIQUID_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'spotMetaAndAssetCtxs',
            }),
        })

        if (spotResponse.ok) {
            const spotData = await spotResponse.json()

            // Check spot market data
            if (Array.isArray(spotData) && spotData.length >= 2) {
                const [spotMeta, spotCtxs] = spotData

                // Find HYPE/USDC pair
                const hypePairIndex = spotMeta?.universe?.findIndex((pair: { name: string }) => pair.name === 'HYPE/USDC' || pair.name === 'HYPE')

                if (hypePairIndex >= 0 && spotCtxs?.[hypePairIndex]) {
                    const price = spotCtxs[hypePairIndex].markPx ? parseFloat(spotCtxs[hypePairIndex].markPx) : null

                    if (price) {
                        priceCache = {
                            hype: price,
                            timestamp: Date.now(),
                            source: 'spot',
                        }
                        return price
                    }
                }
            }
        }

        // Fallback to default if not found
        console.warn('HYPE price not found in Hyperliquid API responses')
        return 38.5 // Fallback price
    } catch (error) {
        console.error('Error fetching HYPE price from Hyperliquid:', error)
        // Return fallback price on error
        return 38.5
    }
}

export async function getTokenPrice(tokenAddress: Address, chainId: number): Promise<number> {
    if (chainId !== HYPEREVM_CHAIN_ID) {
        console.warn(`Price feed only available for HyperEVM (chain ${HYPEREVM_CHAIN_ID})`)
        return 0
    }

    const lowerAddress = tokenAddress.toLowerCase()

    // Check if it's HYPE
    if (HYPE_ADDRESSES.map((a) => a.toLowerCase()).includes(lowerAddress)) {
        return fetchHypePrice()
    }

    // Check if it's a stablecoin
    if (STABLE_ADDRESSES.map((a) => a.toLowerCase()).includes(lowerAddress)) {
        return 1.0
    }

    // Unknown token
    console.warn(`Unknown token address: ${tokenAddress}`)
    return 0
}
