import { inngest } from '@/lib/inngest'
import { env } from '@/env/t3-env'
import type { AccountSnapshot } from '@/interfaces/account.interface'

/**
 * Cron job that fetches snapshots and stores them via API using native Inngest steps
 */
export const pullAndStoreAnalyticsCron = inngest.createFunction(
    {
        id: 'pull-and-store-analytics-cron',
        name: 'Pull and Store Account Snapshots (Cron)',
    },
    {
        cron: env.ANALYTICS_CRON || '*/30 * * * *', // Every 30 minutes
    },
    async ({ step, logger }) => {
        const startTime = Date.now()

        // Step 1: Get accounts to monitor
        const accounts = await step.run('get-accounts', async () => {
            const accountList = env.MONITORED_WALLETS ? env.MONITORED_WALLETS.split(',').map((addr) => addr.trim().toLowerCase()) : []

            if (accountList.length === 0) {
                logger.info('No accounts configured for monitoring')
            } else {
                logger.info(`📊 Starting snapshot cron for ${accountList.length} accounts`)
            }

            return accountList
        })

        if (accounts.length === 0) {
            return { success: true, accountsProcessed: 0, snapshotsStored: 0 }
        }

        const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const results: { account: string; success: boolean; error?: string }[] = []

        // Process each account with separate steps
        for (const account of accounts) {
            // Step 2: Fetch snapshot for each account
            const snapshot = await step.run(`fetch-snapshot-${account}`, async () => {
                try {
                    const response = await fetch(`${baseUrl}/api/snapshot/${account}`)

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                    }

                    const data: AccountSnapshot = await response.json()

                    if (!data.success) {
                        throw new Error(data.error || 'Snapshot fetch failed')
                    }

                    logger.info(`📥 Fetched snapshot for ${account}`)
                    return data
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    logger.error(`Failed to fetch snapshot for ${account}: ${errorMessage}`)
                    return null
                }
            })

            if (!snapshot) {
                results.push({ account, success: false, error: 'Failed to fetch snapshot' })
                continue
            }

            // Step 3: Store snapshot for each account
            const stored = await step.run(`store-snapshot-${account}`, async () => {
                try {
                    const response = await fetch(`${baseUrl}/api/analytics/store-snapshot`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(snapshot),
                    })

                    if (!response.ok) {
                        const errorText = await response.text()
                        throw new Error(`HTTP ${response.status}: ${errorText}`)
                    }

                    logger.info(`✅ Stored snapshot for ${account}`)
                    return true
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    logger.error(`Failed to store snapshot for ${account}: ${errorMessage}`)
                    return false
                }
            })

            results.push({
                account,
                success: stored,
                error: stored ? undefined : 'Failed to store snapshot',
            })
        }

        // Step 4: Summarize results
        return await step.run('summarize-results', async () => {
            const snapshotsStored = results.filter((r) => r.success).length
            const duration = Date.now() - startTime

            logger.info(`✅ Cron completed in ${duration}ms`, {
                accountsProcessed: accounts.length,
                snapshotsStored,
                failed: accounts.length - snapshotsStored,
            })

            // Log individual failures for debugging
            const failures = results.filter((r) => !r.success)
            if (failures.length > 0) {
                logger.warn('Failed accounts:', failures)
            }

            return {
                success: true,
                accountsProcessed: accounts.length,
                snapshotsStored,
                duration,
                results,
            }
        })
    },
)
