'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import type { EChartsOption } from 'echarts'
import { ErrorBoundary } from 'react-error-boundary'
import { useTheme } from 'next-themes'
import EchartWrapper, { CustomFallback } from '../shared/EchartWrapperOptimized'
import { ErrorBoundaryFallback } from '../../common/ErrorBoundaryFallback'

// Heatmap data structures and helpers

import { AppThemes } from '@/enums'

interface HeatmapDataConfig {
    showNegativeFunding?: boolean
}

interface HeatmapDataResult {
    data: number[][]
    lpSteps: number
    fundingSteps: number
    xAxisLabels: string[]
    yAxisLabels: string[]
}

interface HeatmapJsonDataset {
    token: string
    sources: string[]
    pools: string[]
    valuesBps: number[][]
    updatedAt: string
}

// Generate default heatmap data (fallback if JSON not loaded)
export function generateHeatmapData(config: HeatmapDataConfig = {}): HeatmapDataResult {
    const { showNegativeFunding = false } = config

    // Default fallback data in bps (if remote JSON not yet loaded)
    const sources = ['HYPERCORE', 'PYTH', 'REDSTONE']
    const pools = ['POOL A HyperSwap 0.05', 'POOL B HyperSwap 0.3', 'POOL C Project X']
    const valuesBps = [
        [12, 25, -8],
        [5, 18, 3],
        [-4, 10, 37],
    ]

    const data: number[][] = []
    for (let i = 0; i < sources.length; i++) {
        for (let j = 0; j < pools.length; j++) {
            data.push([i, j, valuesBps[j][i]])
        }
    }

    return {
        data,
        lpSteps: sources.length,
        fundingSteps: pools.length,
        xAxisLabels: sources,
        yAxisLabels: pools,
    }
}

// APR calculation removed (we display spread in bps)

// Old tooltip helpers removed

import { getThemeColors } from '@/config'
import { cn } from '@/utils'
import { TEODOR_LIGHT_FONT } from '@/config'

interface HeatmapAprChartProps {
    className?: string
    highlightedCell?: {
        lpApr: number
        fundingApr: number
        label?: string
    }
    showNegativeFunding?: boolean
    lpStepSize?: number
    fundingStepSize?: number
    maxWidth?: string | number // Max width for the chart container (default: 1200px)
}

type TokenType = 'HYPE' | 'BTC' | 'ETH'

function HeatmapAprChart({ className, highlightedCell, showNegativeFunding = false, lpStepSize = 10, fundingStepSize = 5 }: HeatmapAprChartProps) {
    const [options, setOptions] = useState<EChartsOption | null>(null)
    const [selectedToken, setSelectedToken] = useState<TokenType>('HYPE')
    const [dataset, setDataset] = useState<HeatmapJsonDataset | null>(null)
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
    const { resolvedTheme } = useTheme()
    const colors = useMemo(() => getThemeColors(resolvedTheme), [resolvedTheme])
    const isDarkMode = resolvedTheme === AppThemes.DARK
    const stableHighlightedCell = useMemo(
        () => highlightedCell,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [highlightedCell?.lpApr, highlightedCell?.fundingApr, highlightedCell?.label],
    )

    const [isMobile, setIsMobile] = useState(false)

    // Fetch dataset JSON from public folder based on selected token (auto-refresh every 5s)
    useEffect(() => {
        let isCancelled = false
        let intervalId: number | undefined

        const fetchData = async () => {
            try {
                const tokenPath = selectedToken.toLowerCase()
                // Bust cache explicitly with timestamp param
                const res = await fetch(`/data/heatmap/${tokenPath}.json?t=${Date.now()}`, { cache: 'no-store' })
                if (!res.ok) throw new Error(`Failed to load ${tokenPath}.json`)
                const json: HeatmapJsonDataset = await res.json()
                if (!isCancelled) {
                    setDataset(json)
                    setLastUpdatedAt(Date.now())
                }
            } catch (e) {
                if (!isCancelled) setDataset(null)
            }
        }

        fetchData()
        intervalId = window.setInterval(fetchData, 5000)

        return () => {
            isCancelled = true
            if (intervalId) window.clearInterval(intervalId)
        }
    }, [selectedToken])

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const heatmapData = useMemo(() => {
        if (dataset && dataset.sources?.length && dataset.pools?.length && dataset.valuesBps?.length) {
            const data: number[][] = []
            for (let i = 0; i < dataset.sources.length; i++) {
                for (let j = 0; j < dataset.pools.length; j++) {
                    data.push([i, j, dataset.valuesBps[j][i]])
                }
            }
            return {
                data,
                lpSteps: dataset.sources.length,
                fundingSteps: dataset.pools.length,
                xAxisLabels: dataset.sources,
                yAxisLabels: dataset.pools,
            } as HeatmapDataResult
        }
        return generateHeatmapData({ showNegativeFunding })
    }, [dataset, showNegativeFunding])

    useEffect(() => {
        const { data, lpSteps, fundingSteps, xAxisLabels, yAxisLabels } = heatmapData

        if (!data || data.length === 0) {
            return
        }

        const minBps = Math.min(...data.map((d) => d[2]))
        const maxBps = Math.max(...data.map((d) => d[2]))

        const markData = []
        // Highlighting by numeric steps no longer applies (kept empty for future use)

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

                    const sourceIndex = params.value[0]
                    const poolIndex = params.value[1]
                    const sourceLabels = xAxisLabels
                    const poolLabels = yAxisLabels
                    const spreadBps = params.value[2]
                    const primaryColor = isDarkMode ? '#f3f4f6' : '#111827'
                    const secondaryColor = isDarkMode ? '#9ca3af' : '#4b5563'
                    const tertiaryColor = '#6b7280'

                    return `
                        <div style="font-family: ${TEODOR_LIGHT_FONT.style.fontFamily}; min-width: ${isMobile ? '180' : '220'}px; padding: 3px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 13px; color: ${tertiaryColor};">Sources: ${sourceLabels[sourceIndex]}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 13px; color: ${tertiaryColor};">Pool: ${poolLabels[poolIndex]}</span>
                            </div>
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: ${primaryColor};">
                                Spread: ${spreadBps > 0 ? '+' : ''}${spreadBps} bps
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
                name: 'Sources',
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
                    fontSize: isMobile ? 13 : 16,
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
                name: 'Pools',
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
                    fontSize: isMobile ? 11 : 14,
                    color: colors.charts.text,
                    interval: isMobile ? 1 : 0,
                    fontWeight: 'bold',
                },
                axisTick: {
                    show: false,
                },
            },
            visualMap: {
                show: false, // Hide the visual map
                min: minBps,
                max: maxBps,
                inRange: {
                    color: colors.charts.heatmapGradient,
                },
            },
            series: [
                {
                    name: 'Spread (bps)',
                    type: 'heatmap',
                    data: data.map((item) => {
                        return { value: item }
                    }),
                    label: {
                        show: true,
                        color: colors.charts.text,
                        backgroundColor: 'transparent',
                        fontSize: isMobile ? 10 : 12,
                        fontWeight: 600,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter: (params: any) => {
                            if (!params || !params.value || !Array.isArray(params.value) || params.value.length < 3) {
                                return ''
                            }
                            const v = params.value[2]
                            return `${v > 0 ? '+' : ''}${v} bps`
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
    }, [resolvedTheme, heatmapData, isMobile])

    if (!options) {
        return <CustomFallback />
    }

    return (
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
            <div className={cn('relative mx-auto w-full', className)}>
                {/* Token Selection Tabs */}
                <div className="mb-6 flex justify-center">
                    <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                        {(['HYPE', 'BTC', 'ETH'] as TokenType[]).map((token) => (
                            <button
                                key={token}
                                onClick={() => setSelectedToken(token)}
                                className={cn(
                                    'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                                    selectedToken === token
                                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                                )}
                            >
                                {token}
                            </button>
                        ))}
                    </div>
                </div>
                {lastUpdatedAt && (
                    <div className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
                        Updated at {new Date(lastUpdatedAt).toLocaleTimeString()}
                    </div>
                )}

                <EchartWrapper
                    options={options}
                    className="relative mx-auto h-full max-h-[300px] min-h-[450px] w-full min-w-[300px] max-w-[900px] md:max-h-[550px] md:min-h-[460px]"
                />
            </div>
        </ErrorBoundary>
    )
}

export default memo(HeatmapAprChart)
