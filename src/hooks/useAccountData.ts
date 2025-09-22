'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app.store'
import type { AccountSnapshot } from '@/interfaces'
import { IS_DEV, REFRESH_INTERVALS, TIME_INTERVALS } from '@/config'
import { AppUrls } from '@/enums/app.enum'
import { isValidSnapshot, sanitizeSnapshot } from '@/utils/snapshot-validator.util'

/**
 * Simplified hook that only handles fetching account data and updating the store.
 * Components should access data directly from the store using useAppStore selectors.
 */
export function useAccountData(address: string) {
    const queryClient = useQueryClient()
    const {
        addSnapshot,
        setCurrentAddress,
        setFetchingAccount,
        setAccountError,
        isFetchingAccount,
        accountError,
        setSnapshots,
        setRebalanceEvents,
        setHypercoreTrades,
    } = useAppStore()
    const rebalanceIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const historicalIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const tradesIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Function to fetch rebalance events
    const fetchRebalances = useCallback(() => {
        if (!address) return

        fetch(`/api/rebalances/${address}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setRebalanceEvents(data.data)
                }
            })
            .catch((err) => console.error('Failed to fetch rebalance events:', err))
    }, [address, setRebalanceEvents])

    // Function to fetch HyperCore trades
    const fetchHypercoreTrades = useCallback(() => {
        if (!address) return

        fetch(`/api/trades/${address}?limit=100`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.transactions) {
                    setHypercoreTrades(data.transactions)
                }
            })
            .catch((err) => console.error('Failed to fetch HyperCore trades:', err))
    }, [address, setHypercoreTrades])

    // Function to fetch historical snapshots
    const fetchHistoricalSnapshots = useCallback(() => {
        if (!address) return

        fetch(`${AppUrls.API_SNAPSHOTS}/${address}?limit=500`)
            .then((res) => res.json())
            .then((data) => {
                if (data.snapshots && Array.isArray(data.snapshots)) {
                    // Validate and sanitize each snapshot before storing
                    const validSnapshots = data.snapshots.filter(isValidSnapshot).map(sanitizeSnapshot)

                    if (validSnapshots.length < data.snapshots.length) {
                        console.warn(`[Historical Snapshots] Filtered out ${data.snapshots.length - validSnapshots.length} invalid snapshots`)
                    }

                    setSnapshots(validSnapshots)
                }
            })
            .catch((err) => console.error('Failed to refresh historical snapshots:', err))
    }, [address, setSnapshots])

    // Set current address when it changes and fetch historical snapshots
    useEffect(() => {
        if (address) {
            // Batch the initial operations to minimize re-renders
            Promise.all([
                // Set address first
                Promise.resolve(setCurrentAddress(address)),
                // Then fetch all data in parallel
                fetchHistoricalSnapshots(),
                fetchRebalances(),
                fetchHypercoreTrades(),
            ]).catch((err) => console.error('Error during initial data fetch:', err))

            // Set up interval to fetch rebalances every 10 seconds
            const rebalanceIntervalMs = TIME_INTERVALS.SECONDS_10
            rebalanceIntervalRef.current = setInterval(fetchRebalances, rebalanceIntervalMs)

            // Set up interval to fetch trades every 10 seconds
            tradesIntervalRef.current = setInterval(fetchHypercoreTrades, rebalanceIntervalMs)

            // Set up interval to refresh historical snapshots periodically
            const historicalIntervalMs = REFRESH_INTERVALS.HISTORICAL_DATA
            historicalIntervalRef.current = setInterval(fetchHistoricalSnapshots, historicalIntervalMs)
        }
        return () => {
            // Clear intervals when unmounting or address changes
            if (rebalanceIntervalRef.current) {
                clearInterval(rebalanceIntervalRef.current)
                rebalanceIntervalRef.current = null
            }
            if (tradesIntervalRef.current) {
                clearInterval(tradesIntervalRef.current)
                tradesIntervalRef.current = null
            }
            if (historicalIntervalRef.current) {
                clearInterval(historicalIntervalRef.current)
                historicalIntervalRef.current = null
            }
            // Clear when unmounting
            setCurrentAddress(null)
            setAccountError(null)
            setRebalanceEvents([])
            setHypercoreTrades([])
        }
    }, [
        address,
        setCurrentAddress,
        setAccountError,
        fetchHistoricalSnapshots,
        fetchRebalances,
        setRebalanceEvents,
        fetchHypercoreTrades,
        setHypercoreTrades,
    ])

    // Main data query - only for fetching fresh data
    const {
        data: freshData,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['account', address],
        queryFn: async (): Promise<AccountSnapshot> => {
            const response = await fetch(`${AppUrls.API_SNAPSHOT}/${address}`)
            if (!response.ok) {
                if (response.status === 404) throw new Error('Account not found')
                throw new Error('Failed to fetch account data')
            }
            return response.json()
        },
        enabled: !!address,
        staleTime: IS_DEV ? REFRESH_INTERVALS.DEV : REFRESH_INTERVALS.PROD,
        gcTime: REFRESH_INTERVALS.CACHE_GC,
        refetchInterval: IS_DEV ? REFRESH_INTERVALS.DEV : REFRESH_INTERVALS.PROD,
    })

    // Update store when data changes
    useEffect(() => {
        setFetchingAccount(isFetching)
    }, [isFetching, setFetchingAccount])

    useEffect(() => {
        setAccountError(error instanceof Error ? error : null)
    }, [error, setAccountError])

    // Add snapshot to history on each refresh
    useEffect(() => {
        if (freshData && address) {
            // Validate snapshot before adding
            const snapshotWithAddress = {
                ...freshData,
                address: address,
            }

            if (isValidSnapshot(snapshotWithAddress)) {
                // Sanitize to ensure all optional fields have safe defaults
                const sanitized = sanitizeSnapshot(snapshotWithAddress)
                addSnapshot(sanitized)
            } else {
                console.error('[useAccountData] Received invalid snapshot from API, skipping')
            }
        }
    }, [freshData, address, addSnapshot])

    // Force refresh function that invalidates cache
    const forceRefresh = useCallback(async () => {
        // Invalidate the query cache to force a fresh fetch
        await queryClient.invalidateQueries({
            queryKey: ['account', address],
            exact: true,
        })
        // Then refetch
        return refetch()
    }, [queryClient, address, refetch])

    // Return minimal interface for triggering refresh
    return {
        isLoading: isLoading || (!freshData && isFetchingAccount),
        isFetching,
        error: error || accountError,
        refetch: forceRefresh, // Use forceRefresh instead of regular refetch
    }
}
