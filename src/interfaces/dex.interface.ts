import type { Address } from 'viem'
import { ProtocolType } from '@/enums'

export { ProtocolType as DexProtocol }

// Renamed to avoid conflict with positions.interface.ts
export interface DexLPPosition {
    id: string
    dex: ProtocolType
    poolAddress: Address
    tokenId?: string
    positionManagerAddress?: Address
}

export interface LPMetrics {
    positionId: string
    dex: ProtocolType
    timestamp: Date
    totalValueUSD: number
    unclaimedFeesUSD: number
    feeAPR: number
    inRange: boolean
}

export interface UniswapV3Position {
    tokenId: bigint
    owner: Address
    token0: Address
    token1: Address
    fee: number
    tickLower: number
    tickUpper: number
    liquidity: bigint
    feeGrowthInside0LastX128: bigint
    feeGrowthInside1LastX128: bigint
    tokensOwed0: bigint
    tokensOwed1: bigint
}

// Full pool state with all Uniswap V3 fields
export interface FullPoolState {
    sqrtPriceX96: bigint
    tick: number
    liquidity: bigint
    fee: number
    token0: Address
    token1: Address
    feeGrowthGlobal0X128: bigint
    feeGrowthGlobal1X128: bigint
}

export interface DexPositionMetrics {
    tokenId: string
    poolAddress: Address
    token0Symbol: string
    token1Symbol: string
    token0Amount: number
    token1Amount: number
    token0ValueUSD: number
    token1ValueUSD: number
    totalValueUSD: number
    unclaimedFees0: number
    unclaimedFees1: number
    unclaimedFeesUSD: number
    impermanentLoss: number
    feeAPR: number
    inRange: boolean
    tickLower: number
    tickUpper: number
    currentTick: number
    liquidity: string
    priceRange: {
        lower: number
        upper: number
        current: number
    }
}

export interface TokenPrice {
    address: Address
    symbol: string
    decimals: number
    priceUSD: number
}

export interface DexAnalyticsResult {
    timestamp: Date
    positions: DexPositionMetrics[]
    totalValueLocked: number
    totalUnclaimedFees: number
    averageFeeAPR: number
}
