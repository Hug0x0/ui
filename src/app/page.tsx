'use client'

import { motion } from 'framer-motion'
import PageWrapper from '@/components/common/PageWrapper'
import dynamic from 'next/dynamic'

const HeatmapAprChart = dynamic(
    () =>
        import('@/components/charts/homepage/HeatmapAprChart').catch(() => {
            // Fallback if the module fails to load
            return { default: () => <div className="h-[460px] animate-pulse rounded-xl bg-default/5">Chart unavailable</div> }
        }),
    {
        ssr: false,
        loading: () => <div className="h-[460px] animate-pulse rounded-xl bg-default/5" />,
    },
)

export default function HomePage() {
    return (
        <PageWrapper>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.6,
                    delay: 0.2,
                    ease: [0.4, 0, 0.2, 1],
                }}
                className="flex flex-col items-center justify-center gap-2"
            >
                {/* Explanation of APR calculation */}
                <motion.div
                    className="flex flex-col items-center gap-1 text-center text-lg md:flex-row md:gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <p className="text-xl font-semibold">Realtime oracles/pools spread diff</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.8,
                        delay: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className="mx-auto w-full"
                >
                    <HeatmapAprChart />
                </motion.div>
            </motion.div>
        </PageWrapper>
    )
}
