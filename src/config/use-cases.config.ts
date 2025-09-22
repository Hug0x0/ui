import { AppDemoAccountAddresses, AppUrls, FileIds } from '@/enums'
import { UseCase } from '@/interfaces'
import { DEMO_ACCOUNTS, SITE_DOMAIN } from './app.config'

export const useCases: UseCase[] = [
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
