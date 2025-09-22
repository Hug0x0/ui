import { Metadata } from 'next'
import AccountClient from './AccountClient'
import { DEMO_ACCOUNTS } from '@/config/app.config'

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ account: string }> }): Promise<Metadata> {
    const { account } = await params

    // Find the account name from the address
    const accountInfo = Object.values(DEMO_ACCOUNTS).find((acc) => acc.address.toLowerCase() === account.toLowerCase())

    const accountName = accountInfo?.name || 'HyperLP Account'

    return {
        title: accountName,
        description: accountInfo?.description || 'HyperLP Account',
    }
}

export default function AccountPage() {
    return <AccountClient />
}
