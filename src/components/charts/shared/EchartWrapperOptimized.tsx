/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useRef, useState } from 'react'
import type * as echarts from 'echarts'
import { cn } from '@/utils'

export function ChartBackground({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`bg-card rounded-lg p-4 ${className}`}>{children}</div>
}

export function LoadingArea() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="text-secondary">Loading...</div>
        </div>
    )
}

export function CustomFallback() {
    return (
        <div className="bg-card flex h-[400px] w-full items-center justify-center rounded-lg md:h-[500px]">
            <div className="text-secondary">Loading chart...</div>
        </div>
    )
}

interface InterfaceEchartWrapperProps {
    options: echarts.EChartsOption
    id?: string
    onPointClick?: (params: unknown) => void
    onDataZoomChange?: (start: number, end: number, axis?: 'x' | 'y') => void
    onRestore?: () => void
    onLegendSelectChanged?: (selected: Record<string, boolean>) => void

    onMouseOver?: (params: any) => void
    onMouseOut?: () => void
    className?: string
}

function EchartWrapperOptimized(props: InterfaceEchartWrapperProps) {
    const chartRef = useRef<HTMLDivElement>(null)
    const myChart = useRef<echarts.ECharts | null>(null)
    const [echartsModule, setEchartsModule] = useState<typeof echarts | null>(null)
    const handleChartResize = () => myChart.current?.resize()
    const prevOptionsRef = useRef<echarts.EChartsOption | null>(null)

    useEffect(() => {
        let isSubscribed = true

        const loadEcharts = async () => {
            const echartsLib = await import('echarts')
            if (isSubscribed) {
                setEchartsModule(echartsLib)
            }
        }

        loadEcharts()

        return () => {
            isSubscribed = false
        }
    }, [])

    useEffect(() => {
        if (!echartsModule || !chartRef.current) return

        if (!myChart.current) {
            myChart.current = echartsModule.init(chartRef.current)
        }

        // Preserve user's zoom state if they've zoomed
        const currentOption = myChart.current.getOption()
        let optionsToApply = props.options

        if (currentOption?.dataZoom) {
            const dataZoom = currentOption.dataZoom as any[]
            const hasUserZoom = dataZoom.some((dz: any) => (dz.start !== 0 && dz.start !== undefined) || (dz.end !== 100 && dz.end !== undefined))

            if (hasUserZoom) {
                optionsToApply = {
                    ...props.options,
                    dataZoom,
                }
            }
        }

        // Apply options
        myChart.current.setOption(optionsToApply, {
            notMerge: false,
            lazyUpdate: true,
            replaceMerge: [], // Don't replace any components, merge them all
        })
        prevOptionsRef.current = props.options

        if (props.onPointClick) {
            myChart.current.off('click')
            myChart.current.on('click', props.onPointClick)
        }

        if (props.onDataZoomChange || props.onRestore) {
            myChart.current.off('dataZoom')
            myChart.current.on('dataZoom', (params: unknown) => {
                const p = params as any

                // Check if this is a batch update (from toolbox reset)
                if (p.batch) {
                    // Check if all dataZooms are being reset to default
                    const allReset = p.batch.every(
                        (b: any) => (b.startValue === undefined && b.endValue === undefined) || (b.start === 0 && b.end === 100),
                    )

                    if (allReset && props.onRestore) {
                        props.onRestore()
                        // Still call the change handler to update to default values
                        if (props.onDataZoomChange) {
                            props.onDataZoomChange(0, 100, 'x')
                            props.onDataZoomChange(0, 100, 'y')
                        }
                        return
                    }

                    // Process batch updates
                    if (props.onDataZoomChange) {
                        p.batch.forEach((b: any) => {
                            const axis = b.dataZoomId?.includes('yAxis') ? 'y' : 'x'
                            props.onDataZoomChange?.(b.start || 0, b.end || 100, axis)
                        })
                    }
                } else if (props.onDataZoomChange) {
                    // Single dataZoom update
                    const axis = p.dataZoomId?.includes('yAxis') ? 'y' : 'x'
                    props.onDataZoomChange(p.start, p.end, axis)
                }
            })
        }

        if (props.onMouseOver) {
            myChart.current.off('mouseover')
            myChart.current.on('mouseover', props.onMouseOver)
        }

        if (props.onMouseOut) {
            myChart.current.off('mouseout')
            myChart.current.on('mouseout', props.onMouseOut)
        }

        if (props.onRestore) {
            myChart.current.off('restore')
            myChart.current.on('restore', props.onRestore)

            // Also listen for dataZoomReset event from toolbox
            myChart.current.off('dataZoomReset')
            myChart.current.on('dataZoomReset', props.onRestore)
        }

        // Handle legend selection changes
        if (props.onLegendSelectChanged) {
            myChart.current.off('legendselectchanged')
            myChart.current.on('legendselectchanged', (params: any) => {
                props.onLegendSelectChanged?.(params.selected)
            })
        }

        // Add both window resize and ResizeObserver for better responsiveness
        window.addEventListener('resize', handleChartResize)

        // Use ResizeObserver to detect parent container size changes
        const resizeObserver = new ResizeObserver(() => {
            handleChartResize()
        })

        if (chartRef.current) {
            resizeObserver.observe(chartRef.current)
        }

        return () => {
            window.removeEventListener('resize', handleChartResize)
            resizeObserver.disconnect()
        }
    }, [echartsModule, props])

    useEffect(() => {
        return () => {
            if (myChart.current) {
                myChart.current.dispose()
                myChart.current = null
            }
        }
    }, [])

    if (!echartsModule) {
        return <CustomFallback />
    }

    return <div ref={chartRef} className={cn('h-full w-full', props.className)} />
}

export default EchartWrapperOptimized
