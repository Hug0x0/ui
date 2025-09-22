import { AppThemes } from '@/enums/app.enum'
import { IconIds } from '@/enums/icons.enum'
import type { ThemeConfig } from '@/interfaces/app.interface'
import { AppFontFamilies } from '@/enums/app.enum'
import localFont from 'next/font/local'
import { Lato } from 'next/font/google'

export const APP_THEMES = {
    [AppThemes.LIGHT]: { index: 0, iconId: IconIds.THEME_LIGHT },
    [AppThemes.DARK]: { index: 1, iconId: IconIds.THEME_DARK },
} as const

/**
 * Unified color configuration for the entire application
 * This consolidates colors from multiple config files to follow DRY principle
 */

/**
 * Color constants and utilities
 * CSS variables are defined in globals.css - this file provides JS/TS access to those colors
 */

// Status colors (not theme-dependent)
export const STATUS_COLORS = {
    success: '#10B981', // Green
    warning: '#F59E0B', // Orange
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
} as const

// Chart colors that need hex values
export const CHART_COLORS = {
    light: {
        text: '#434651',
        axis: 'rgba(46, 49, 60, 0.1)',
        line: 'rgba(46, 49, 60, 0.2)',
        tooltipBackground: 'rgba(255, 255, 255, 0.98)',

        // Platform colors for charts
        hyperEvmLp: '#3333ff', // HSL(255 90% 60%) - Vivid Blue for LP positions
        hyperEvmBalances: '#47b8b8', // HSL(180 60% 55%) - Light Blue for wallet balances
        hyperCorePerp: '#ff3366', // HSL(345 100% 60%) - Bright Red for perp positions
        hyperCoreSpot: '#ff9933', // HSL(30 100% 60%) - Orange for spot balances

        // Heatmap colors
        heatmapGradient: [
            '#f6fefd', // Off-White (lowest)
            '#d1d4dc', // Light Gray
            '#949e9c', // Pale Gray
            '#868993', // Warm Gray
            '#50d2c1', // Teal
            '#22ab94', // Primary teal
            '#089891', // Sea Green
            '#142e61', // Deep Blue
            '#0f1a1f', // Oil Black (highest)
        ],
    },
    dark: {
        text: '#e6e8ef',
        axis: 'rgba(209, 212, 220, 0.4)',
        line: 'rgba(209, 212, 220, 0.2)',
        tooltipBackground: 'rgba(20, 30, 45, 0.99)',

        // Platform colors for charts
        hyperEvmLp: '#6666ff', // HSL(255 90% 70%) - Lighter Blue for LP positions in dark mode
        hyperEvmBalances: '#47d4e6', // HSL(185 70% 65%) - Brighter Blue for wallet balances
        hyperCorePerp: '#ff6680', // HSL(350 100% 70%) - Lighter Red for perp positions
        hyperCoreSpot: '#ffaa4d', // HSL(35 100% 65%) - Lighter Orange for spot balances

        // Heatmap colors
        heatmapGradient: [
            '#0f1a1f', // Oil Black (lowest)
            '#142e61', // Deep Blue
            '#2e313c', // Charcoal Blue
            '#434651', // Dark Gray
            '#089891', // Sea Green
            '#22ab94', // Primary teal
            '#50d2c1', // Teal
            '#26a69a', // Muted Turquoise
            '#bbd9fb', // Soft Blue (highest)
        ],
    },
} as const

// Type for theme colors
export type ThemeColors = {
    background: string
    backgroundOpposite: string
    primary: string
    default: string
    hyperEvmLp: string
    hyperEvmBalances: string
    hyperCorePerp: string
    hyperCoreSpot: string
    charts: {
        text: string
        axis: string
        line: string
        tooltipBackground: string
        heatmapGradient: readonly string[]
    }
}

/**
 * Get theme colors for a specific mode
 */
export function getColorsByTheme(isDark: boolean): ThemeColors {
    const mode = isDark ? 'dark' : 'light'
    const chartColors = CHART_COLORS[mode]

    return {
        // Core colors (these would be read from CSS variables in a real app, but hardcoded for simplicity)
        background: mode === 'dark' ? '#0f1a1f' : '#f6fefd',
        backgroundOpposite: mode === 'dark' ? '#f6fefd' : '#0f1a1f',
        primary: '#22ab94',
        default: mode === 'dark' ? '#d1d4dc' : '#2e313c',
        // Platform colors
        hyperEvmLp: chartColors.hyperEvmLp,
        hyperEvmBalances: chartColors.hyperEvmBalances,
        hyperCorePerp: chartColors.hyperCorePerp,
        hyperCoreSpot: chartColors.hyperCoreSpot,
        charts: chartColors,
    }
}

// Use the centralized color constants
const lightColors = getColorsByTheme(false)
const darkColors = getColorsByTheme(true)

export const COLORS: ThemeConfig = {
    light: lightColors,
    dark: darkColors,
} as const

/**
 * Get colors based on current theme
 * @param isDarkMode - Whether dark mode is active
 * @returns Color configuration for the theme
 */
export function getThemeColors(mode?: string) {
    return mode === AppThemes.DARK ? COLORS.dark : COLORS.light
}

/**
 * fonts
 */

// export const INTER_FONT = Inter({
//     weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
//     subsets: ['latin'],
//     variable: '--font-inter',
//     display: 'swap',
//     preload: true,
// })

// export const INTER_TIGHT_FONT = Inter_Tight({
//     weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
//     subsets: ['latin'],
//     variable: '--font-inter-tight',
// })

export const LATO_FONT = Lato({ weight: ['100', '300', '400', '700', '900'], subsets: ['latin'] })
export const TEODOR_LIGHT_FONT = localFont({
    src: [
        {
            path: '../../public/fonts/Teodor-Light.woff2',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../../public/fonts/Teodor-Light.woff',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../../public/fonts/Teodor-Light.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../../public/fonts/Teodor-LightItalic.woff2',
            weight: '300',
            style: 'italic',
        },
        {
            path: '../../public/fonts/Teodor-LightItalic.woff',
            weight: '300',
            style: 'italic',
        },
        {
            path: '../../public/fonts/Teodor-LightItalic.ttf',
            weight: '300',
            style: 'italic',
        },
    ],
    variable: '--font-teodor-light',
    display: 'swap',
    preload: true,
})
export const PVP_TRADE_FONT = localFont({
    src: [
        {
            path: '../../public/fonts/Pvp-Trade.ttf',
            weight: '400',
            style: 'normal',
        },
    ],
    variable: '--font-pvp-trade',
    display: 'swap',
    preload: true,
})

export const APP_FONT_FAMILIES: Record<AppFontFamilies, string> = {
    [AppFontFamilies.TEODOR_LIGHT]: TEODOR_LIGHT_FONT.variable,
    [AppFontFamilies.LATO]: LATO_FONT.className,
    [AppFontFamilies.PVP_TRADE]: PVP_TRADE_FONT.className,
}
