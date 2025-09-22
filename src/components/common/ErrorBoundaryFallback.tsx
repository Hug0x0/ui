'use client'

import { APP_PAGES } from '@/config/app.config'
import { redirect } from 'next/navigation'

export function ErrorBoundaryFallback({ error }: { error: Error }) {
    redirect(APP_PAGES[0].path)
    return (
        <div className="flex flex-col items-center p-4 text-xs">
            <p>Something went wrong...</p>
            <p className="rounded-md bg-background/10 p-1 text-primary">Error: {error.message}</p>
        </div>
    )
}
