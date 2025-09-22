'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_RETRY_MAX_DELAY } from '@/config/app.config'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Network error retry configuration
            retry: (failureCount, error) => {
                // Don't retry on 4xx client errors
                if (error instanceof Error && error.message.includes('4')) {
                    return false
                }
                // Retry up to 3 times with exponential backoff
                return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, API_RETRY_MAX_DELAY),
            refetchOnWindowFocus: true,
            // Keep trying when offline
            networkMode: 'offlineFirst',
        },
        mutations: {
            // Mutation retry configuration
            retry: 1,
            networkMode: 'offlineFirst',
        },
    },
})

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
