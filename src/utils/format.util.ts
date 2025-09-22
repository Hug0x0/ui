import numeral from 'numeral'

export const shortenValue = (value: string, chars = 3) => {
    if (chars >= value.length) return value
    return `${value.slice(0, chars)}...${value.slice(-chars)}`
}

export const cleanOutput = (output: string | number, defaultOutput = '-'): string => {
    const strOutput = String(output).replaceAll('~', '').replaceAll(' ', '')
    if (strOutput === '0') return defaultOutput
    if (strOutput === '0%') return defaultOutput
    if (strOutput === '0$') return defaultOutput
    if (strOutput === '0k$') return defaultOutput
    if (strOutput === '0m$') return defaultOutput
    if (strOutput.includes('NaN')) return defaultOutput
    return String(output)
}

/**
 * Number formatting utilities
 */

/**
 * Format number with commas and decimal places
 */
export function formatNumber(value: number, decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value)
}

/**
 * Format value as USD currency
 */
export const formatUSD = (amount: number | string) => {
    try {
        const isNegative = Number(amount) < 0
        const absAmount = Math.abs(Number(amount))
        if (absAmount < 1.15)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[0000]')}$`
        if (absAmount < 10)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[000]')}$`
        if (absAmount < 100)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[00]')}$`
        if (absAmount < 10000)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0')}$`
        if (absAmount < 1000000)
            return `${numeral(absAmount)
                .divide(1000)
                .multiply(isNegative ? -1 : 1)
                .format('0,0')}k$`
        if (absAmount >= 1000000000)
            return `${numeral(absAmount)
                .multiply(isNegative ? -1 : 1)
                .format('0,0.[0]a')}$`
        return `${numeral(absAmount)
            .divide(1000000)
            .multiply(isNegative ? -1 : 1)
            .format('0,0')}m$`
    } catch (error) {
        console.error(error)
        return `error ${amount}`
    }
}

/**
 * Convert wei/smallest unit to token amount
 */
export function formatTokenAmount(amount: bigint | string | number, decimals: number): number {
    const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount)
    return Number(amountBigInt) / Math.pow(10, decimals)
}

/**
 * Format token amount with symbol
 */
export function formatTokenWithSymbol(amount: number, symbol: string, decimals = 4): string {
    return `${formatNumber(amount, decimals)} ${symbol}`
}

/**
 * Format delta value with +/- sign
 */
export function formatDelta(value: number, decimals = 1): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}`
}

/**
 * Get color class for delta value
 */
export function getDeltaColor(value: number): string {
    if (Math.abs(value) < 0.01) return 'text-default/50'
    return value >= 0 ? 'text-green-600' : 'text-red-600'
}

/**
 * Get delta status message
 */
export function getDeltaStatus(value: number): string {
    const absValue = Math.abs(value)
    if (absValue < 0.1) return 'Neutral'
    if (absValue < 1) return 'Near neutral'
    return 'Rebalance'
}
