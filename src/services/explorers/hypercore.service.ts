// HyperCore API types for transactions
export interface HyperCoreFill {
    coin: string
    px: string // price
    sz: string // size
    side: 'B' | 'A' // Buy or Ask (Sell)
    time: number
    startPosition: string
    dir: 'Open' | 'Close' | 'Flip'
    closedPnl: string
    hash: string
    oid: number // order id
    crossed: boolean
    fee: string
    tid: number // trade id
    liquidation?: boolean
    fundings?: Array<{
        time: number
        coin: string
        usdc: string
        szi: string
        fundingRate: string
    }>
}

export interface HyperCoreTransaction {
    type: 'trade' | 'liquidation' | 'funding'
    coin: string
    side: 'long' | 'short' | 'buy' | 'sell'
    size: number
    price: number
    value: number
    fee: number
    pnl?: number
    fundingRate?: number
    timestamp: number
    hash: string
    status: 'success' | 'failed'
}

export class HyperCoreService {
    private readonly apiUrl = 'https://api.hyperliquid.xyz'

    /**
     * Fetch user fills (trades) from HyperCore
     */
    async getUserFills(userAddress: string, limit: number = 10): Promise<HyperCoreFill[]> {
        try {
            const response = await fetch(`${this.apiUrl}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'userFills',
                    user: userAddress,
                    aggregateByTime: false,
                }),
            })

            if (!response.ok) {
                throw new Error(`HyperCore API error: ${response.status}`)
            }

            const fills: HyperCoreFill[] = await response.json()

            // Sort by time descending and limit
            return fills.sort((a, b) => b.time - a.time).slice(0, limit)
        } catch (error) {
            console.error('Error fetching HyperCore fills:', error)
            return []
        }
    }

    /**
     * Fetch funding payments for a user
     */
    async getUserFundingHistory(userAddress: string, limit: number = 10): Promise<unknown[]> {
        try {
            const response = await fetch(`${this.apiUrl}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'userFundingHistory',
                    user: userAddress,
                }),
            })

            if (!response.ok) {
                throw new Error(`HyperCore API error: ${response.status}`)
            }

            const fundingHistory = await response.json()

            // Limit and return
            return fundingHistory.slice(0, limit)
        } catch (error) {
            console.error('Error fetching HyperCore funding history:', error)
            return []
        }
    }

    /**
     * Parse HyperCore fills into standardized transaction format
     */
    parseToTransactions(fills: HyperCoreFill[]): HyperCoreTransaction[] {
        return fills.map((fill) => {
            const size = Math.abs(parseFloat(fill.sz))
            const price = parseFloat(fill.px)
            const fee = parseFloat(fill.fee)
            const pnl = fill.closedPnl ? parseFloat(fill.closedPnl) : undefined

            return {
                type: fill.liquidation ? 'liquidation' : 'trade',
                coin: fill.coin,
                side: fill.side === 'B' ? 'buy' : 'sell',
                size,
                price,
                value: size * price,
                fee,
                pnl,
                timestamp: fill.time,
                hash: fill.hash,
                status: 'success',
            }
        })
    }

    /**
     * Get combined transaction history (trades + funding)
     */
    async getTransactionHistory(userAddress: string, limit: number = 10): Promise<HyperCoreTransaction[]> {
        const fills = await this.getUserFills(userAddress, limit)
        return this.parseToTransactions(fills)
    }
}
