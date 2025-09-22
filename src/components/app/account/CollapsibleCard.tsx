'use client'

import { useState } from 'react'
import { IconIds } from '@/enums'
import IconWrapper from '@/components/icons/IconWrapper'
import { SectionCard } from './layout/Cards'
import { ReactNode } from 'react'
import { cn } from '@/utils'

export function CollapsibleCard({
    title,
    children,
    defaultExpanded = false,
    headerRight,
    isLoading = false,
}: {
    title: ReactNode
    children?: ReactNode
    defaultExpanded?: boolean
    headerRight?: ReactNode
    isLoading?: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <SectionCard padding="p-0">
            {/* header */}
            <div className="flex items-center justify-between py-2 pl-2 pr-4">
                <button onClick={() => setIsExpanded(!isExpanded)} className="flex flex-1 items-center gap-2 text-left">
                    <IconWrapper
                        id={IconIds.CHEVRON_DOWN}
                        className={cn(
                            'size-5 transition-transform',
                            isExpanded ? 'text-background-opposite' : 'text-default',
                            isExpanded && 'rotate-180',
                        )}
                    />
                    {title}
                </button>
                {isLoading ? <div className="h-5 w-24 animate-pulse rounded bg-default/20" /> : headerRight}
            </div>

            {/* content */}
            {isExpanded &&
                (isLoading ? (
                    <div className="mt-2 space-y-2 p-4">
                        <div className="h-4 w-full animate-pulse rounded bg-default/20" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-default/20" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-default/20" />
                    </div>
                ) : (
                    children
                ))}
        </SectionCard>
    )
}
