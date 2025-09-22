'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IframeWrapper from '@/components/common/IframeWrapper'
import type { LPPosition } from '@/interfaces'
import type { HyperDrivePositionLeg } from '@/interfaces/position-leg.interface'

type Position = LPPosition | HyperDrivePositionLeg

interface PositionIframeModalProps {
    isOpen: boolean
    onClose: () => void
    position: Position | null
    url?: string
    title?: string
}

export default function PositionIframeModal({ isOpen, onClose, position, url }: PositionIframeModalProps) {
    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
        }

        return () => {
            document.removeEventListener('keydown', handleEsc)
        }
    }, [isOpen, onClose])

    if (!position) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 bg-default/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            className="relative flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-default/10 bg-background shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Optional Header - Uncomment if needed */}
                            {/* <div className="flex items-center justify-between border-b border-default/10 px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold">
                                        {getPositionTitle()}
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm text-default/60">
                                        <span>ID: {getPositionId()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-lg p-2 text-default/50 transition-colors hover:bg-default/10 hover:text-default"
                                    aria-label="Close modal"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div> */}

                            {/* Content */}
                            <div className="flex flex-1 items-center justify-center overflow-auto p-2">
                                {url ? (
                                    <IframeWrapper src={url} width="w-full" height="h-[70vh]" onClose={onClose} />
                                ) : (
                                    <p className="text-default/50">No URL available for this position</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
