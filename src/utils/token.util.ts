/**
 * Token-related utility functions
 */

import { HYPE_TOKENS, STABLE_TOKENS } from '@/config/constants.config'

export function isHypeToken(symbol: string): boolean {
    return (HYPE_TOKENS as readonly string[]).includes(symbol)
}

export function isStableToken(symbol: string): boolean {
    return (STABLE_TOKENS as readonly string[]).includes(symbol)
}

interface Position {
    token0Symbol?: string
    token1Symbol?: string
    token0Amount?: number
    token1Amount?: number
    token0ValueUSD?: number
    token1ValueUSD?: number
}

interface Balance {
    symbol: string
    balance?: string | number
    valueUSD?: number
    decimals: number
}

export function calculateHypePrice(positions: { lp?: Position[]; wallet?: Balance[] }): number | null {
    // Try to get from LP positions
    if (positions.lp?.length) {
        const hypePosition = positions.lp.find(
            (p) => (p.token0Symbol && isHypeToken(p.token0Symbol)) || (p.token1Symbol && isHypeToken(p.token1Symbol)),
        )
        if (hypePosition) {
            const isToken0Hype = hypePosition.token0Symbol ? isHypeToken(hypePosition.token0Symbol) : false
            const hypeAmount = isToken0Hype ? hypePosition.token0Amount : hypePosition.token1Amount
            const hypeValue = isToken0Hype ? hypePosition.token0ValueUSD : hypePosition.token1ValueUSD

            if (hypeAmount && hypeValue && hypeAmount > 0) {
                return hypeValue / hypeAmount
            }
        }
    }

    // Try to get from wallet balances
    if (positions.wallet?.length) {
        const hypeBalance = positions.wallet.find((b) => b.symbol === 'HYPE')
        if (hypeBalance?.balance && hypeBalance.valueUSD) {
            const amount = Number(hypeBalance.balance) / 10 ** hypeBalance.decimals
            if (amount > 0) return hypeBalance.valueUSD / amount
        }
    }

    // Return null if we can't determine the price
    return null
}

export interface TokenBreakdown {
    total: number
    hypeValue: number
    stableValue: number
    hypePercent: number
    stablePercent: number
}

export function calculateTokenBreakdown(lpPositions: Position[] = [], walletBalances: Balance[] = []): TokenBreakdown {
    let hypeValue = 0
    let stableValue = 0

    // LP positions
    lpPositions.forEach((p) => {
        // Token 0
        if (p.token0Symbol && isHypeToken(p.token0Symbol)) {
            hypeValue += p.token0ValueUSD || 0
        } else if (p.token0Symbol && isStableToken(p.token0Symbol)) {
            stableValue += p.token0ValueUSD || 0
        }
        // Token 1
        if (p.token1Symbol && isHypeToken(p.token1Symbol)) {
            hypeValue += p.token1ValueUSD || 0
        } else if (p.token1Symbol && isStableToken(p.token1Symbol)) {
            stableValue += p.token1ValueUSD || 0
        }
    })

    // Wallet balances
    walletBalances.forEach((b) => {
        if (isHypeToken(b.symbol)) {
            hypeValue += b.valueUSD || 0
        } else if (isStableToken(b.symbol)) {
            stableValue += b.valueUSD || 0
        }
    })

    const total = hypeValue + stableValue
    return {
        total,
        hypeValue,
        stableValue,
        hypePercent: total > 0 ? (hypeValue / total) * 100 : 0,
        stablePercent: total > 0 ? (stableValue / total) * 100 : 0,
    }
}
