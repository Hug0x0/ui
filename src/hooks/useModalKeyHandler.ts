import { useEffect } from 'react'

/**
 * Custom hook for handling modal keyboard interactions
 * Following DRY principle - extracted from duplicate code in modals
 */
export function useModalKeyHandler(isOpen: boolean, onClose: () => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])
}
