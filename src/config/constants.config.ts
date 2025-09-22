/**
 * Application constants and default values
 * SINGLE SOURCE OF TRUTH for all constants - DO NOT CREATE SEPARATE CONSTANT FILES
 */

// Transaction Configuration
export const DEFAULT_TRANSACTION_LIMIT = 10
export const TRANSACTION_PAGE_SIZE = 50

// Delta Thresholds
export const DELTA_THRESHOLDS = {
    NEUTRAL: 0.01,
    NEAR_NEUTRAL: 0.5,
    SLIGHTLY_EXPOSED: 2,
    EXPOSED: 5,
} as const

// Position Colors (from account.constants.ts)
export const POSITION_COLORS = {
    LONG: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        darkBg: 'dark:bg-green-900',
        darkText: 'dark:text-green-200',
    },
    SHORT: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        darkBg: 'dark:bg-red-900',
        darkText: 'dark:text-red-200',
    },
} as const

// Delta Status Messages (from account.constants.ts)
export const DELTA_STATUS = {
    NEUTRAL: '✓ Neutral',
    NEAR_NEUTRAL: '⚠ Near neutral',
    REBALANCE_NEEDED: '⚠ Rebalance needed',
} as const

// Time Intervals (in milliseconds)
export const TIME_INTERVALS = {
    SECONDS_10: 10000,
    SECONDS_30: 30000,
    MINUTE_1: 60000,
    MINUTES_5: 300000,
} as const

// Refresh Intervals
export const REFRESH_INTERVALS = {
    DEV: TIME_INTERVALS.MINUTES_5, // 5 minutes for development
    PROD: TIME_INTERVALS.SECONDS_30, // 30 seconds for production
    CACHE_GC: TIME_INTERVALS.MINUTES_5, // Query cache garbage collection
    RATE_LIMIT: TIME_INTERVALS.MINUTES_5, // Rate limit window
    HISTORICAL_DATA: TIME_INTERVALS.MINUTES_5, // Refresh historical snapshots every 5 minutes
} as const

// Cache Configuration
export const CACHE_DURATION = {
    POOL_STATE: TIME_INTERVALS.MINUTE_1, // 1 minute
    TOKEN_PRICE: TIME_INTERVALS.MINUTE_1, // 1 minute
    ACCOUNT_DATA: TIME_INTERVALS.SECONDS_30, // 30 seconds
    DEFAULT: TIME_INTERVALS.MINUTES_5, // 5 minutes
} as const

// Contract Addresses
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
export const ACCOUNT_LENS_ADDRESS = '0x42D3aF2812E79e051cCbA7aE1C757839Edfb3113'

// API Configuration
export const API_TIMEOUT = TIME_INTERVALS.SECONDS_30
export const API_RETRY_COUNT = 3
export const API_RETRY_DELAY = 1000 // 1 second base delay
export const API_RETRY_MAX_DELAY = TIME_INTERVALS.SECONDS_30

// Display Configuration
export const MAX_DECIMAL_PLACES = {
    USD: 2,
    TOKEN: 6,
    PERCENTAGE: 2,
    DELTA: 4,
} as const

// Token Lists
export const HYPE_TOKENS = ['HYPE', 'WHYPE'] as const
export const STABLE_TOKENS = ['USDT0', 'USD₮0', 'USDC'] as const

// Platform Names
export const PLATFORM_NAMES = {
    HYPER_EVM: 'HyperEVM',
    HYPER_CORE: 'HyperCore',
} as const

// ============================================
// UI CONSTANTS (from ui.constants.ts)
// ============================================

// Table styling
export const TABLE_HEADER_CLASSES = 'sticky top-0 z-10 h-10 border-b border-default/10 bg-default/5 backdrop-blur'

// Modal animations (consistent across all modals)
export const MODAL_ANIMATION_CONFIG = {
    backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 },
    },
    content: {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
}

// Common modal styling
export const MODAL_BACKDROP_CLASSES = 'fixed inset-0 z-50 bg-default/40 backdrop-blur-sm'
export const MODAL_CONTAINER_CLASSES = 'fixed inset-0 z-50 flex items-center justify-center p-4'
export const MODAL_CONTENT_CLASSES =
    'relative flex max-h-[70vh] w-full flex-col overflow-hidden rounded-2xl border border-default/10 bg-background shadow-2xl'
export const MODAL_HEADER_CLASSES = 'flex items-center justify-between border-b border-default/10 px-6 py-4'
export const MODAL_CLOSE_BUTTON_CLASSES = 'rounded-lg p-2 text-default/50 transition-colors hover:bg-default/10 hover:text-default'

// Row styling
export const TABLE_ROW_HOVER_CLASSES = 'py-3 transition-colors hover:bg-default/5'

// ============================================
// SCHEMA CONSTANTS (from schema.constants.ts)
// ============================================

export const SCHEMA_VERSION = {
    CURRENT: '1.0.0',
    VERSIONS: {
        '1.0.0': {
            date: '2025-01-17',
            description: 'Initial schema with complete account snapshot structure',
            changes: [
                'Added positions (hyperEvm.lps, hyperEvm.balances, hyperCore.perps, hyperCore.spots)',
                'Added metrics (values, deltas, APRs)',
                'Added deployedAUM tracking',
                'Added unclaimed fees tracking',
                'Added market data and prices',
                'Added performance timings',
            ],
        },
    },
} as const

/**
 * Check if a schema version is compatible with the current version
 */
export function isSchemaVersionCompatible(version: string): boolean {
    return version === SCHEMA_VERSION.CURRENT
}

/**
 * Get the major version number from a semantic version string
 */
export function getMajorVersion(version: string): number {
    const [major] = version.split('.')
    return parseInt(major, 10)
}
