/**
 * Pool APR calculation interfaces
 */

export interface PoolToken {
    id: string
    symbol: string
    decimals: string
}

export interface V3Pool {
    id: string
    feeTier: string
    liquidity: string
    token0: PoolToken
    token1: PoolToken
    volumeUSD: string
    feesUSD: string
    totalValueLockedUSD: string
}

export interface PoolDayData {
    date: number
    volumeUSD: string
    feesUSD: string
    tvlUSD: string
}

export interface PoolAPRMetrics {
    apr24h: number
    apr7d: number
    apr30d: number
    avgDailyVolume: number
    avgDailyFees: number
}

export interface PoolAPRData {
    dex: string
    poolAddress: string
    feeTier: number
    token0Symbol: string
    token1Symbol: string
    tvlUSD: number
    volume24h: number
    fees24h: number
    apr24h: number
    apr7d: number
    apr30d: number
}

export interface AggregatedPoolAPR {
    pools: PoolAPRData[]
    averageAPR24h: number
    totalTVL: number
    totalVolume24h: number
    totalFees24h: number
    lastUpdated: number
}

export interface SubgraphResponse<T> {
    data?: T
    errors?: Array<{
        message: string
        locations?: Array<{ line: number; column: number }>
    }>
}

export interface PoolsQueryResponse {
    pools: V3Pool[]
}

export interface PoolDayDatasQueryResponse {
    poolDayDatas: PoolDayData[]
}
