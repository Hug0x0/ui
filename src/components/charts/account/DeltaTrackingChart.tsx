'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { EChartsOption } from 'echarts'
import { useTheme } from 'next-themes'
import EchartWrapper from '../shared/EchartWrapperOptimized'
import { getThemeColors } from '@/config'
import { STATUS_COLORS } from '@/config'
import { DAYJS_FORMATS, formatUSD } from '@/utils'
import { useAppStore } from '@/stores/app.store'
import numeral from 'numeral'
import { CHART_SERIES_NAMES, SECTION_CONFIG, SectionType } from '@/config/sections.config'
import IconWrapper from '@/components/icons/IconWrapper'
import { IconIds } from '@/enums'
import RebalanceModal from '@/components/modals/RebalanceModal'

const Legends = ({ isLpAccount, onShowRebalances }: { isLpAccount?: boolean; onShowRebalances?: () => void }) => {
    return (
        <div className="flex flex-col gap-1 px-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1 text-hyper-evm-lps">
                {isLpAccount && (
                    <>
                        <div className="h-4 w-2 border-l-2 border-dashed border-hyper-evm-lps" />
                        <p className="truncate text-sm">Rebalances done by our ALM</p>
                    </>
                )}
            </div>
            <button onClick={onShowRebalances} className="flex items-center gap-1 text-default/50 transition-colors hover:text-primary">
                <IconWrapper id={IconIds.ARROW_RIGHT} className="size-4" />
                <p className="truncate text-sm">Click to see full history</p>
                <IconWrapper id={IconIds.LIST} className="size-4" />
            </button>
        </div>
    )
}
const DEFAULT_VISIBLE_POINTS = 30 // Number of points to show by default in dataZoom

const grid = {
    top: 70,
    right: 140,
    bottom: 50,
    left: 50,
    containLabel: true,
}

// Helper function to create skeleton loading data
const createSkeletonData = (phaseOffset: number, amplitude: number, baseValue: number = 0): Array<[number, number]> => {
    const now = Date.now()
    const points = 20
    const data: Array<[number, number]> = []

    for (let i = 0; i < points; i++) {
        const timestamp = now - (points - i - 1) * 60000 // 1 minute intervals
        const value = baseValue + amplitude * Math.sin((i / points) * Math.PI * 2 + phaseOffset)
        data.push([timestamp, value])
    }

    return data
}

export const ChartSeries = {
    hyperLpBalance: CHART_SERIES_NAMES.hyperLpBalance,
    DeployedAUM: CHART_SERIES_NAMES.deployedAUM,
    LongEVM: SECTION_CONFIG[SectionType.LONG_EVM].chartSeriesName, // Combined LP + HyperDrive
    HyperEvmBalances: CHART_SERIES_NAMES.wallet,
    HyperCorePerps: CHART_SERIES_NAMES.perps,
    HyperCoreSpots: CHART_SERIES_NAMES.spots,
    StrategyDelta: CHART_SERIES_NAMES.strategyDelta,
    NetDelta: CHART_SERIES_NAMES.netDelta,
} as const

export default function DeltaTrackingChart() {
    const [options, setOptions] = useState<EChartsOption | null>(null)
    const [showRebalanceModal, setShowRebalanceModal] = useState(false)
    const { resolvedTheme } = useTheme()
    const colors = getThemeColors(resolvedTheme)

    // Store legend selection state to persist between refreshes - initialize with defaults
    const [legendSelection, setLegendSelection] = useState<Record<string, boolean>>({
        [ChartSeries.hyperLpBalance]: false,
        [ChartSeries.DeployedAUM]: false,
        [ChartSeries.LongEVM]: true,
        [ChartSeries.HyperEvmBalances]: true,
        [ChartSeries.HyperCorePerps]: true,
        [ChartSeries.HyperCoreSpots]: false,
        [ChartSeries.StrategyDelta]: true,
    })

    // Store valid snapshots to prevent stale closure issues in tooltip formatter
    const validSnapshotsRef = useRef<ReturnType<typeof getSnapshots>>([])

    // Create loading skeleton options dynamically based on theme
    const createLoadingOptions = useCallback((): EChartsOption => {
        const netDeltaColor = colors.charts.text || '#ffffff'
        const textOpacity = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'

        return {
            backgroundColor: 'transparent',
            animation: true,
            animationDuration: 3000,
            animationEasing: 'sinusoidalInOut',
            animationLoop: true,
            grid,
            tooltip: { show: false },
            graphic: [
                {
                    type: 'text',
                    left: 'center',
                    top: 'center',
                    z: 0,
                    style: {
                        text: 'Loading Harb history...',
                        fontSize: 14,
                        fontWeight: 'normal',
                        fill: textOpacity,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    },
                },
            ],
            xAxis: {
                type: 'time',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: textOpacity,
                    fontSize: 10,
                    formatter: () => '••:••',
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: colors.charts.line,
                        opacity: 0.2,
                        type: 'dashed',
                    },
                },
            },
            yAxis: {
                type: 'value',
                position: 'left',
                min: -1000,
                max: 2000,
                axisLine: { show: false },
                axisLabel: {
                    show: true,
                    color: textOpacity,
                    fontSize: 10,
                    formatter: () => '$•,•••',
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: colors.charts.line,
                        opacity: 0.2,
                        type: 'dashed',
                    },
                },
            },
            legend: {
                data: [
                    { name: 'Yield Δ', itemStyle: { color: colors.hyperEvmLp }, textStyle: { color: textOpacity } },
                    { name: 'Short Δ', itemStyle: { color: colors.hyperCorePerp }, textStyle: { color: textOpacity } },
                    { name: 'Strategy Δ', itemStyle: { color: netDeltaColor }, textStyle: { color: textOpacity } },
                ],
                top: 10,
                left: 'center',
                icon: 'roundRect',
                itemWidth: 14,
                itemHeight: 8,
                itemGap: 20,
                selected: {
                    'Yield Δ': true,
                    'Short Δ': true,
                    'Strategy Δ': true,
                },
                inactiveColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            series: [
                // Yield leg skeleton
                {
                    name: 'Yield Δ',
                    type: 'line',
                    data: createSkeletonData(0, 60, 300),
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        color: colors.hyperEvmLp,
                        width: 2,
                        opacity: 0.2,
                    },
                    itemStyle: {
                        color: colors.hyperEvmLp,
                        opacity: 0.2,
                    },
                    animation: true,
                    animationDuration: 3000,
                    animationDelay: 0,
                },
                // Short skeleton
                {
                    name: 'Short Δ',
                    type: 'line',
                    data: createSkeletonData(1, 60, -300),
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        color: colors.hyperCorePerp,
                        width: 2,
                        opacity: 0.2,
                    },
                    itemStyle: {
                        color: colors.hyperCorePerp,
                        opacity: 0.2,
                    },
                    animation: true,
                    animationDuration: 3000,
                    animationDelay: 200,
                },
                // Strategy Delta skeleton
                {
                    name: 'Strategy Δ',
                    type: 'line',
                    data: createSkeletonData(2, 30, 0),
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        color: netDeltaColor,
                        width: 2.5,
                        type: 'dashed',
                        opacity: 0.2,
                    },
                    itemStyle: {
                        color: netDeltaColor,
                        opacity: 0.2,
                    },
                    areaStyle: {
                        opacity: 0.03,
                        color: netDeltaColor,
                    },
                    animation: true,
                    animationDuration: 3000,
                    animationDelay: 400,
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        data: [
                            {
                                yAxis: 0,
                                label: {
                                    show: false,
                                },
                                lineStyle: {
                                    color: colors.charts.axis,
                                    type: 'solid',
                                    width: 1,
                                    opacity: 0.15,
                                },
                            },
                        ],
                    },
                },
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                },
            ],
        }
    }, [colors, resolvedTheme])

    // Get historical snapshots and rebalance events from the app store
    const getSnapshots = useAppStore((state) => state.getSnapshots)
    const rebalanceEvents = useAppStore((state) => state.rebalanceEvents)
    const lastSnapshotAddedAt = useAppStore((state) => state.lastSnapshotAddedAt)

    // Handle legend selection changes
    const handleLegendSelectChanged = useCallback((selected: Record<string, boolean>) => {
        setLegendSelection(selected)
    }, [])

    // Handle reset/restore from toolbox - let the chart handle this internally

    // Handle showing rebalance modal
    const handleShowRebalances = useCallback(() => {
        setShowRebalanceModal(true)
    }, [])

    // Handle closing rebalance modal
    const handleCloseRebalanceModal = useCallback(() => {
        setShowRebalanceModal(false)
    }, [])

    // Debounce chart updates to prevent excessive re-renders
    const [debouncedUpdate, setDebouncedUpdate] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUpdate((prev) => prev + 1)
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [lastSnapshotAddedAt, rebalanceEvents.length])

    useEffect(() => {
        try {
            // 1. get stored snapshots
            let storedSnapshots = getSnapshots()

            // Show loading skeleton if no data
            if (storedSnapshots.length === 0) {
                setOptions(createLoadingOptions())
                return
            }

            // If only 1 data point, duplicate it with a 1 second offset to show lines
            if (storedSnapshots.length === 1) {
                const singleSnapshot = storedSnapshots[0]
                if (singleSnapshot && singleSnapshot.timestamp) {
                    const duplicateSnapshot = {
                        ...singleSnapshot,
                        timestamp: singleSnapshot.timestamp - 1000, // Subtract 1 second
                    }
                    storedSnapshots = [duplicateSnapshot, singleSnapshot]
                }
            }

            // 2. extract deltas from AccountSnapshot array
            const lpDeltasUSD: Array<[number, number]> = []
            const perpDeltasUSD: Array<[number, number]> = []
            const netDeltasUSD: Array<[number, number]> = []
            const strategyDeltasUSD: Array<[number, number]> = []
            const spotDeltasUSD: Array<[number, number]> = []
            const balancesDeltasUSD: Array<[number, number]> = []
            const totalCapitalUSD: Array<[number, number]> = []
            const deployedAUM: Array<[number, number]> = []

            // Filter out snapshots that don't comply with current schema
            const validSnapshots = storedSnapshots.filter((snapshot) => {
                // Check for required structure
                if (!snapshot || !snapshot.metrics) {
                    console.warn('[DeltaTrackingChart] Skipping snapshot without metrics:', snapshot)
                    return false
                }

                // Validate current schema structure
                if (!snapshot.metrics.longLegs || !Array.isArray(snapshot.metrics.longLegs)) {
                    console.warn('[DeltaTrackingChart] Skipping legacy snapshot (missing longLegs array):', snapshot.timestamp)
                    return false
                }

                if (!snapshot.metrics.shortLegs || !snapshot.metrics.shortLegs.values) {
                    console.warn('[DeltaTrackingChart] Skipping snapshot without shortLegs.values:', snapshot.timestamp)
                    return false
                }

                if (!snapshot.metrics.idle || !snapshot.metrics.idle.deltas) {
                    console.warn('[DeltaTrackingChart] Skipping snapshot without idle.deltas:', snapshot.timestamp)
                    return false
                }

                if (!snapshot.metrics.portfolio) {
                    console.warn('[DeltaTrackingChart] Skipping snapshot without portfolio metrics:', snapshot.timestamp)
                    return false
                }

                return true
            })

            if (validSnapshots.length === 0) {
                console.warn('[DeltaTrackingChart] No valid snapshots after filtering')
                setOptions(createLoadingOptions())
                return
            }

            if (validSnapshots.length !== storedSnapshots.length) {
                console.log(
                    `[DeltaTrackingChart] Filtered ${storedSnapshots.length - validSnapshots.length} invalid snapshots, ${validSnapshots.length} remain`,
                )
            }

            // Update the ref with valid snapshots for tooltip formatter
            validSnapshotsRef.current = validSnapshots

            validSnapshots.forEach((snapshot) => {
                const timestamp = snapshot.timestamp

                // Use the price from the snapshot if available, otherwise use fallback
                const hypePrice = snapshot.prices?.HYPE || 0

                // Extract deltas - aggregate all long legs (LP + HyperDrive)
                const lpMetrics = snapshot.metrics.longLegs?.find((l) => l.type === 'lp')
                const hyperdriveMetrics = snapshot.metrics.longLegs?.find((l) => l.type === 'hyperdrive')
                const lpDeltaHYPE = lpMetrics?.metrics?.totalDeltaHYPE || 0
                const hyperdriveDeltaHYPE = hyperdriveMetrics?.metrics?.totalDeltaHYPE || 0
                const totalLongDeltaHYPE = lpDeltaHYPE + hyperdriveDeltaHYPE
                const lpUSD = totalLongDeltaHYPE * hypePrice

                const perpUSD = -(snapshot.metrics.shortLegs?.values?.perpsNotionalUSD || 0) - (snapshot.metrics.shortLegs?.values?.perpsPnlUSD || 0)
                const spotUSD = (snapshot.metrics.idle?.deltas?.spotDeltaHYPE || 0) * hypePrice
                const balancesUSD = (snapshot.metrics.idle?.deltas?.balancesDeltaHYPE || 0) * hypePrice

                const netUSD = (snapshot.metrics.portfolio?.netDeltaHYPE || 0) * hypePrice
                // const strategyUSD = ((snapshot.metrics.portfolio?.strategyDelta || 0) * hypePrice)
                const totalUSD = snapshot.metrics.portfolio?.totalValueUSD || 0
                const deployedUSD = snapshot.metrics.portfolio?.deployedValueUSD || 0

                // For time axis, data must be [timestamp, value] pairs
                lpDeltasUSD.push([timestamp, lpUSD])
                perpDeltasUSD.push([timestamp, perpUSD])
                spotDeltasUSD.push([timestamp, spotUSD])
                balancesDeltasUSD.push([timestamp, balancesUSD])
                netDeltasUSD.push([timestamp, netUSD])
                // strategyDeltasUSD.push([timestamp, strategyUSD])
                strategyDeltasUSD.push([timestamp, lpUSD + perpUSD])
                // strategyDeltasUSD.push([timestamp, lpUSD + perpUSD + balancesUSD])
                totalCapitalUSD.push([timestamp, totalUSD])
                deployedAUM.push([timestamp, deployedUSD])
            })

            // Use theme-aware colors
            const netDeltaColor = colors.charts.text || '#ffffff'
            const aumColor = resolvedTheme === 'dark' ? '#ffffff' : '#000000'

            // 4. prepare series data
            const echartsOptions: EChartsOption = {
                animation: true,
                animationDuration: 300,
                animationEasing: 'cubicInOut',
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: 'center',
                        z: 0,
                        style: {
                            text: 'hyperlp.xyz',
                            fontSize: 48,
                            fontWeight: 'bold',
                            fill: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        },
                    },
                ],
                tooltip: {
                    trigger: 'axis',
                    triggerOn: 'mousemove',
                    backgroundColor: resolvedTheme === 'dark' ? 'rgba(17, 17, 17, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: [8, 12],
                    extraCssText: `z-index: 99999; backdrop-filter: blur(12px) saturate(120%); -webkit-backdrop-filter: blur(12px) saturate(120%); box-shadow: 0 8px 32px rgba(0, 0, 0, ${resolvedTheme === 'dark' ? '0.2' : '0.1'});`,
                    appendToBody: true,
                    hideDelay: 0,
                    transitionDuration: 0,
                    enterable: false,
                    confine: false,
                    alwaysShowContent: false,
                    show: true,
                    textStyle: {
                        color: resolvedTheme === 'dark' ? '#ffffff' : '#000000',
                        fontSize: 11,
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter: function (params: any) {
                        if (!Array.isArray(params) || params.length === 0) return ''

                        // Remove duplicates by series name
                        const uniqueParams = params.filter(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (param: any, index: number, self: any[]) => index === self.findIndex((p: any) => p.seriesName === param.seriesName),
                        )

                        const firstParam = uniqueParams[0]
                        const timestamp = DAYJS_FORMATS.custom(firstParam.value[0], 'ddd. MMM. D ∙ hh:mm:ss A')

                        // Get snapshot for total capital context - use ref to avoid stale closure
                        const snapshot = validSnapshotsRef.current.find((s) => s.timestamp === firstParam.value[0])
                        const deployedAUM = snapshot?.metrics.portfolio.deployedValueUSD || 0
                        const hypePrice = snapshot?.prices.HYPE || 0

                        const isDark = resolvedTheme === 'dark'
                        const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)'
                        const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

                        // <div style="display: flex; align-items: center; gap: 6px;">
                        //     <span style="color: ${textColor}; font-size: 11px;">AUM:</span>
                        //     <span style="font-size: 12px; font-weight: 500;">${formatUSD(totalCapital)}</span>
                        // </div >

                        let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2px;">
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${timestamp}</div>
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                                
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <img src="/tokens/HYPE.jpg" style="width: 12px; height: 12px; border-radius: 50%;" />
                                    <span style="font-size: 12px; font-weight: 500;">$${numeral(hypePrice).format('0,0.[0000]')}</span>
                                </div>
                            </div>
                        </div>
                        <div style="height: 1px; background: ${dividerColor}; margin: 8px -6px;"></div>`

                        // Define custom sort order for tooltip items
                        const seriesOrder = [
                            ChartSeries.hyperLpBalance,
                            ChartSeries.DeployedAUM,
                            ChartSeries.LongEVM,
                            ChartSeries.HyperEvmBalances,
                            ChartSeries.HyperCorePerps,
                            ChartSeries.HyperCoreSpots,
                            ChartSeries.StrategyDelta,
                            ChartSeries.NetDelta,
                        ]

                        // Sort params based on defined order
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const sortedParams = uniqueParams.sort((a: any, b: any) => {
                            const aIndex = seriesOrder.indexOf(a.seriesName)
                            const bIndex = seriesOrder.indexOf(b.seriesName)
                            return aIndex - bIndex
                        })

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        sortedParams.forEach((param: any) => {
                            // Skip formatting for AUM and Deployed AUM series
                            if (param.seriesName === ChartSeries.hyperLpBalance || param.seriesName === ChartSeries.DeployedAUM) {
                                const value = Array.isArray(param.value) ? param.value[1] : 0
                                html += `
                                <div style="margin: 8px 0;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="display: inline-block; width: 8px; height: 8px; background: ${param.color || '#666'}; border-radius: 50%;"></span>
                                        <span style="font-size: 12px; font-weight: 500;">${param.seriesName}</span>
                                        <span style="font-size: 11px; font-weight: 500; margin-left: auto;">${formatUSD(value)}</span>
                                    </div>
                                </div>
                            `
                                return
                            }

                            // With time axis, value is [timestamp, value]
                            const value = Array.isArray(param.value) ? param.value[1] : 0
                            const hypeAmount = hypePrice > 0 ? value / hypePrice : 0
                            const deltaPercent = deployedAUM > 0 ? Math.abs(value / deployedAUM) * 100 : 0

                            // Determine status and color for all series based on risk
                            const color = param.color || '#666'
                            let riskLabel = ''
                            let riskBadgeColor = ''

                            if (param.seriesName === ChartSeries.NetDelta) {
                                if (deltaPercent < 10) {
                                    riskBadgeColor = STATUS_COLORS.success
                                    riskLabel = 'HEDGED'
                                } else if (deltaPercent < 20) {
                                    riskBadgeColor = STATUS_COLORS.warning
                                    riskLabel = 'DRIFT'
                                } else {
                                    riskBadgeColor = STATUS_COLORS.error
                                    riskLabel = 'REBALANCE'
                                }
                            }

                            // <img src="/tokens/HYPE.jpg" style="width: 14px; height: 14px; border-radius: 50%;" />

                            html += `
                            <div style="margin: 8px 0;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></span>
                                        <span style="font-size: 12px; font-weight: 500;">${param.seriesName}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="font-size: 11px; font-weight: 500;">${numeral(hypeAmount).format('+0,0.00')}</span>
                                        <img src="/tokens/HYPE.jpg" style="width: 12px; height: 12px; border-radius: 50%;" />
                                        <span style="font-size: 11px; font-weight: 500;">(${numeral(value).format('+0,0a')}$)</span>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-left: 16px;">
                                    <span style="color: ${textColor}; font-size: 11px;">${deltaPercent.toFixed(0)}% of Deployed AUM</span>
                                    ${
                                        riskLabel
                                            ? `
                                        <span style="
                                            font-size: 9px; 
                                            padding: 2px 6px; 
                                            background: ${riskBadgeColor}20; 
                                            color: ${riskBadgeColor}; 
                                            border-radius: 4px; 
                                            font-weight: 600;
                                            letter-spacing: 0.5px;
                                        ">${riskLabel}</span>
                                    `
                                            : ''
                                    }
                                </div>
                            </div>
                        `
                        })

                        html += '</div>'
                        return html
                    },
                },
                legend: {
                    data: [
                        {
                            name: ChartSeries.hyperLpBalance,
                            textStyle: {
                                color: aumColor,
                            },
                        },
                        {
                            name: ChartSeries.DeployedAUM,
                            textStyle: {
                                color: aumColor,
                            },
                        },
                        {
                            name: ChartSeries.LongEVM,
                            textStyle: {
                                color: colors.hyperEvmLp,
                            },
                        },
                        {
                            name: ChartSeries.HyperEvmBalances,
                            textStyle: {
                                color: colors.hyperEvmBalances,
                            },
                        },
                        {
                            name: ChartSeries.HyperCorePerps,
                            textStyle: {
                                color: colors.hyperCorePerp,
                            },
                        },
                        {
                            name: ChartSeries.HyperCoreSpots,
                            textStyle: {
                                color: colors.hyperCoreSpot,
                            },
                        },
                        {
                            name: ChartSeries.StrategyDelta,
                            textStyle: {
                                color: netDeltaColor,
                            },
                        },
                        // {
                        //     name: ChartSeries.NetDelta,
                        //     textStyle: {
                        //         color: netDeltaColor,
                        //     },
                        // },
                    ],
                    top: 10,
                    selected: legendSelection,
                    icon: 'roundRect',
                    itemWidth: 14,
                    itemHeight: 8,
                    itemGap: 15,
                    inactiveColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                },
                toolbox: {
                    feature: {
                        dataZoom: {
                            yAxisIndex: false,
                            title: {
                                zoom: 'Zoom',
                                back: 'Reset',
                            },
                            iconStyle: {
                                borderColor: colors.charts.text,
                                opacity: 0.5,
                            },
                            emphasis: {
                                iconStyle: {
                                    borderColor: colors.charts.text,
                                    opacity: 1,
                                },
                            },
                        },
                        dataView: {
                            show: true,
                            title: 'Raw Data',
                            lang: ['Data View', 'Turn Off', 'Refresh'],
                            backgroundColor: resolvedTheme === 'dark' ? '#1a1a1a' : '#ffffff',
                            textareaColor: resolvedTheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                            textareaBorderColor: resolvedTheme === 'dark' ? '#404040' : '#d1d5db',
                            textColor: resolvedTheme === 'dark' ? '#ffffff' : '#000000',
                            buttonColor: resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb',
                            buttonTextColor: '#ffffff',
                            iconStyle: {
                                borderColor: colors.charts.text,
                                opacity: 0.5,
                            },
                            emphasis: {
                                iconStyle: {
                                    borderColor: colors.charts.text,
                                    opacity: 1,
                                },
                            },
                        },
                    },
                    itemSize: 10,
                    top: 15,
                    right: 0,
                },
                grid,
                xAxis: {
                    type: 'time',
                    axisLabel: {
                        showMinLabel: false,
                        showMaxLabel: true,
                        fontSize: 10,
                        opacity: 0.5,
                        interval: 'auto',
                        hideOverlap: true,
                        show: true,
                        color: colors.charts.text,
                        formatter: (value: number) => DAYJS_FORMATS.dateTimeChart(value),
                        align: 'center',
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: colors.charts.line,
                            opacity: 0.5,
                            type: 'dashed',
                        },
                    },
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                },
                yAxis: [
                    {
                        type: 'value',
                        // name: 'USD exposure to HYPE {img|}',
                        // nameLocation: 'middle',
                        // nameGap: 55,
                        // nameTextStyle: {
                        //     color: colors.charts.text,
                        //     fontSize: 14,
                        //     fontWeight: 500,
                        //     rich: {
                        //         img: {
                        //             backgroundColor: {
                        //                 image: '/tokens/HYPE.svg',
                        //             },
                        //             width: 20,
                        //             height: 20,
                        //             borderRadius: 9999,
                        //         },
                        //     },
                        // },
                        position: 'left',
                        axisLine: {
                            show: false,
                        },
                        min: 'dataMin',
                        max: 'dataMax',
                        axisLabel: {
                            opacity: 0.5,
                            color: colors.charts.text,
                            formatter: (value: number) => formatUSD(value),
                            showMinLabel: false,
                            showMaxLabel: true,
                        },
                        splitLine: {
                            lineStyle: {
                                color: colors.charts.line,
                                opacity: 0.5,
                                type: 'dashed',
                            },
                        },
                    },
                ],
                series: [
                    {
                        name: ChartSeries.hyperLpBalance,
                        type: 'line',
                        data: totalCapitalUSD,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: true,
                        yAxisIndex: 0,
                        lineStyle: {
                            color: aumColor,
                            width: 2,
                            type: 'solid',
                        },
                        itemStyle: {
                            color: aumColor,
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 2,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                return `Harb ${formatUSD(value)}`
                            },
                            color: aumColor,
                            fontSize: 12,
                            offset: [5, 0],
                            backgroundColor: aumColor + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                    {
                        name: ChartSeries.DeployedAUM,
                        type: 'line',
                        data: deployedAUM,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: true,
                        yAxisIndex: 0,
                        z: 5,
                        lineStyle: {
                            color: aumColor,
                            width: 2,
                            type: 'dotted',
                            opacity: 0.8,
                        },
                        itemStyle: {
                            color: aumColor,
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 2,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                return `Deployed ${formatUSD(value)}`
                            },
                            color: aumColor,
                            fontSize: 12,
                            offset: [5, 0],
                            backgroundColor: aumColor + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                    {
                        name: ChartSeries.LongEVM,
                        type: 'line',
                        data: lpDeltasUSD,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: true,
                        lineStyle: {
                            color: colors.hyperEvmLp,
                            width: 2,
                            type: 'solid',
                        },
                        itemStyle: {
                            color: colors.hyperEvmLp,
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 2,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                const formattedValue = numeral(value).format('+0,0a$')
                                return `${SECTION_CONFIG[SectionType.LONG_EVM].chartSeriesName} ${formattedValue}`
                            },
                            color: colors.hyperEvmLp,
                            fontSize: 12,
                            offset: [5, 0],
                            backgroundColor: colors.hyperEvmLp + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                    {
                        name: ChartSeries.HyperEvmBalances,
                        type: 'line',
                        data: balancesDeltasUSD,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: true,
                        lineStyle: {
                            color: colors.hyperEvmBalances,
                            width: 2,
                            type: 'solid',
                        },
                        itemStyle: {
                            color: colors.hyperEvmBalances,
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 2,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                const formattedValue = numeral(value).format('+0,0a$')
                                return `${ChartSeries.HyperEvmBalances} ${formattedValue}`
                            },
                            color: colors.hyperEvmBalances,
                            fontSize: 12,
                            offset: [5, 0],
                            backgroundColor: colors.hyperEvmBalances + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                    {
                        name: ChartSeries.HyperCorePerps,
                        type: 'line',
                        data: perpDeltasUSD,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: true,
                        lineStyle: {
                            color: colors.hyperCorePerp,
                            width: 2,
                            type: 'solid',
                        },
                        itemStyle: {
                            color: colors.hyperCorePerp,
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 2,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                const formattedValue = numeral(value).format('+0,0a$')
                                return `${ChartSeries.HyperCorePerps} ${formattedValue}`
                            },
                            color: colors.hyperCorePerp,
                            fontSize: 12,
                            offset: [5, 0],
                            backgroundColor: colors.hyperCorePerp + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                    {
                        name: ChartSeries.HyperCoreSpots,
                        type: 'line',
                        data: spotDeltasUSD,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 6,
                        showSymbol: true,
                        lineStyle: {
                            color: colors.hyperCoreSpot,
                            width: 2,
                            type: 'solid',
                        },
                        itemStyle: {
                            color: colors.hyperCoreSpot,
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 2,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                const formattedValue = numeral(value).format('+0,0a$')
                                return `${ChartSeries.HyperCoreSpots} ${formattedValue}`
                            },
                            color: colors.hyperCoreSpot,
                            fontSize: 12,
                            offset: [5, 0],
                            backgroundColor: colors.hyperCoreSpot + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                    // {
                    //     name: ChartSeries.NetDelta,
                    //     type: 'line',
                    //     data: netDeltasUSD,
                    //     smooth: false,
                    //     symbol: 'circle',
                    //     symbolSize: 6,
                    //     showSymbol: true,
                    //     lineStyle: {
                    //         color: netDeltaColor,
                    //         width: 2,
                    //         type: 'solid',
                    //         opacity: 0.5,
                    //     },
                    //     itemStyle: {
                    //         color: netDeltaColor,
                    //         opacity: 0.5,
                    //     },
                    //     emphasis: {
                    //         focus: 'series',
                    //     },
                    //     z: 8,
                    //     endLabel: {
                    //         show: true,
                    //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    //         formatter: (params: any) => {
                    //             const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                    //             // Hide label if value is very close to 0
                    //             if (Math.abs(value) < 1) return ''
                    //             const formattedValue = numeral(value).format('+0,0a$')
                    //             return `${ChartSeries.NetDelta} ${formattedValue}`
                    //         },
                    //         color: netDeltaColor,
                    //         fontSize: 12,
                    //         offset: [5, 0],
                    //         backgroundColor: netDeltaColor + '15',
                    //         padding: [2, 4],
                    //         borderRadius: 4,
                    //     },
                    // },
                    {
                        name: ChartSeries.StrategyDelta,
                        type: 'line',
                        data: strategyDeltasUSD,
                        smooth: false,
                        symbol: 'circle',
                        symbolSize: 7,
                        showSymbol: true,
                        lineStyle: {
                            color: netDeltaColor,
                            width: 3,
                            type: 'dashed',
                        },
                        itemStyle: {
                            color: netDeltaColor,
                        },
                        areaStyle: {
                            opacity: 0.15,
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    {
                                        offset: 0,
                                        color: netDeltaColor + '30', // 19% opacity
                                    },
                                    {
                                        offset: 1,
                                        color: netDeltaColor + '00', // 0% opacity
                                    },
                                ],
                            },
                        },
                        emphasis: {
                            focus: 'series',
                            lineStyle: {
                                width: 3,
                                opacity: 1,
                            },
                            itemStyle: {
                                opacity: 1,
                            },
                            areaStyle: {
                                opacity: 0.15,
                            },
                        },
                        z: 9,
                        markLine: {
                            silent: false,
                            symbol: 'none',
                            animation: false,
                            data: (() => {
                                const markLineData = (rebalanceEvents || []).map((event) => {
                                    const timestamp = new Date(event.timestamp).getTime()
                                    // Extract summary from metadata, fallback to 'Rebalance' if not available
                                    let summary = event.metadata?.summary || 'Rebalance'

                                    // Capitalize DEX names in the summary
                                    summary = summary
                                        .replace(/\bhyperswap\b/gi, 'Hyperswap')
                                        .replace(/\bhybra\b/gi, 'Hybra')
                                        .replace(/\bhyperbrick\b/gi, 'HyperBrick')
                                        .replace(/\bprjtx\b/gi, 'PRJTX')
                                        .replace(/\bproject[\s-]?x\b/gi, 'Project X')
                                    return {
                                        xAxis: timestamp,
                                        label: {
                                            show: true,
                                            formatter: summary,
                                            position: 'middle' as const,
                                            color: colors.hyperEvmLp,
                                            fontSize: 10,
                                            rotate: 90, // Rotate text vertically
                                        },
                                        lineStyle: {
                                            color: colors.hyperEvmLp, // Same color as LP series
                                            type: 'dashed' as const,
                                            width: 2, // Thicker line
                                            opacity: 0.6, // Slightly transparent
                                        },
                                    }
                                })
                                return markLineData
                            })(),
                        },
                        endLabel: {
                            show: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const value = Array.isArray(params.value) ? params.value[1] : params.value || 0
                                const formattedValue = numeral(value).format('+0,0a$')
                                return `${ChartSeries.StrategyDelta} ${formattedValue}`
                            },
                            color: netDeltaColor,
                            fontSize: 14,
                            fontWeight: 600,
                            offset: [5, 0],
                            backgroundColor: netDeltaColor + '15',
                            padding: [2, 4],
                            borderRadius: 4,
                        },
                    },
                ],
                dataZoom: [
                    // X-axis inside zoom
                    {
                        type: 'inside',
                        xAxisIndex: 0,
                        start:
                            validSnapshots.length > DEFAULT_VISIBLE_POINTS
                                ? Math.max(0, 100 - (100 * DEFAULT_VISIBLE_POINTS) / validSnapshots.length)
                                : 0,
                        end: 100,
                    },
                    // X-axis slider
                    {
                        type: 'slider',
                        xAxisIndex: 0,
                        start:
                            validSnapshots.length > DEFAULT_VISIBLE_POINTS
                                ? Math.max(0, 100 - (100 * DEFAULT_VISIBLE_POINTS) / validSnapshots.length)
                                : 0,
                        end: 100,
                        height: 18,
                        bottom: 15,
                        backgroundColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
                        borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                        fillerColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                        selectedDataBackground: {
                            lineStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                            },
                            areaStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                            },
                        },
                        handleStyle: {
                            color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                            borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            borderWidth: 1,
                        },
                        moveHandleStyle: {
                            color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        },
                        emphasis: {
                            handleStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            },
                            moveHandleStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                                borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            },
                            handleLabel: {
                                show: false,
                            },
                        },
                        dataBackground: {
                            lineStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                            },
                            areaStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                            },
                        },
                        textStyle: {
                            color: colors.charts.text,
                        },
                    },
                    // Y-axis slider (manual control only, no inside zoom)
                    {
                        type: 'slider',
                        yAxisIndex: 0,
                        start: 0,
                        end: 100,
                        width: 16,
                        left: 12,
                        backgroundColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
                        borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                        fillerColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                        selectedDataBackground: {
                            lineStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                            },
                            areaStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                            },
                        },
                        handleStyle: {
                            color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                            borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            borderWidth: 1,
                        },
                        moveHandleStyle: {
                            color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        },
                        emphasis: {
                            handleStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            },
                            moveHandleStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                                borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            },
                            handleLabel: {
                                show: false,
                            },
                        },
                        dataBackground: {
                            lineStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                            },
                            areaStyle: {
                                color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                            },
                        },
                        textStyle: {
                            color: colors.charts.text,
                        },
                    },
                ],
            }

            // finally, set the options
            setOptions(echartsOptions)
        } catch (error) {
            console.error('[DeltaTrackingChart] Error processing snapshots:', error)
            setOptions(createLoadingOptions())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedUpdate, resolvedTheme, legendSelection])

    if (!options) {
        return (
            <div className="flex h-[400px] w-full flex-col gap-2 md:h-[460px]">
                <div className="flex h-full w-full grow flex-col items-center justify-center">
                    <div className="text-default/50">Loading chart...</div>
                </div>
                <Legends onShowRebalances={handleShowRebalances} />
            </div>
        )
    }

    return (
        <div className="flex h-[400px] w-full flex-col gap-2 md:h-[460px]">
            <EchartWrapper options={options} className="h-full w-full" onLegendSelectChanged={handleLegendSelectChanged} />
            <Legends isLpAccount={true} onShowRebalances={handleShowRebalances} />

            {/* Rebalance Modal */}
            <RebalanceModal isOpen={showRebalanceModal} onClose={handleCloseRebalanceModal} vaultAddress={validSnapshotsRef.current[0]?.address} />
        </div>
    )
}
