import { FileIds } from '@/enums'
import { TokenConfig } from '@/interfaces'
import type { Address } from 'viem'

// Token addresses as constants
export const NATIVE_HYPE_ADDRESS = '0x0000000000000000000000000000000000000000' as Address
export const WRAPPED_HYPE_ADDRESS = '0x5555555555555555555555555555555555555555' as Address
export const USDT0_ADDRESS = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb' as Address

const NATIVE_HYPE: TokenConfig = {
    name: 'Hype',
    decimals: 18,
    symbol: 'HYPE',
    address: NATIVE_HYPE_ADDRESS,
    chainId: 999,
    tags: ['native', 'tokenv1'],
    fileId: FileIds.TOKEN_HYPE,
    decimalsForRounding: 1,
}

const WRAPPED_HYPE: TokenConfig = {
    name: 'Wrapped Hype',
    decimals: 18,
    symbol: 'WHYPE',
    address: WRAPPED_HYPE_ADDRESS,
    chainId: 999,
    tags: ['tokenv1'],
    fileId: FileIds.TOKEN_HYPE,
    decimalsForRounding: 1,
}

const USDT0: TokenConfig = {
    name: 'USD₮0',
    symbol: 'USD₮0',
    decimals: 6,
    address: USDT0_ADDRESS,
    chainId: 999,
    tags: ['tokenv1'],
    fileId: FileIds.TOKEN_USDT0,
    decimalsForRounding: 0,
}

export const HYPEREVM_TOKENS: TokenConfig[] = [NATIVE_HYPE, WRAPPED_HYPE, USDT0]

// Re-export as grouped object (for backward compatibility with services/constants/tokens.ts)
export const TOKEN_ADDRESSES = {
    HYPE: {
        native: NATIVE_HYPE_ADDRESS,
        wrapped: WRAPPED_HYPE_ADDRESS,
    },
    USDT0: USDT0_ADDRESS,
} as const

// Array of HYPE addresses for convenience
export const HYPE_ADDRESSES = [NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS] as const

// Cache durations for various data types
export const CACHE_DURATIONS = {
    POOL_INFO: 5 * 60 * 1000, // 5 minutes
    TOKEN_METADATA: 60 * 60 * 1000, // 1 hour
    PRICE_DATA: 30 * 1000, // 30 seconds
} as const

// Helper functions
export function getTokenBySymbol(symbol: string): TokenConfig | undefined {
    // Normalize USDT0 variations (handle USD₮0 vs USDT0)
    const normalizedSymbol = symbol.replace('USD₮0', 'USDT0').toUpperCase()

    return HYPEREVM_TOKENS.find((token) => {
        const tokenSymbol = token.symbol.replace('USD₮0', 'USDT0').toUpperCase()
        return tokenSymbol === normalizedSymbol
    })
}

export function getTokenByAddress(address: string): TokenConfig | undefined {
    const normalizedAddress = address.toLowerCase()
    return HYPEREVM_TOKENS.find((token) => token.address.toLowerCase() === normalizedAddress)
}

export function getTokenDecimals(address: string): number {
    const token = getTokenByAddress(address)
    return token?.decimals ?? 18 // Default to 18 if not found
}
