'use client'

import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { cn } from '@/utils'
import { ReactNode, useEffect, useState } from 'react'
import IconWrapper from '@/components/icons/IconWrapper'
import { IconIds } from '@/enums/icons.enum'

interface PullToRefreshProps {
    children: ReactNode
    className?: string
}

export default function PullToRefresh({ children, className }: PullToRefreshProps) {
    // Override onRefresh to reload the whole page
    const handlePageReload = async () => {
        window.location.reload()
        // Return a promise that never resolves to keep the loading state
        return new Promise<void>(() => {})
    }

    const { isPulling, pullDistance, isRefreshing, isReady } = usePullToRefresh({
        onRefresh: handlePageReload,
        threshold: 60,
        resistance: 2.5,
    })

    const [showSpinner, setShowSpinner] = useState(false)

    useEffect(() => {
        if (isRefreshing) {
            setShowSpinner(true)
            const timer = setTimeout(() => {
                setShowSpinner(false)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [isRefreshing])

    return (
        <>
            {/* Pull indicator - Fixed positioned to avoid clipping */}
            {(isPulling || isRefreshing) && (
                <div
                    className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-end justify-center"
                    style={{
                        height: `${Math.max(pullDistance, 60)}px`,
                        transform: `translateY(-${Math.max(60 - pullDistance, 0)}px)`,
                        transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
                    }}
                >
                    <div className="mb-3">
                        <div
                            className={cn(
                                'flex size-10 items-center justify-center rounded-full border-2 transition-all duration-200',
                                isRefreshing || isReady ? 'border-primary bg-primary/20' : '',
                            )}
                            style={{
                                transform: isRefreshing
                                    ? 'scale(1)'
                                    : `rotate(${Math.min(pullDistance * 2, 180)}deg) scale(${Math.min(pullDistance / 60, 1)})`,
                            }}
                        >
                            <IconWrapper
                                id={IconIds.REFRESH}
                                className={cn('size-6', showSpinner && 'animate-spin', isRefreshing || isReady ? 'text-primary' : '')}
                                style={{
                                    transform: isRefreshing ? undefined : `rotate(${-Math.min(pullDistance * 2, 180)}deg)`,
                                }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-primary">Reload</p>
                    </div>
                </div>
            )}

            {/* Content wrapper */}
            <div
                className={cn('relative flex min-h-screen flex-col', className)}
                style={{
                    transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
                    transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {children}
            </div>
        </>
    )
}
