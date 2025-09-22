'use client'

import { cn } from '@/utils'
import type { ReactNode } from 'react'

export type Side = 'long' | 'short' | 'buy' | 'sell' | string

interface SideBadgeProps {
    side: Side
    children: ReactNode
    className?: string
}

export function SideBadge({ side, children, className }: SideBadgeProps) {
    const lowerSide = side.toLowerCase()
    const isLong = lowerSide === 'long' || lowerSide === 'buy'
    const isShort = lowerSide === 'short' || lowerSide === 'sell'

    return (
        <span
            className={cn(
                'rounded px-1.5 py-0.5 text-sm font-medium',
                isLong
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : isShort
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-default/10 text-default/50',
                className,
            )}
        >
            {children}
        </span>
    )
}
