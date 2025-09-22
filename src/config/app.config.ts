import { AppDemoAccountAddresses, AppUrls, FileIds } from '@/enums'
import { env } from '@/env/t3-env'
import { InterfaceAppLink, UseCase } from '@/interfaces'

export {
    DEFAULT_TRANSACTION_LIMIT,
    DELTA_THRESHOLDS,
    CACHE_DURATION,
    REFRESH_INTERVALS,
    TIME_INTERVALS,
    MULTICALL3_ADDRESS,
    API_TIMEOUT,
    API_RETRY_MAX_DELAY,
} from './constants.config'

export const SITE_NAME = 'HyperLP'
export const IS_DEV = process.env.NODE_ENV === 'development'
export const SITE_DOMAIN = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const SITE_URL = SITE_DOMAIN.replace('www.', '')
export const APP_METADATA = {
    SITE_NAME,
    SHORT_NAME: 'HyperLP',
    SITE_DOMAIN,
    SITE_DESCRIPTION: 'Composable delta-neutral LP',
    SITE_URL: SITE_URL,
    AUTHOR: {
        name: 'HyperLP',
        twitter: '@hyperlp',
        url: 'https://twitter.com/hyperlp',
    },
    STRUCTURED_DATA: {
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Any',
        price: '0',
        priceCurrency: 'USD',
        about: {
            name: 'HyperLP',
            description: 'Composable delta-neutral LP',
        },
    },
}

export const APP_PAGES: InterfaceAppLink[] = [
    {
        name: 'Home',
        path: AppUrls.HOME,
    },
] as const

export const DEMO_ACCOUNTS: Record<
    AppDemoAccountAddresses,
    {
        id: AppDemoAccountAddresses
        address: string
        name: string
        description: string
        hasLP: boolean
        hasHyperDrive: boolean
    }
> = {
    [AppDemoAccountAddresses.HYPERSWAP_1_2]: {
        id: AppDemoAccountAddresses.HYPERSWAP_1_2,
        address: '0x3cEe139542222D0d15BdCB8fd519B2615662B1E3',
        name: 'HyperSwap 1/2',
        description: 'Demo - Delta neutral LP on Hyperswap (actively rebalanced)',
        hasLP: true,
        hasHyperDrive: false,
    },
    [AppDemoAccountAddresses.HYPERSWAP_2_2]: {
        id: AppDemoAccountAddresses.HYPERSWAP_2_2,
        address: '0x8466D5b78CaFc01fC1264D2D724751b70211D979',
        name: 'HyperSwap 2/2',
        description: 'Demo - Delta neutral LP on Hyperswap (actively rebalanced)',
        hasLP: true,
        hasHyperDrive: false,
    },
    [AppDemoAccountAddresses.PROJECT_X]: {
        id: AppDemoAccountAddresses.PROJECT_X,
        address: '0x10B4F7e91f045363714015374D2d9Ff58Fda3186',
        name: 'Project X',
        description: 'Demo - Delta neutral LP on Project X (actively rebalanced)',
        hasLP: true,
        hasHyperDrive: false,
    },
    [AppDemoAccountAddresses.HYPERDRIVE]: {
        id: AppDemoAccountAddresses.HYPERDRIVE,
        address: '0x15bB17E4D2F7ACcca7c9610133c27e9eAB9EC815',
        name: 'HyperDrive',
        description: 'Demo - Delta neutral lending of HYPE on Hyperdrive',
        hasLP: false,
        hasHyperDrive: true,
    },
} as const

/**
 * use cases
 */

export const USE_CASES: UseCase[] = [
    {
        title: 'Delta-neutral LP on Project X',
        description: 'Earn LP fees + short funding',
        banner: FileIds.BANNER_PROJETX,
        url: `${SITE_DOMAIN}${AppUrls.ACCOUNT}/${DEMO_ACCOUNTS[AppDemoAccountAddresses.PROJECT_X].address}`,
    },
    {
        title: 'Delta-neutral Lending on HyperDrive',
        description: 'Earn interests + short funding',
        banner: FileIds.BANNER_HYPERDRIVE,
        url: `${SITE_DOMAIN}${AppUrls.ACCOUNT}/${DEMO_ACCOUNTS[AppDemoAccountAddresses.HYPERDRIVE].address}`,
    },
    {
        title: 'Delta-neutral LP on HyperSwap',
        description: 'Earn LP fees + short funding',
        banner: FileIds.BANNER_HYPERSWAP,
        url: `${SITE_DOMAIN}${AppUrls.ACCOUNT}/${DEMO_ACCOUNTS[AppDemoAccountAddresses.HYPERSWAP_2_2].address}`,
    },
]
