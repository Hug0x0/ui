/**
 * Centralized price aggregation service
 * Fetches prices from multiple sources with proper fallback logic
 */

interface TokenPrice {
    symbol: string
    price: number
    source: 'hyperliquid' | 'coingecko' | 'manual'
    timestamp: number
}

export class PriceAggregatorService {
    private static instance: PriceAggregatorService
    private priceCache: Map<string, TokenPrice> = new Map()
    private readonly CACHE_DURATION = 60 * 1000 // 1 minute
    private readonly HYPERLIQUID_API_URL = process.env.NEXT_PUBLIC_HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz'

    private constructor() {}

    static getInstance(): PriceAggregatorService {
        if (!PriceAggregatorService.instance) {
            PriceAggregatorService.instance = new PriceAggregatorService()
        }
        return PriceAggregatorService.instance
    }

    /**
     * Get token price with fallback logic
     */
    async getTokenPrice(symbol: string): Promise<number | null> {
        // Normalize symbol
        const normalizedSymbol = this.normalizeSymbol(symbol)

        // Check cache first
        const cached = this.priceCache.get(normalizedSymbol)
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.price
        }

        // Try Hyperliquid first
        const hyperliquidPrice = await this.fetchHyperliquidPrice(normalizedSymbol)
        if (hyperliquidPrice !== null) {
            this.cachePrice(normalizedSymbol, hyperliquidPrice, 'hyperliquid')
            return hyperliquidPrice
        }

        // Try CoinGecko as fallback
        const coingeckoPrice = await this.fetchCoinGeckoPrice(normalizedSymbol)
        if (coingeckoPrice !== null) {
            this.cachePrice(normalizedSymbol, coingeckoPrice, 'coingecko')
            return coingeckoPrice
        }

        // Return null if no price found (no fake data!)
        console.warn(`No price found for ${normalizedSymbol}`)
        return null
    }

    /**
     * Get multiple token prices at once
     */
    async getTokenPrices(symbols: string[]): Promise<Map<string, number | null>> {
        const prices = new Map<string, number | null>()

        // Fetch all prices in parallel
        const promises = symbols.map(async (symbol) => {
            const price = await this.getTokenPrice(symbol)
            prices.set(symbol, price)
        })

        await Promise.all(promises)
        return prices
    }

    /**
     * Fetch price from Hyperliquid Core API
     */
    private async fetchHyperliquidPrice(symbol: string): Promise<number | null> {
        try {
            // First try spot prices
            const spotResponse = await fetch(`${this.HYPERLIQUID_API_URL}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'spotMeta' }),
            })

            if (spotResponse.ok) {
                const data = await spotResponse.json()
                const tokens = data.tokens || []

                for (const token of tokens) {
                    if (token.name === symbol && token.markPx) {
                        return parseFloat(token.markPx)
                    }
                }
            }

            // Try perp prices as fallback
            const perpResponse = await fetch(`${this.HYPERLIQUID_API_URL}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'allMids' }),
            })

            if (perpResponse.ok) {
                const perpData = await perpResponse.json()
                if (perpData[symbol]) {
                    return parseFloat(perpData[symbol])
                }
            }

            // Special handling for HYPE - try multiple endpoints
            if (symbol === 'HYPE') {
                // Try spotMetaAndAssetCtxs endpoint
                const assetResponse = await fetch(`${this.HYPERLIQUID_API_URL}/info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'spotMetaAndAssetCtxs' }),
                })

                if (assetResponse.ok) {
                    const assetData = await assetResponse.json()
                    // Look for HYPE in the response
                    if (assetData[0]?.['universe']?.find((asset: { name: string }) => asset.name === 'HYPE')) {
                        const hypeAsset = assetData[0]['universe'].find((asset: { name: string; markPx?: string }) => asset.name === 'HYPE')
                        if (hypeAsset?.markPx) {
                            const price = parseFloat(hypeAsset.markPx)
                            if (price > 0) {
                                console.log(`[PriceAggregator] HYPE price from spotMetaAndAssetCtxs: $${price}`)
                                return price
                            }
                        }
                    }
                }

                // Try meta endpoint as fallback
                const metaResponse = await fetch(`${this.HYPERLIQUID_API_URL}/info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'meta' }),
                })

                if (metaResponse.ok) {
                    const metaData = await metaResponse.json()
                    if (metaData?.universe?.find((asset: { name: string }) => asset.name === 'HYPE')) {
                        // Even if no price in meta, we know HYPE exists
                        console.log('[PriceAggregator] HYPE found in meta endpoint but no price available')
                    }
                }
            }

            return null
        } catch (error) {
            console.error(`Error fetching Hyperliquid price for ${symbol}:`, error)
            return null
        }
    }

    /**
     * Fetch price from CoinGecko API
     */
    private async fetchCoinGeckoPrice(symbol: string): Promise<number | null> {
        try {
            // Map symbols to CoinGecko IDs
            const coinGeckoMap: Record<string, string> = {
                HYPE: 'hyperliquid',
                BTC: 'bitcoin',
                ETH: 'ethereum',
                SOL: 'solana',
                ARB: 'arbitrum',
                USDC: 'usd-coin',
                USDT: 'tether',
                USDT0: 'tether', // Map USDT0 to Tether
            }

            const coinId = coinGeckoMap[symbol]
            if (!coinId) {
                return null
            }

            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
                headers: {
                    Accept: 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                if (data[coinId]?.usd) {
                    return data[coinId].usd
                }
            }

            return null
        } catch (error) {
            console.error(`Error fetching CoinGecko price for ${symbol}:`, error)
            return null
        }
    }

    /**
     * Cache price data
     */
    private cachePrice(symbol: string, price: number, source: 'hyperliquid' | 'coingecko' | 'manual') {
        this.priceCache.set(symbol, {
            symbol,
            price,
            source,
            timestamp: Date.now(),
        })
    }

    /**
     * Normalize token symbol
     */
    private normalizeSymbol(symbol: string): string {
        // Handle WHYPE -> HYPE mapping
        if (symbol === 'WHYPE') return 'HYPE'

        // Handle USD₮0 -> USDT0 mapping
        if (symbol === 'USD₮0') return 'USDT0'

        return symbol.toUpperCase()
    }

    /**
     * Clear price cache
     */
    clearCache() {
        this.priceCache.clear()
    }

    /**
     * Get cache status for debugging
     */
    getCacheStatus(): Map<string, TokenPrice> {
        return new Map(this.priceCache)
    }
}

// Export singleton instance
export const priceAggregator = PriceAggregatorService.getInstance()
