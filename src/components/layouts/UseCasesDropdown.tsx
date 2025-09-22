'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileIds, IconIds } from '@/enums'
import IconWrapper from '../icons/IconWrapper'
import { cn } from '@/utils'
import LinkWrapper from '../common/LinkWrapper'
import { USE_CASES } from '@/config'
import FileMapper from '../common/FileMapper'

export default function UseCasesDropdown() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        // Clear any existing timeout when entering
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
        setIsDropdownOpen(true)
    }

    const handleMouseLeave = () => {
        // Add a 300ms delay before closing
        closeTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false) // Keep commented for debug
        }, 200)
    }

    return (
        <div className="relative z-50" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="relative overflow-hidden rounded-xl p-px">
                <div className="absolute inset-0 animate-[gradient-shift_3s_ease-in-out_infinite] bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-primary/50 bg-[length:200%_200%] dark:from-primary/60 dark:via-purple-500/30 dark:to-blue-500/40" />
                <button
                    className={cn(
                        'group relative z-10 flex items-center gap-2 rounded-xl bg-background/90 px-3 py-1.5 text-sm font-medium text-primary transition-all duration-300 hover:text-white',
                        isDropdownOpen && 'bg-default/5 text-white',
                    )}
                >
                    <IconWrapper id={IconIds.ARROW_RIGHT} className="size-4" />
                    <p className="cursor-help text-base font-semibold">Explore our strategies</p>
                    <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.15, ease: 'easeInOut' }}>
                        <IconWrapper id={IconIds.CHEVRON_DOWN} className="size-4" />
                    </motion.div>
                </button>
            </div>

            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full z-[100] mt-2 w-[400px] overflow-hidden rounded-2xl border border-default/10 bg-background/95 shadow-xl"
                        style={{
                            zIndex: 100,
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="flex flex-col gap-2 overflow-hidden rounded-xl p-2">
                            {USE_CASES.map((useCase) => (
                                <LinkWrapper key={useCase.title} href={useCase.url} target="_blank">
                                    <div
                                        className="group relative h-40 w-full overflow-hidden rounded-xl py-1 transition-all hover:shadow-md"
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
                )}
            </AnimatePresence>
        </div>
    )
}
