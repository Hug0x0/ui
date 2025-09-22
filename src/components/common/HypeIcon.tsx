'use client'

import { FileIds } from '@/enums'
import FileMapper from './FileMapper'
import { cn } from '@/utils'

interface HypeIconProps {
    size?: number
    className?: string
}

export function HypeIcon({ size = 16, className }: HypeIconProps) {
    return <FileMapper id={FileIds.TOKEN_HYPE} width={size} height={size} className={cn('rounded-full', className)} />
}
