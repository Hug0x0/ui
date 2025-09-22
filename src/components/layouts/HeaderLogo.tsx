'use client'

import LinkWrapper from '../common/LinkWrapper'
import { AppUrls } from '@/enums'
import { FileIds } from '@/enums/files.enum'
import { ImageWrapper } from '../common/ImageWrapper'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export default function HeaderLogo() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted && resolvedTheme === 'dark'

    return (
        <LinkWrapper href={AppUrls.HOME} className="flex cursor-pointer items-center gap-1">
            <span className="relative inline-block">
                {isDark && (
                    <span
                        className="via-bg-white pointer-events-none absolute left-1/2 top-2/3 -z-10 block h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-hl-light-green/10 to-hl-light-green/30 opacity-20 blur-[8px] transition-colors"
                        aria-hidden="true"
                    />
                )}
                <ImageWrapper src={FileIds.APP_LOGO} alt="Logo" width={80} height={80} />
            </span>
            <div className="group flex h-min flex-col">
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-light transition-colors ease-in-out hover:underline" style={{ color: '#3ed783' }}>
                        Harb
                    </p>
                </div>
                <ImageWrapper
                    src={mounted && isDark ? FileIds.POWERED_BY_HYPERLIQUID_HL300 : FileIds.POWERED_BY_HYPERLIQUID_HL800}
                    alt="Logo"
                    width={140}
                    height={16}
                    className="rounded-none"
                />
            </div>
        </LinkWrapper>
    )
}
