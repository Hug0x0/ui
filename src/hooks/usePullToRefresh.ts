'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>
    threshold?: number
    resistance?: number
}

export function usePullToRefresh({ onRefresh, threshold = 80, resistance = 2.5 }: UsePullToRefreshOptions) {
    const [isPulling, setIsPulling] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Use refs for values that shouldn't trigger re-renders
    const touchStartY = useRef(0)
    const currentPullDistance = useRef(0)
    const isPullingRef = useRef(false)
    const isRefreshingRef = useRef(false)

    const handleRefresh = useCallback(async () => {
        if (isRefreshingRef.current) return

        isRefreshingRef.current = true
        setIsRefreshing(true)

        try {
            await onRefresh()
        } finally {
            isRefreshingRef.current = false
            setIsRefreshing(false)
        }
    }, [onRefresh])

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // Only start pull-to-refresh if we're at the top of the page
            if (window.scrollY <= 0 && !isRefreshingRef.current) {
                touchStartY.current = e.touches[0].clientY
            } else {
                touchStartY.current = 0
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartY.current || isRefreshingRef.current) return

            const currentY = e.touches[0].clientY
            const distance = currentY - touchStartY.current

            // Only trigger if pulling down and at top of page
            if (distance > 0 && window.scrollY <= 0) {
                // Prevent default scroll behavior
                if (e.cancelable) {
                    e.preventDefault()
                }

                isPullingRef.current = true
                setIsPulling(true)

                // Apply resistance to make it feel more natural
                const resistedDistance = Math.min(distance / resistance, threshold * 2)
                currentPullDistance.current = resistedDistance
                setPullDistance(resistedDistance)
            } else if (isPullingRef.current && distance <= 0) {
                // User is scrolling up, cancel pull-to-refresh
                isPullingRef.current = false
                setIsPulling(false)
                currentPullDistance.current = 0
                setPullDistance(0)
                touchStartY.current = 0
            }
        }

        const handleTouchEnd = () => {
            if (!isPullingRef.current) return

            if (currentPullDistance.current >= threshold) {
                handleRefresh()
            }

            // Reset states
            isPullingRef.current = false
            setIsPulling(false)
            currentPullDistance.current = 0
            setPullDistance(0)
            touchStartY.current = 0
        }

        // Add event listeners
        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        document.addEventListener('touchmove', handleTouchMove, { passive: false })
        document.addEventListener('touchend', handleTouchEnd, { passive: true })
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true })

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleTouchEnd)
            document.removeEventListener('touchcancel', handleTouchEnd)
        }
    }, [threshold, resistance, handleRefresh])

    return {
        isPulling,
        pullDistance,
        isRefreshing,
        isReady: pullDistance >= threshold,
    }
}
