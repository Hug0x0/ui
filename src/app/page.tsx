'use client'

import { motion } from 'framer-motion'
import PageWrapper from '@/components/common/PageWrapper'
import dynamic from 'next/dynamic'
import FileMapper from '@/components/common/FileMapper'
import LinkWrapper from '@/components/common/LinkWrapper'
import IconWrapper from '@/components/icons/IconWrapper'
import { USE_CASES } from '@/config'
import { FileIds, IconIds } from '@/enums'
import { cn } from '@/utils'

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
                    className="flex flex-col items-center gap-1 text-center text-sm md:flex-row md:gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <p>Gross Delta-neutral APR</p>
                    <p>= ⅔ × LP Fees + ⅓ × Short Perp Funding</p>
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

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.8,
                        delay: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                    className="my-[50px] flex w-full flex-col gap-3 md:hidden"
                >
                    <p className="text-center text-xl text-primary">Our strategies</p>
                    <div className="grid w-full grid-cols-1 flex-col gap-3 md:grid-cols-3">
                        {USE_CASES.map((useCase) => (
                            <LinkWrapper key={useCase.title} href={useCase.url} target="_blank">
                                <div
                                    className="group relative col-span-1 h-40 w-full overflow-hidden rounded-xl py-1 transition-all hover:shadow-md"
                                    style={{
                                        backgroundImage: `url(${useCase.banner})`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    {/* Overlay with forced GPU acceleration */}
                                    <div
                                        className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-b from-background/50 to-background/40 dark:from-background/20 dark:to-background/30"
                                        style={{
                                            backdropFilter: 'blur(1px) saturate(200%)',
                                            WebkitBackdropFilter: 'blur(1px) saturate(200%)',
                                            transform: 'translateZ(0)',
                                            willChange: 'transform',
                                        }}
                                    />
                                    <div className="relative z-10 flex h-full w-full flex-col items-start gap-1 p-3">
                                        <div className="flex items-center gap-2 rounded bg-background/90 pl-1.5 pr-1 backdrop-blur-sm">
                                            <h3 className="text-xl font-medium text-primary drop-shadow-sm transition-colors">{useCase.title}</h3>
                                            <FileMapper
                                                id={
                                                    useCase.banner === FileIds.BANNER_HYPERSWAP
                                                        ? FileIds.DEX_HYPERSWAP
                                                        : useCase.banner === FileIds.BANNER_PROJETX
                                                          ? FileIds.DEX_PROJETX
                                                          : FileIds.LENDING_HYPERDRIVE
                                                }
                                                className="size-4 rounded"
                                            />
                                        </div>
                                        <p className={cn('mt-0.5 rounded bg-background/90 px-1.5 text-base drop-shadow-sm backdrop-blur-sm')}>
                                            {useCase.description}
                                        </p>
                                    </div>
                                    <div className="absolute bottom-3 right-3 rounded-lg bg-background p-1.5 transition-transform duration-200 group-hover:scale-110">
                                        <IconWrapper id={IconIds.ARROW_UP_RIGHT} className="size-5 rounded-lg text-primary" />
                                    </div>
                                </div>
                            </LinkWrapper>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </PageWrapper>
    )
}
