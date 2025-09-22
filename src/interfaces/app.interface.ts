import { AppUrls, FileIds } from '../enums'

export interface InterfaceAppLink {
    name: string
    path: AppUrls | string
}

export interface ThemeColors {
    // Core colors (matching globals.css)
    background: string
    backgroundOpposite: string
    primary: string
    default: string

    // Platform-specific colors for charts
    hyperEvmLp: string
    hyperEvmBalances: string
    hyperCorePerp: string
    hyperCoreSpot: string

    // Optional chart-specific
    charts: {
        text: string
        axis: string
        line: string
        tooltipBackground?: string
        heatmapGradient?: readonly string[]
    }
}

export interface ThemeConfig {
    light: ThemeColors
    dark: ThemeColors
}

export interface UseCase {
    title: string
    description: string
    banner: FileIds
    url: string
}
