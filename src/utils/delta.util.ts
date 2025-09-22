/**
 * Delta calculation utility functions
 */

import { isHypeToken } from './token.util'
import type { LPPosition, SpotBalance, PerpPosition, HyperEvmBalance } from '@/interfaces/positions.interface'

export interface DeltaMetrics {
    lpDelta: number
    spotDelta: number
    perpDelta: number
    walletDelta: number
    netDelta: number
}

/**
 * Calculate LP delta from positions (in HYPE units)
 */
export function calculateLpDelta(lpPositions: LPPosition[] = []): number {
    return lpPositions.reduce((sum, p) => {
        const token0IsHype = isHypeToken(p.token0Symbol)
        const token1IsHype = isHypeToken(p.token1Symbol)

        if (token0IsHype && p.token0Amount) {
            return sum + p.token0Amount
        } else if (token1IsHype && p.token1Amount) {
            return sum + p.token1Amount
        }
        return sum
    }, 0)
}

/**
 * Calculate spot delta from balances (in HYPE units)
 */
export function calculateSpotDelta(spotBalances: SpotBalance[] = []): number {
    return spotBalances.filter((b) => b.asset === 'HYPE').reduce((sum, b) => sum + Number(b.balance), 0)
}

/**
 * Calculate perp delta from positions (in HYPE units)
 */
export function calculatePerpDelta(perpPositions: PerpPosition[] = []): number {
    return perpPositions.filter((p) => p.asset === 'HYPE').reduce((sum, p) => sum + p.sizeUnits, 0) // sizeUnits is already in HYPE units, negative means short
}

/**
 * Calculate wallet delta from balances (in HYPE units)
 */
export function calculateWalletDelta(walletBalances: HyperEvmBalance[] = []): number {
    return (
        walletBalances
            ?.filter((b) => isHypeToken(b.symbol))
            .reduce((sum, b) => {
                // Balance is in wei, convert to HYPE units
                const balance = Number(b.balance) / Math.pow(10, b.decimals)
                return sum + balance
            }, 0) || 0
    )
}

/**
 * Calculate all delta metrics
 */
export function calculateDeltaMetrics(
    lpPositions: LPPosition[] = [],
    spotBalances: SpotBalance[] = [],
    perpPositions: PerpPosition[] = [],
    walletBalances: HyperEvmBalance[] = [],
): DeltaMetrics {
    const lpDelta = calculateLpDelta(lpPositions)
    const spotDelta = calculateSpotDelta(spotBalances)
    const perpDelta = calculatePerpDelta(perpPositions)
    const walletDelta = calculateWalletDelta(walletBalances)
    const netDelta = lpDelta + spotDelta + perpDelta + walletDelta

    return {
        lpDelta,
        spotDelta,
        perpDelta,
        walletDelta,
        netDelta,
    }
}

/**
 * Get delta status text based on delta value
 */
export function getDeltaStatusText(delta: number): string {
    const absDelta = Math.abs(delta)
    if (absDelta < 0.01) return 'Neutral'
    if (absDelta < 0.5) return 'Near Neutral'
    if (absDelta < 2) return delta > 0 ? 'Slightly Long' : 'Slightly Short'
    if (absDelta < 5) return delta > 0 ? 'Long' : 'Short'
    return delta > 0 ? 'Very Long' : 'Very Short'
}

/**
 * Calculate delta ratio (delta as percentage of total value)
 */
export function calculateDeltaRatio(deltaInHype: number, hypePrice: number, totalValue: number): number {
    if (totalValue === 0) return 0
    const deltaValue = deltaInHype * hypePrice
    return (deltaValue / totalValue) * 100
}
