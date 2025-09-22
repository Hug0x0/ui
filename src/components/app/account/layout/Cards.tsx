'use client'

import { cn } from '@/utils'

export function SectionCard({
    children,
    className,
    hoverable = false,
    padding = 'p-2',
}: {
    children?: React.ReactNode
    className?: string
    hoverable?: boolean
    padding?: string
    isLoading?: boolean
}) {
    return (
        <div
            className={cn(
                'flex flex-col rounded-xl border border-default/5 bg-default/[0.02] p-3 transition-all duration-300 ease-in-out hover:border-solid hover:border-default/50',
                hoverable && 'hover:bg-default/50',
                className,
                padding,
            )}
        >
            {children}
        </div>
    )
}

export function ThemeCard({
    children,
    className,
    hoverable = false,
    padding = 'p-2',
    isLoading = false,
}: {
    children?: React.ReactNode
    className?: string
    hoverable?: boolean
    padding?: string
    isLoading?: boolean
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-1 rounded-lg border border-hl-light-green/40 bg-hl-light-green/5 transition-colors duration-300 ease-in-out hover:border-hl-light-green hover:bg-hl-light-green/10',
                hoverable && 'hover:bg-default/50',
                className,
                padding,
            )}
        >
            {isLoading ? (
                <div className="space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-default/20" />
                    <div className="h-6 w-32 animate-pulse rounded bg-default/20" />
                    <div className="h-3 w-24 animate-pulse rounded bg-default/20" />
                </div>
            ) : (
                children
            )}
        </div>
    )
}
