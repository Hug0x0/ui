'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import type { EChartsOption } from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { useTheme } from 'next-themes'
import EchartWrapper, { CustomFallback } from '../shared/EchartWrapperOptimized'
import { ErrorBoundaryFallback } from '../../common/ErrorBoundaryFallback'

/**
 * Utility functions for generating and formatting heatmap data
 * Separates business logic from UI components (SOC principle)
 */

import numeral from 'numeral'
import { AppThemes } from '@/enums'

interface HeatmapDataConfig {
    showNegativeFunding?: boolean
    lpStepSize?: number
    fundingStepSize?: number
}

interface HeatmapDataResult {
    data: number[][]
    lpSteps: number
    fundingSteps: number
    minFunding: number
    xAxisLabels: string[]
    yAxisLabels: string[]
}

/**
 * Generate heatmap data based on LP and funding APR parameters
 * @param config - Configuration for data generation
 * @returns Generated heatmap data and axis labels
 */
export function generateHeatmapData(config: HeatmapDataConfig = {}): HeatmapDataResult {
    const { showNegativeFunding = false, lpStepSize = 10, fundingStepSize = 5 } = config

    const data: number[][] = []
    const maxLpApr = 100
    const maxFundingApr = 50
    const minFunding = showNegativeFunding ? -20 : 0

    const lpSteps = Math.floor(maxLpApr / lpStepSize) + 1
    const fundingSteps = Math.floor((maxFundingApr - minFunding) / fundingStepSize) + 1

    // Generate data points
    for (let i = 0; i < lpSteps; i++) {
        for (let j = 0; j < fundingSteps; j++) {
            const lpApr = i * lpStepSize
            const fundingApr = minFunding + j * fundingStepSize
            const netApr = calculateNetApr(lpApr, fundingApr)
            data.push([i, j, Math.round(netApr)])
        }
    }

    // Generate axis labels
    const xAxisLabels = Array.from({ length: lpSteps }, (_, i) => `${i * lpStepSize}%`)
    const yAxisLabels = Array.from({ length: fundingSteps }, (_, i) => `${minFunding + i * fundingStepSize}%`)

    return {
        data,
        lpSteps,
        fundingSteps,
        minFunding,
        xAxisLabels,
        yAxisLabels,
    }
}

/**
 * Calculate net APR from LP and funding APR
 * Formula: (2/3) * LP APR + (1/3) * Funding APR
 */
export function calculateNetApr(lpApr: number, fundingApr: number): number {
    return (2 / 3) * lpApr + (1 / 3) * fundingApr
}

/**
 * Format tooltip data for display
 * @param lpApr - LP APR value
 * @param fundingApr - Funding APR value
 * @param netApr - Net APR value
 * @returns Formatted data for tooltip display
 *
 * Note: The "years to Nx" calculation assumes simple interest, not compounding.
 * For compounding, the formula should be: years = log(N) / log(1 + netApr/100)
 * The current code uses: years = (N - 1) * 100 / netApr
 * If you want compounding, use Math.log(N) / Math.log(1 + netApr/100)
 */
export function formatTooltipData(lpApr: number, fundingApr: number, netApr: number) {
    // Use compounding formula for years to Nx
    const aprDecimal = netApr / 100
    const yearsTo2x = aprDecimal > 0 ? numeral(Math.log(2) / Math.log(1 + aprDecimal)).format('0.0.[0]') : null
    const yearsTo5x = aprDecimal > 0 ? numeral(Math.log(5) / Math.log(1 + aprDecimal)).format('0.0.[0]') : null
    const yearsTo10x = aprDecimal > 0 ? numeral(Math.log(10) / Math.log(1 + aprDecimal)).format('0.0.[0]') : null

    return {
        lpApr: `${lpApr}%`,
        fundingApr: `${fundingApr}%`,
        netApr: `${netApr}%`,
        yearsTo2x: yearsTo2x ? `${yearsTo2x} years` : 'NGMI',
        yearsTo5x: yearsTo5x ? `${yearsTo5x} years` : 'NGMI',
        yearsTo10x: yearsTo10x ? `${yearsTo10x} years` : 'NGMI',
    }
}

// Use 'any' for ECharts callbacks to avoid complex type issues
// ECharts has very complex typing that doesn't match well with TypeScript
import { getThemeColors } from '@/config'
import { cn } from '@/utils'
import { TEODOR_LIGHT_FONT } from '@/config'
// import { generateHeatmapData, formatTooltipData } from '@/utils/heatmap-data.util'

interface HeatmapAprChartProps {
    className?: string
    highlightedCell?: {
        lpApr: number
        fundingApr: number
        label?: string
    }
    showNegativeFunding?: boolean
    lpStepSize?: number // Step size for LP APR axis (default: 10)
    fundingStepSize?: number // Step size for funding APR axis (default: 10)
    maxWidth?: string | number // Max width for the chart container (default: 1200px)
}

function HeatmapAprChart({ className, highlightedCell, showNegativeFunding = false, lpStepSize = 10, fundingStepSize = 5 }: HeatmapAprChartProps) {
    const [options, setOptions] = useState<EChartsOption | null>(null)
    const { resolvedTheme } = useTheme()
    const colors = useMemo(() => getThemeColors(resolvedTheme), [resolvedTheme])
    const isDarkMode = resolvedTheme === AppThemes.DARK
    const stableHighlightedCell = useMemo(
        () => highlightedCell,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [highlightedCell?.lpApr, highlightedCell?.fundingApr, highlightedCell?.label],
    )

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const heatmapData = useMemo(
        () => generateHeatmapData({ showNegativeFunding, lpStepSize, fundingStepSize }),
        [showNegativeFunding, lpStepSize, fundingStepSize],
    )

    useEffect(() => {
        const { data, lpSteps, fundingSteps, minFunding, xAxisLabels, yAxisLabels } = heatmapData

        if (!data || data.length === 0) {
            return
        }

        const minApr = Math.min(...data.map((d) => d[2]))
        const maxApr = Math.max(...data.map((d) => d[2]))

        const markData = []
        if (stableHighlightedCell) {
            const xIndex = Math.round(stableHighlightedCell.lpApr / lpStepSize)
            const yIndex = Math.round((stableHighlightedCell.fundingApr - minFunding) / fundingStepSize)
            if (xIndex >= 0 && xIndex < lpSteps && yIndex >= 0 && yIndex < fundingSteps) {
                markData.push({
                    coord: [xIndex, yIndex],
                    value: stableHighlightedCell.label || 'Current',
                })
            }
        }

        const chartOptions: EChartsOption = {
            animation: true,
            animationDuration: 500, // Smooth transition duration
            animationEasing: 'cubicInOut', // Smooth easing function
            tooltip: {
                trigger: 'item',
                position: 'top',
                borderColor: colors.primary,
                borderWidth: 1,
                triggerOn: 'mousemove|click',
                backgroundColor: colors.charts.tooltipBackground,
                borderRadius: 12,
                appendToBody: true,
                extraCssText: 'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); backdrop-filter: blur(8px); z-index: 9999 !important;',
                padding: [12, 16],
                transitionDuration: 1, // No fade animation
                textStyle: {
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    fontSize: 14,
                    fontFamily: TEODOR_LIGHT_FONT.style.fontFamily,
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter: function (params: any) {
                    if (!params?.value || !Array.isArray(params.value) || params.value.length < 3) {
                        return ''
                    }

                    const lpApr = params.value[0] * lpStepSize
                    const fundingApr = minFunding + params.value[1] * fundingStepSize
                    const netApr = params.value[2]

                    const tooltipData = formatTooltipData(lpApr, fundingApr, netApr)
                    const primaryColor = isDarkMode ? '#f3f4f6' : '#111827'
                    const secondaryColor = isDarkMode ? '#9ca3af' : '#4b5563'
                    const tertiaryColor = '#6b7280'

                    // <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
                    //             <span style="font-size: 13px; color: ${tertiaryColor};">Time to 5x</span>
                    //             <span style="font-size: 13px; color: ${secondaryColor};">${tooltipData.yearsTo5x}</span>
                    //         </div >

                    return `
                        <div style="font-family: ${TEODOR_LIGHT_FONT.style.fontFamily}; min-width: ${isMobile ? '180' : '220'}px; padding: 3px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 13px; color: ${tertiaryColor};">2/3 LP Fees</span>
                                <span style="font-size: 15px; color: ${secondaryColor}; font-weight: 600;">${tooltipData.lpApr}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 13px; color: ${tertiaryColor};">1/3 Short Perp Funding</span>
                                <span style="font-size: 15px; color: ${secondaryColor}; font-weight: 600;">${tooltipData.fundingApr}</span>
                            </div>
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: ${primaryColor};">
                                = ${tooltipData.netApr} Gross APR
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px;">
                                <span style="font-size: 13px; color: ${tertiaryColor};">Time to 2x</span>
                                <span style="font-size: 13px; color: ${secondaryColor};">${tooltipData.yearsTo2x}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; color: ${tertiaryColor};">Time to 10x</span>
                                <span style="font-size: 13px; color: ${secondaryColor};">${tooltipData.yearsTo10x}</span>
                            </div>
                        </div>
                    `
                },
            },
            grid: {
                top: 10,
                right: 20, // Reduced since no visual map
                bottom: 20,
                left: 60,
                containLabel: false, // Don't auto-adjust for labels, we'll control positioning
            },
            xAxis: {
                type: 'category',
                data: xAxisLabels,
                name: 'LP Fees APR',
                nameLocation: 'middle',
                nameGap: 40,
                axisLine: {
                    show: false,
                },
                nameTextStyle: {
                    fontSize: 18,
                    color: colors.charts.text,
                    fontFamily: TEODOR_LIGHT_FONT.style.fontFamily,
                    fontWeight: 800,
                },
                splitArea: {
                    show: false, // Remove grid background
                },
                axisLabel: {
                    fontSize: isMobile ? 9 : 11,
                    color: colors.charts.text,
                    interval: isMobile ? 1 : 0,
                    rotate: isMobile ? 45 : 0,
                },
                axisTick: {
                    show: false,
                },
            },
            yAxis: {
                type: 'category',
                data: yAxisLabels,
                name: 'Short Perp Funding APR',
                nameLocation: 'middle',
                nameGap: isMobile ? 40 : 55,
                nameRotate: 90, // Always vertical
                nameTextStyle: {
                    fontSize: 18,
                    color: colors.charts.text,
                    fontFamily: TEODOR_LIGHT_FONT.style.fontFamily,
                    fontWeight: 800,
                },
                splitArea: {
                    show: false, // Remove grid background
                },
                axisLine: {
                    show: false,
                },
                axisLabel: {
                    fontSize: isMobile ? 9 : 11,
                    color: colors.charts.text,
                    interval: isMobile ? 1 : 0,
                },
                axisTick: {
                    show: false,
                },
            },
            visualMap: {
                show: false, // Hide the visual map
                min: minApr,
                max: maxApr,
                inRange: {
                    color: colors.charts.heatmapGradient,
                },
            },
            series: [
                {
                    name: 'Net APR',
                    type: 'heatmap',
                    data: data.map((item) => {
                        return {
                            value: item,
                            label: {
                                show: true,
                                // Dynamic color based on background darkness and theme
                                color: isDarkMode
                                    ? item[2] > 40
                                        ? '#0f1a1f'
                                        : '#f6fefd' // In dark mode: dark text for bright bg, light text for dark bg
                                    : item[2] > 50
                                      ? '#f6fefd'
                                      : '#0f1a1f', // In light mode: white text for dark bg, dark text for light bg
                            },
                        }
                    }),
                    label: {
                        show: true,
                        fontSize: isMobile ? 8 : 10,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter: (params: any) => {
                            if (!params || !params.value || !Array.isArray(params.value) || params.value.length < 3) {
                                return ''
                            }
                            return `${params.value[2]}`
                        },
                    },
                    animation: true,
                    animationDuration: 300,
                    animationEasing: 'cubicOut',
                    emphasis: {
                        focus: 'self',
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: colors.primary,
                            borderColor: colors.primary,
                            borderWidth: 2,
                        },
                        label: {
                            fontSize: 12,
                            fontWeight: 'bold',
                        },
                    },
                    blur: {
                        itemStyle: {
                            opacity: isDarkMode ? 0.25 : 0.25,
                        },
                        label: {
                            opacity: 0.5,
                        },
                    },
                },
            ],
            textStyle: {
                color: colors.primary,
                fontFamily: TEODOR_LIGHT_FONT.style.fontFamily,
            },
        }

        setOptions(chartOptions)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedTheme])

    if (!options) {
        return <CustomFallback />
    }

    return (
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
            <div className={cn('relative mx-auto w-full', className)}>
                <EchartWrapper
                    options={options}
                    className="relative mx-auto h-full max-h-[300px] min-h-[450px] w-full min-w-[300px] max-w-[900px] md:max-h-[550px] md:min-h-[460px]"
                />
            </div>
        </ErrorBoundary>
    )
}

export default memo(HeatmapAprChart)
