'use client'

import { useEffect, useState } from 'react'
import PullToRefresh from '@/components/common/PullToRefresh'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
    const [, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if running on iOS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

        // Check if already installed
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
        }
    }, [])

    // Enable pull-to-refresh in standalone PWA mode or development
    const enablePullToRefresh = isStandalone || process.env.NODE_ENV === 'development'

    // const CONTENT = (
    //     <div className="fixed bottom-0 left-0 right-0 p-4 text-center">
    //         <p className="text-xs max-w-[300px] mx-auto text-primary flex items-center justify-center gap-1 flex-wrap">
    //             <span className="font-semibold">Add to Home Screen</span>
    //             <span className="text-base">📲</span>
    //         </p>
    //     </div>
    // )

    if (enablePullToRefresh) {
        return (
            <PullToRefresh>
                {children}
                {/* {!isStandalone && isIOS && CONTENT} */}
            </PullToRefresh>
        )
    }

    return (
        <>
            {children}
            {/* {!isStandalone && isIOS && CONTENT} */}
        </>
    )
}
