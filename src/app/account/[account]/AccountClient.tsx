'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/common/PageWrapper'
import { useAccountData } from '@/hooks/useAccountData'
import { useAppStore } from '@/stores/app.store'
import AccountTemplate from '@/components/app/account/layout/AccountTemplate'
import { REFRESH_INTERVALS } from '@/config/app.config'
import { IS_DEV } from '@/config'
import { getDurationBetween } from '@/utils/date.util'

// Section components
import AccountHeader from '@/components/app/account/sections/AccountHeader'
import AccountLongEVM from '@/components/app/account/sections/AccountLongEVM'
import AccountWallet from '@/components/app/account/sections/AccountWallet'
import AccountPerps from '@/components/app/account/sections/AccountPerps'
import AccountSpots from '@/components/app/account/sections/AccountSpots'
import DeltaTrackingChart from '@/components/charts/account/DeltaTrackingChart'

export default function AccountClient() {
    const params = useParams()
    const accountFromUrl = params?.account as string
    const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null)
    const [nextUpdateIn, setNextUpdateIn] = useState<string>('')
    const [chartKey, setChartKey] = useState(0) // Force re-mount chart
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

    // Use the simplified hook for data fetching
    const { isFetching, error, refetch } = useAccountData(accountFromUrl)

    // Get data directly from the store
    const getLatestSnapshot = useAppStore((state) => state.getLatestSnapshot)
    const snapshot = getLatestSnapshot()

    // Update refresh time when new data arrives
    useEffect(() => {
        if (snapshot) {
            setLastRefreshTime(Date.now())
            // Mark as initially loaded once we have data
            if (!hasInitiallyLoaded) {
                setHasInitiallyLoaded(true)
            }
        }
    }, [snapshot, hasInitiallyLoaded])

    // Calculate next update countdown
    useEffect(() => {
        if (!lastRefreshTime) return

        const updateInterval = IS_DEV ? REFRESH_INTERVALS.DEV : REFRESH_INTERVALS.PROD

        const calculateTimeLeft = () => {
            const now = Date.now()
            const nextUpdateTime = lastRefreshTime + updateInterval

            if (now >= nextUpdateTime) {
                return 'now'
            }

            const duration = getDurationBetween({
                startTs: now,
                endTs: nextUpdateTime,
                showYears: false,
                showMonths: false,
                showWeeks: false,
                showDays: false,
                showHours: false,
                showMinutes: true,
                showSeconds: true,
                shortFormat: true,
                ago: false,
            })

            // Remove the "ago" suffix from oneLiner
            return duration.oneLiner.replace(' ago', '').trim()
        }

        // Update immediately
        setNextUpdateIn(calculateTimeLeft())

        // Update every second
        const timer = setInterval(() => {
            setNextUpdateIn(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(timer)
    }, [lastRefreshTime])

    // Dev-only: Add keyboard shortcut to force reload chart (Ctrl/Cmd + Shift + R)
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return

        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault()
                console.log('[Dev] Force reloading chart...')
                setChartKey((prev) => prev + 1)
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [])

    // Extract metrics for display
    const metrics = snapshot?.metrics

    return (
        <PageWrapper className="px-4">
            {/* Always render AccountTemplate, just show loading content inside it */}
            {error && !snapshot ? (
                // Show simple error state if there's an error
                <div className="space-y-4 py-12 text-center">
                    <p className="text-default/50">{error instanceof Error ? error.message : 'Failed to load account'}</p>
                </div>
            ) : (
                // Always show the account template with animations
                <AccountTemplate
                    header={
                        <AccountHeader
                            accountFromUrl={accountFromUrl}
                            lastRefreshTime={lastRefreshTime}
                            nextUpdateIn={nextUpdateIn}
                            isFetching={isFetching}
                            refetch={refetch}
                            metrics={metrics || {}}
                            timings={snapshot?.timings}
                        />
                    }
                    // charts={null}
                    charts={<DeltaTrackingChart key={chartKey} />}
                    hyperEvm={{
                        longEvm: <AccountLongEVM />,
                        balances: <AccountWallet />,
                        txs: null,
                    }}
                    hyperCore={{
                        short: <AccountPerps />,
                        spot: <AccountSpots />,
                        txs: null,
                    }}
                    activity={
                        null
                        // <CollapsibleCard title="Activity" defaultExpanded={false} headerRight={null}>
                        //     <CombinedActivity account={params.account as string} limit={50} />
                        // </CollapsibleCard>
                    }
                />
            )}
        </PageWrapper>
    )
}
