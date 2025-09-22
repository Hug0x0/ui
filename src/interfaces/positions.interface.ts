/**
 * Position-related interfaces for LP, Spot, and Perp positions
 */

export interface LPPosition {
    id: string
    tokenId: string
    dex: string
    pool?: string
    token0: string
    token1: string
    token0Symbol: string
    token1Symbol: string
    fee?: number
    tickLower?: number
    tickUpper?: number
    tickCurrent?: number
    liquidity: string | number
    sqrtPriceX96?: string | bigint
    inRange: boolean
    valueUSD: number
    token0Amount?: number
    token1Amount?: number
    token0ValueUSD?: number
    token1ValueUSD?: number
    feeTier?: string | null
    fees0Uncollected?: number
    fees1Uncollected?: number
    unclaimedFees0?: number // Unclaimed fees in token0 (not yet collected from pool)
    unclaimedFees1?: number // Unclaimed fees in token1 (not yet collected from pool)
    unclaimedFeesUSD?: number // Total USD value of unclaimed fees
    isClosed?: boolean
}

export interface SpotBalance {
    id: string
    asset: string
    balance: string | number
    valueUSD: number
}

export interface HyperEvmBalance {
    id: string
    asset: string
    symbol: string
    address: string
    balance: string
    decimals: number
    valueUSD: number
}

export interface PerpPosition {
    id: string
    asset: string
    sizeUnits: number
    entryPriceUSD: number
    markPriceUSD: number
    marginUsedUSD: number
    unrealizedPnlUSD: number
    fundingPaidUSD: number
    notionalValueUSD: number
}

export interface PoolState {
    sqrtPriceX96: bigint
    tick: number
    liquidity: bigint
    feeGrowthGlobal0X128?: bigint
    feeGrowthGlobal1X128?: bigint
}

export interface PoolInfo {
    id: string
    address: string
    token0: string
    token1: string
    fee: number
    liquidity: bigint
    sqrtPriceX96: bigint
    tick: number
    tvlUSD?: number
}

export interface UnifiedPosition {
    id: string
    type: 'lp' | 'spot' | 'perp'
    protocol: string
    asset0?: string
    asset1?: string
    amount0?: number
    amount1?: number
    valueUSD: number
    delta?: number
    metadata?: Record<string, unknown>
}
