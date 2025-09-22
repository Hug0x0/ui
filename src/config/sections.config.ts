/**
 * Centralized configuration for account sections
 * Single source of truth for section naming, styling, and organization
 */

/**
 * Section type identifiers
 */
export enum SectionType {
    LONG_EVM = 'long_evm',
    WALLET = 'wallet',
    PERPS = 'perps',
    SPOTS = 'spots',
    LP = 'lp',
    HYPERDRIVE = 'hyperdrive',
}

/**
 * Platform identifiers
 */
export enum Platform {
    HYPER_EVM = 'HyperEVM',
    HYPER_CORE = 'HyperCore',
}

/**
 * Section configuration
 */

export const SECTION_CONFIG: Record<SectionType, SectionConfig> = {
    [SectionType.LONG_EVM]: {
        displayName: 'Yield leg',
        chartSeriesName: 'Yield Δ',
        className: 'text-hyper-evm-lps',
        platform: Platform.HYPER_EVM,
        description: 'Combined LP and HyperDrive Positions',
        subSections: {
            lps: 'LPs',
            hyperdrive: 'Lending',
        },
    },
    [SectionType.LP]: {
        displayName: 'LPs',
        chartSeriesName: 'LPs Δ',
        className: 'text-hyper-evm-lps',
        platform: Platform.HYPER_EVM,
        description: 'LPs',
        isSubSection: true,
        parentSection: SectionType.LONG_EVM,
    },
    [SectionType.HYPERDRIVE]: {
        displayName: 'HyperDrive',
        chartSeriesName: 'HyperDrive Δ',
        className: 'text-hyper-drive',
        platform: Platform.HYPER_EVM,
        description: 'HyperDrive Money Market Positions',
        isSubSection: true,
        parentSection: SectionType.LONG_EVM,
    },
    [SectionType.WALLET]: {
        displayName: 'Wallet',
        chartSeriesName: 'Wallet Δ',
        className: 'text-hyper-evm-balances',
        platform: Platform.HYPER_EVM,
        description: 'Wallet Balances',
    },
    [SectionType.PERPS]: {
        displayName: 'Short leg',
        chartSeriesName: 'Short Δ',
        className: 'text-hyper-core-perps',
        platform: Platform.HYPER_CORE,
        description: 'Perpetual Positions',
        subSections: {
            idleUSDC: 'Idle USDC (withdrawable but kept in account)',
            shortPositions: 'Short Positions',
        },
    },
    [SectionType.SPOTS]: {
        displayName: 'Spot',
        chartSeriesName: 'Spots Δ',
        className: 'text-hyper-core-spots',
        platform: Platform.HYPER_CORE,
        description: 'Spot Balances',
    },
} as const

/**
 * Chart series names mapping
 * Used for consistent naming between sections and charts
 */
export const CHART_SERIES_NAMES = {
    hyperLpBalance: 'HyperLP balance',
    deployedAUM: 'Deployed AUM',
    lps: SECTION_CONFIG[SectionType.LP].chartSeriesName,
    wallet: SECTION_CONFIG[SectionType.WALLET].chartSeriesName,
    perps: SECTION_CONFIG[SectionType.PERPS].chartSeriesName,
    spots: SECTION_CONFIG[SectionType.SPOTS].chartSeriesName,
    hyperdrive: SECTION_CONFIG[SectionType.HYPERDRIVE].chartSeriesName,
    strategyDelta: 'Strategy Δ',
    netDelta: 'Net Δ',
} as const

/**
 * Helper to get section config by type
 */
export function getSectionConfig(type: SectionType) {
    return SECTION_CONFIG[type]
}

/**
 * Helper to get all sections for a platform
 */
export function getSectionsByPlatform(platform: Platform) {
    return Object.entries(SECTION_CONFIG)
        .filter(([, config]) => config.platform === platform)
        .map(([type, config]) => ({ type: type as SectionType, ...config }))
}

/**
 * Helper to get all main sections (non-subsections)
 */
export function getMainSections() {
    return Object.entries(SECTION_CONFIG)
        .filter(([, config]) => !config.isSubSection)
        .map(([type, config]) => ({ type: type as SectionType, ...config }))
}

/**
 * Helper to get subsections for a parent section
 */
export function getSubSections(parentType: SectionType) {
    return Object.entries(SECTION_CONFIG)
        .filter(([, config]) => config.isSubSection && config.parentSection === parentType)
        .map(([type, config]) => ({ type: type as SectionType, ...config }))
}

/**
 * Type exports for TypeScript
 */
export interface SectionConfig {
    displayName: string
    chartSeriesName: string
    className: string
    platform: Platform
    description: string
    subSections?: Record<string, string>
    isSubSection?: boolean
    parentSection?: SectionType
}

export type ChartSeriesName = (typeof CHART_SERIES_NAMES)[keyof typeof CHART_SERIES_NAMES]
