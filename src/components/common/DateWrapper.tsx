'use client'

import { cn, DAYJS_FORMATS, getDurationBetween } from '@/utils'
import StyledTooltip from './StyledTooltip'
import { useState, useEffect } from 'react'

interface DateWrapperProps {
    date?: string | number | Date | null
    showAgo?: boolean
    className?: string
    children?: React.ReactNode
}

export function DateWrapper(props: DateWrapperProps) {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])
    if (!props.date) return null
    return (
        <StyledTooltip
            disableAnimation={true}
            content={
                <div className="space-y-1">
                    <div>{DAYJS_FORMATS.dateLong(props.date)} UTC</div>
                    {props.showAgo && (
                        <div className="text-xs opacity-90">
                            {
                                getDurationBetween({
                                    startTs: new Date(props.date).getTime(),
                                    endTs: now.getTime(),
                                    showYears: false,
                                    showMonths: false,
                                    showWeeks: false,
                                }).oneLiner
                            }
                        </div>
                    )}
                </div>
            }
        >
            {props.children}
        </StyledTooltip>
    )
}

export function DateWrapperAccurate(props: DateWrapperProps) {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])
    if (!props.date) return null
    return (
        <DateWrapper date={props.date}>
            <span className={cn('cursor-help truncate hover:underline', props.className)}>
                {
                    getDurationBetween({
                        startTs: new Date(props.date).getTime(),
                        endTs: now.getTime(),
                        showYears: false,
                        showMonths: false,
                        showWeeks: false,
                    }).oneLiner
                }
            </span>
        </DateWrapper>
    )
}

export function TimeAgo(props: DateWrapperProps) {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])
    if (!props.date) return null
    return getDurationBetween({
        startTs: new Date(props.date).getTime(),
        endTs: now.getTime(),
        showYears: false,
        showMonths: false,
        showWeeks: false,
    }).oneLiner
}
