'use client'

import { cn } from '@/utils'
import { motion } from 'framer-motion'
import ThemeSwitcher from '../common/ThemeSwitcher'
import HeaderLogo from './HeaderLogo'
import UseCasesDropdown from './UseCasesDropdown'

export default function HeaderDesktop(props: { className?: string }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('hidden w-full items-start justify-between px-6 pb-4 pt-6 md:flex', props.className)}
        >
            <HeaderLogo />

            {/* Right side items */}
            <motion.div
                className="flex items-start gap-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            >
                {/* Use Cases Dropdown */}
                <UseCasesDropdown />

                {/* Theme Switcher */}
                <ThemeSwitcher />
            </motion.div>
        </motion.header>
    )
}
