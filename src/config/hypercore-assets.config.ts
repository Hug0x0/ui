import { FileIds } from '@/enums'

/**
 * HyperCore Asset Configuration
 * Defines assets available on HyperCore (Hyperliquid L1) for spot and perpetual trading
 */
export interface HyperCoreAssetConfig {
    symbol: string
    name: string
    decimals: number
    fileId?: FileIds
    isStablecoin: boolean
    supportedInstruments: ('spot' | 'perp')[]
    hypercoreAssetId?: number // Asset ID in HyperCore API
    description?: string
    decimalsForRounding: number
}

/**
 * HYPE - Native token of Hyperliquid
 * Supports both spot trading and perpetual futures
 */
const HYPERCORE_HYPE: HyperCoreAssetConfig = {
    symbol: 'HYPE',
    name: 'Hyperliquid',
    decimals: 18,
    fileId: FileIds.TOKEN_HYPE,
    isStablecoin: false,
    supportedInstruments: ['spot', 'perp'],
    hypercoreAssetId: 3, // Check current index via API
    description: 'Native token of the Hyperliquid ecosystem',
    decimalsForRounding: 1,
}

/**
 * USDC - USD Coin
 * Primary stablecoin for perpetual margin and spot trading
 */
const HYPERCORE_USDC: HyperCoreAssetConfig = {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    fileId: FileIds.TOKEN_USDC,
    isStablecoin: true,
    supportedInstruments: ['spot'],
    description: 'Primary stablecoin for margin and settlements on HyperCore',
    decimalsForRounding: 0,
}

/**
 * USDT0 - Tether USD (HyperEVM bridge token)
 * Stablecoin primarily for spot trading
 */
const HYPERCORE_USDT0: HyperCoreAssetConfig = {
    symbol: 'USDT0',
    name: 'Tether USD',
    decimals: 6,

    fileId: FileIds.TOKEN_USDT0,
    isStablecoin: true,
    supportedInstruments: ['spot'],
    description: 'Tether USD bridged from HyperEVM',
    decimalsForRounding: 0,
}

/**
 * Main HyperCore assets array
 */
export const HYPERCORE_ASSETS: HyperCoreAssetConfig[] = [HYPERCORE_HYPE, HYPERCORE_USDC, HYPERCORE_USDT0]

/**
 * Assets grouped by type for easy access
 */
export const HYPERCORE_ASSET_GROUPS = {
    stablecoins: HYPERCORE_ASSETS.filter((asset) => asset.isStablecoin),
    volatile: HYPERCORE_ASSETS.filter((asset) => !asset.isStablecoin),
    perpEnabled: HYPERCORE_ASSETS.filter((asset) => asset.supportedInstruments.includes('perp')),
    spotOnly: HYPERCORE_ASSETS.filter((asset) => asset.supportedInstruments.includes('spot') && !asset.supportedInstruments.includes('perp')),
}

/**
 * Helper function to get asset by symbol
 */
export function getHyperCoreAssetBySymbol(symbol: string): HyperCoreAssetConfig | undefined {
    // Normalize USDT0 variations (handle USD₮0 vs USDT0)
    const normalizedSymbol = symbol.replace('USD₮0', 'USDT0').toUpperCase()

    return HYPERCORE_ASSETS.find((asset) => {
        const assetSymbol = asset.symbol.replace('USD₮0', 'USDT0').toUpperCase()
        return assetSymbol === normalizedSymbol
    })
}

/**
 * Helper function to check if asset supports perpetual trading
 */
export function assetSupportsPerp(symbol: string): boolean {
    const asset = getHyperCoreAssetBySymbol(symbol)
    return asset?.supportedInstruments.includes('perp') ?? false
}

/**
 * Helper function to check if asset is a stablecoin
 */
export function isStablecoin(symbol: string): boolean {
    const asset = getHyperCoreAssetBySymbol(symbol)
    return asset?.isStablecoin ?? false
}

/**
 * Export individual assets for direct access
 */
export { HYPERCORE_HYPE, HYPERCORE_USDC, HYPERCORE_USDT0 }

/**
 * Asset symbols as constants
 */
export const HYPERCORE_ASSET_SYMBOLS = {
    HYPE: 'HYPE',
    USDC: 'USDC',
    USDT0: 'USDT0',
} as const

export type HyperCoreAssetSymbol = keyof typeof HYPERCORE_ASSET_SYMBOLS
