'use client'

import { cn } from '@/utils'
import { ReactNode, useState, useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { FileIds } from '@/enums'
import { SectionCard, ThemeCard } from './Cards'
import FileMapper from '@/components/common/FileMapper'
import { useTheme } from 'next-themes'
import { AppThemes } from '@/enums'
import { IS_DEV } from '@/config'
import { SECTION_CONFIG, SectionType } from '@/config/sections.config'
import { motion } from 'framer-motion'

export function ErrorBoundaryTemplate(props: { error: string }) {
    return (
        <ThemeCard className="gap-5 px-0 pb-0">
            <div className="p-5 text-red-500">{props.error}</div>
        </ThemeCard>
    )
}

export default function AccountTemplate(props: {
    charts?: ReactNode
    header: ReactNode

    hyperEvm: {
        longEvm: ReactNode
        balances: ReactNode
        txs: ReactNode
    }
    hyperCore: {
        short: ReactNode
        spot: ReactNode
        txs: ReactNode
    }
    activity?: ReactNode
    className?: string
}) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Determine theme for images - use light theme as default to avoid hydration mismatch
    const imageTheme = mounted ? resolvedTheme : AppThemes.LIGHT

    return (
        <motion.div
            className={cn('flex flex-col gap-5', props.className)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
            }}
        >
            {/* --------------- Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
                {props.header}
            </motion.div>

            {/* --------------- Content */}
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
                {/* 1. historic of snapshots */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-1"
                >
                    <SectionCard className="h-[400px] !p-1 md:h-[460px] md:!p-2">{props.charts}</SectionCard>
                </motion.div>

                {/* 2. last snapshot */}
                <motion.div
                    className="3xl:w-[800px] flex h-min w-full flex-col gap-8 lg:w-[500px] xl:w-[600px] 2xl:w-[700px]"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* HyperEvm */}
                    <div>
                        <FileMapper
                            id={imageTheme === AppThemes.DARK ? FileIds.HYPER_EVM_MINT : FileIds.HYPER_EVM_DARK}
                            width={200}
                            height={28}
                            scaleByHeight
                            className="ml-4 rounded-none"
                            priority
                        />
                        <div className="flex flex-col gap-2 p-2">
                            {/* Yield leg EVM Positions (LP + HyperDrive) */}
                            <ErrorBoundary
                                fallback={
                                    <ErrorBoundaryTemplate error={`Error loading ${SECTION_CONFIG[SectionType.LONG_EVM].displayName} positions`} />
                                }
                            >
                                {props.hyperEvm.longEvm}
                            </ErrorBoundary>

                            {/* Balances */}
                            <ErrorBoundary fallback={<ErrorBoundaryTemplate error="Error loading HyperEvm balances" />}>
                                {props.hyperEvm.balances}
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* HyperCore */}
                    <div>
                        <FileMapper
                            id={imageTheme === AppThemes.DARK ? FileIds.HYPER_CORE_MINT : FileIds.HYPER_CORE_DARK}
                            width={200}
                            height={28}
                            scaleByHeight
                            className="ml-4 rounded-none"
                        />
                        <div className="flex flex-col gap-2 p-2">
                            {/* HYPE Short */}
                            <ErrorBoundary fallback={<ErrorBoundaryTemplate error="Error loading HyperCore Short" />}>
                                {props.hyperCore.short}
                            </ErrorBoundary>

                            {/* Spot */}
                            <ErrorBoundary fallback={<ErrorBoundaryTemplate error="Error loading HyperCore Spot" />}>
                                {props.hyperCore.spot}
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* Activity */}
                    {'todolater'.length === 0 && IS_DEV && (
                        <div>
                            <p className="ml-4 rounded-none text-lg font-semibold">Activity</p>
                            <div className="flex h-min flex-col gap-2 p-2">
                                <ErrorBoundary fallback={<ErrorBoundaryTemplate error="Error loading Activity TXs" />}>
                                    {props.activity}
                                </ErrorBoundary>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}
