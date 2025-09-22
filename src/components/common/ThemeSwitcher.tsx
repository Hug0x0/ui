'use client'

import { cn } from '@/utils'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import IconWrapper from '../icons/IconWrapper'
import { APP_THEMES } from '@/config'

export default function ThemeSwitcher({
    containerClassName = 'gap-1',
    buttonClassName = 'px-2.5 py-1.5 rounded-xl',
    iconClassName = 'size-6 rounded-xl',
}: {
    containerClassName?: string
    buttonClassName?: string
    iconClassName?: string
}) {
    const [mounted, setMounted] = useState(false)
    const { resolvedTheme, setTheme } = useTheme()
    useEffect(() => setMounted(true), [])
    return (
        <div className={cn('z-50 flex items-center', containerClassName)}>
            {Object.entries(APP_THEMES)
                .sort((curr, next) => curr[1].index - next[1].index)
                .map(([theme, config]) => (
                    <button
                        key={theme}
                        aria-label={`Switch to ${theme} theme`}
                        onClick={() => setTheme(theme)}
                        className={cn('transition-all duration-300 ease-in-out', buttonClassName, {
                            'skeleton-loading': !mounted,
                            'bg-background/20': mounted && resolvedTheme === theme,
                            'bg-background/10 opacity-40 hover:opacity-100': mounted && resolvedTheme !== theme,
                        })}
                    >
                        {mounted ? <IconWrapper id={config.iconId} className={cn('m-auto', iconClassName)} /> : <div className={iconClassName} />}
                    </button>
                ))}
        </div>
    )
}
