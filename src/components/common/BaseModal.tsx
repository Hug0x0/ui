'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useModalKeyHandler } from '@/hooks/useModalKeyHandler'
import {
    MODAL_ANIMATION_CONFIG,
    MODAL_BACKDROP_CLASSES,
    MODAL_CONTAINER_CLASSES,
    MODAL_CONTENT_CLASSES,
    MODAL_HEADER_CLASSES,
    MODAL_CLOSE_BUTTON_CLASSES,
} from '@/config/constants.config'
import { cn } from '@/utils'

interface BaseModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle?: React.ReactNode
    children: React.ReactNode
    maxWidth?: string
    className?: string
}

/**
 * Base modal component following DRY and Single Responsibility principles
 * Handles common modal functionality: backdrop, animations, close button, ESC key
 */
export default function BaseModal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-6xl', className }: BaseModalProps) {
    // Handle ESC key using extracted hook
    useModalKeyHandler(isOpen, onClose)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div {...MODAL_ANIMATION_CONFIG.backdrop} className={MODAL_BACKDROP_CLASSES} onClick={onClose} />

                    {/* Modal */}
                    <motion.div {...MODAL_ANIMATION_CONFIG.content} className={MODAL_CONTAINER_CLASSES} onClick={onClose}>
                        <div className={cn(MODAL_CONTENT_CLASSES, maxWidth, className)} onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className={MODAL_HEADER_CLASSES}>
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold">{title}</h2>
                                    {subtitle && <div className="flex items-center gap-1 text-sm text-default/60">{subtitle}</div>}
                                </div>
                                <button onClick={onClose} className={MODAL_CLOSE_BUTTON_CLASSES} aria-label="Close modal">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
