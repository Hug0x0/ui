/**
 * Generic position leg interfaces for DRY architecture
 * Supports multiple yield sources: LP, Staking, Lending, etc.
 */

/**
 * Base interface for all position legs (long positions that generate yield)
 */
export interface BasePositionLeg {
    // Identity
    type: string // 'lp' | 'staking' | 'lending' | etc.
    id: string // Unique identifier for this position
    protocol: string // Protocol name (e.g., 'hyperswap', 'aave', etc.)

    // Value metrics (all in USD)
    valueUSD: number // Current position value
    costBasisUSD?: number // Initial investment value
    pnlUSD?: number // Profit/loss

    // Delta exposure (in HYPE units)
    deltaHYPE: number // Net HYPE exposure from this position

    // Yield metrics
    apr?: {
        current: number | null // Current/instantaneous APR
        avg24h: number | null // 24h average
        avg7d: number | null // 7d average
        avg30d: number | null // 30d average
    }

    // Timestamps
    entryTime?: number // When position was opened
    lastUpdated: number // Last data refresh
}

/**
 * LP-specific position leg
 */
export interface LPPositionLeg extends BasePositionLeg {
    type: 'lp'

    // LP-specific fields
    poolAddress: string
    token0Symbol: string
    token1Symbol: string
    token0AmountUnits: number
    token1AmountUnits: number
    lpTokenAmountUnits?: number
    feeTier?: string

    // Unclaimed rewards
    unclaimedFeesUSD: number
    unclaimedRewardsUSD?: number // For farms/incentives

    // Range (for concentrated liquidity)
    inRange?: boolean
    priceLower?: number
    priceUpper?: number
}

/**
 * Staking position leg (future)
 */
export interface StakingPositionLeg extends BasePositionLeg {
    type: 'staking'

    // Staking-specific fields
    stakedToken: string
    stakedAmount: number
    rewardToken: string
    unclaimedRewardsUSD: number
    lockEndTime?: number // For locked staking
}

/**
 * Lending position leg (future)
 */
export interface LendingPositionLeg extends BasePositionLeg {
    type: 'lending'

    // Lending-specific fields
    asset: string
    suppliedAmount: number
    borrowAPY?: number // If also borrowing
    utilizationRate?: number
    unclaimedInterestUSD: number
}

/**
 * HyperDrive position leg (money market)
 */
export interface HyperDrivePositionLeg extends BasePositionLeg {
    type: 'hyperdrive'

    // HyperDrive-specific fields (from AccountLens)
    marketId: number
    sharesUnits: number // Share tokens in the market
    assetsUnits: number // Underlying asset amount (key field)
    liabilitiesUnits: number // Borrowed amount
    borrowLimitUnits: number // Maximum borrowing capacity
    liquidationLimitUnits: number // Liquidation threshold
    healthScore: number // Position health (1-10000, where 10000 = 100% healthy)

    // Collateral info
    collateralSymbol?: string
    collateralSuppliedUnits?: number
    maxLTV?: number // Maximum loan-to-value ratio
    liquidationLTV?: number // LTV at which liquidation occurs
}

/**
 * Union type for all position legs
 */
export type PositionLeg = LPPositionLeg | StakingPositionLeg | LendingPositionLeg | HyperDrivePositionLeg

/**
 * Aggregated metrics for a position type
 */
export interface PositionTypeMetrics {
    // Total values in USD
    totalValueUSD: number
    totalUnclaimedUSD: number
    totalPnlUSD: number

    // Delta in HYPE units
    totalDeltaHYPE: number

    // Weighted average APRs
    weightedAPR: {
        current: number | null
        avg24h: number | null
        avg7d: number | null
        avg30d: number | null
    }

    // Position count
    positionCount: number
}

/**
 * Processing result from position processors
 */
export interface PositionProcessingResult {
    positions: PositionLeg[]
    metrics: PositionTypeMetrics
    fetchTimeMs: number
    error?: string // Simple error indicator
}

/**
 * Configuration for position types
 */
export interface PositionTypeConfig {
    type: string
    enabled: boolean
    weight: number // For portfolio allocation (e.g., 0.67 for 2/3)
    displayName: string
    icon?: string
}
