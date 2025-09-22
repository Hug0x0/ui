/**
 * Account and metrics-related interfaces
 * AccountData is the main entrypoint containing all account information
 */

import type { PerpPosition, SpotBalance, HyperEvmBalance } from './positions.interface'
import type { AggregatedPoolAPR } from './pool-apr.interface'
import type { PositionLeg, PositionTypeMetrics } from './position-leg.interface'

/**
 * Main account data interface - the single source of truth for account information
 */

export interface AccountSnapshot {
    success: boolean
    error?: string
    schemaVersion: string // Semantic versioning for data structure (e.g., '1.0.0')
    timestamp: number
    address: string // Single address for both EVM and Core (they're the same)

    // 1. Positions organized by type
    positions: {
        // Long legs (yield-generating positions)
        longLegs: Array<{
            type: string // 'lp', 'staking', etc.
            positions: PositionLeg[]
        }>

        // Short legs (hedges)
        shortLegs: {
            perps: Array<PerpPosition>
        }

        // Idle capital
        idle: {
            balances: Array<HyperEvmBalance> // Wallet balances
            spots: Array<SpotBalance> // Spot balances on Core
        }
    }

    // 2. Metrics organized by platform
    metrics: AccountSnapshotMetrics

    // 3. Market data (not user-specific)
    marketData: {
        poolAPR?: AggregatedPoolAPR // HYPE/USDT0 pool APR data across all DEXs
    }

    // 4. prices
    prices: {
        HYPE: number // HYPE price in USD
        USDC: number // USDC price in USD
        USDT: number // USDT price in USD
    }

    // 5. Performance timings
    timings: {
        longLegs: Array<{
            type: string
            fetchTimeMs: number
        }>
        shortLegs: {
            perpsMs: number // Perp fetch time in milliseconds
        }
        idle: {
            balancesMs: number // Wallet balances fetch time in milliseconds
            spotsMs: number // Spot balances fetch time in milliseconds
        }
    }

    // 6. Wallet metadata
    wallet?: {
        hyperEvmNonce: number // Current nonce on HyperEVM chain
    }
}

export interface AccountSnapshotMetrics {
    // Metrics for each long leg type
    longLegs: Array<{
        type: string
        metrics: PositionTypeMetrics
    }>

    // Short leg metrics (perps for hedging)
    shortLegs: {
        values: {
            perpsNotionalUSD: number
            perpsPnlUSD: number
            perpsMarginUSD: number // Total margin used
            perpsValueUSD: number // Margin + PnL
            withdrawableUSDC: number // Withdrawable USDC from HyperCore
        }
        deltas: {
            perpsDeltaHYPE: number // Perp delta in HYPE units (negative for shorts)
        }
        perpAggregates: {
            totalMarginUSD: number // Total margin used across all perp positions
            totalNotionalUSD: number // Total notional value (absolute) across all perp positions
            totalPnlUSD: number // Total unrealized PnL across all perp positions
            avgLeverageRatio: number // Average leverage across all perp positions
        }
        apr: {
            avgFundingAPR24h: number | null // 24h historical average funding APR
            avgFundingAPR7d: number | null // 7d historical average funding APR
            avgFundingAPR30d: number | null // 30d historical average funding APR
        }
    }

    // Idle capital metrics
    idle: {
        values: {
            balancesValueUSD: number // Wallet balances value in USD
            spotValueUSD: number // Spot balances value in USD
            totalValueUSD: number // Total idle capital in USD
        }
        deltas: {
            balancesDeltaHYPE: number // Wallet delta in HYPE units
            spotDeltaHYPE: number // Spot delta in HYPE units
            totalDeltaHYPE: number // Total idle delta in HYPE units
        }
    }

    // Portfolio-wide aggregated metrics
    portfolio: {
        totalValueUSD: number // Total portfolio value in USD
        deployedValueUSD: number // Deployed AUM (long legs + short legs) in USD
        idleValueUSD: number // Idle capital in USD

        // Delta metrics
        longDeltaHYPE: number // Total long delta from all long legs
        shortDeltaHYPE: number // Total short delta from perps
        netDeltaHYPE: number // Net delta exposure in HYPE units
        strategyDeltaHYPE: number // Long-short delta (hedge effectiveness)
        hedgeEfficiencyRatio: number // Short delta / Long delta (ideal = -1 for perfect hedge)

        // Combined APR from all yield sources
        apr: {
            combined24h: number | null // Weighted average 24h APR
            combined7d: number | null // Weighted average 7d APR
            combined30d: number | null // Weighted average 30d APR
        }

        // Actual allocation percentages
        allocation: {
            longPercentage: number // % of deployed capital in long positions
            shortPercentage: number // % of deployed capital in short positions
        }

        // APR breakdown by source
        aprSources: {
            // Long leg weighted APR
            longAPR24h: number | null
            longAPR7d: number | null
            longAPR30d: number | null

            // Funding APR (already exists in shortLegs.apr, but repeated here for convenience)
            fundingAPR24h: number | null
            fundingAPR7d: number | null
            fundingAPR30d: number | null
        }
    }
}
