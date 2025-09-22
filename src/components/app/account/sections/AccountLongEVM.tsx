'use client'

import { CollapsibleCard } from '@/components/app/account/CollapsibleCard'
import { LPPositionsTable } from '@/components/app/account/tables/LPPositionsTable'
import { HyperDrivePositionsTable } from '@/components/app/account/tables/HyperDrivePositionsTable'
import StyledTooltip from '@/components/common/StyledTooltip'
import { useAppStore } from '@/stores/app.store'
import { SECTION_CONFIG, SectionType } from '@/config/sections.config'
import numeral from 'numeral'
import FileMapper from '@/components/common/FileMapper'
import { getProtocolByName } from '@/config'
import type { ProtocolType } from '@/config/hyperevm-protocols.config'
import type { LPPosition } from '@/interfaces'

export default function AccountLongEVM() {
    const snapshot = useAppStore((state) => state.getLatestSnapshot())

    // Get LP metrics
    const lpMetrics = snapshot?.metrics?.longLegs?.find((l) => l.type === 'lp')?.metrics
    const lpAPRs = lpMetrics?.weightedAPR

    // Get HyperDrive metrics
    const hyperDriveMetrics = snapshot?.metrics?.longLegs?.find((l) => l.type === 'hyperdrive')?.metrics
    const hyperDriveAPRs = hyperDriveMetrics?.weightedAPR

    // Get LP positions to extract unique protocols
    const lpPositions = (snapshot?.positions?.longLegs?.find((l) => l.type === 'lp')?.positions as unknown as LPPosition[]) || []

    // Extract unique protocols from active positions (LP pools)
    const uniqueProtocols = Array.from(
        new Set(
            lpPositions
                .filter((position) => !position.isClosed)
                .map((position) => position.dex)
                .filter(Boolean),
        ),
    )

    // Add HyperDrive if there are active HyperDrive positions
    const hasActiveHyperDrive = (hyperDriveMetrics?.positionCount || 0) > 0
    if (hasActiveHyperDrive) {
        uniqueProtocols.push('hyperdrive')
    }

    // Calculate combined metrics
    const totalValueUSD = (lpMetrics?.totalValueUSD || 0) + (hyperDriveMetrics?.totalValueUSD || 0)

    // Calculate weighted average APRs for all periods
    const calculateWeightedAPR = (lpAPR: number | null | undefined, hdAPR: number | null | undefined) => {
        const lpValue = lpMetrics?.totalValueUSD || 0
        const hdValue = hyperDriveMetrics?.totalValueUSD || 0
        const totalValue = lpValue + hdValue

        // If no positions at all, return null
        if (totalValue === 0) return null

        // If only LP positions exist, return LP APR
        if (lpValue > 0 && hdValue === 0) return lpAPR ?? null

        // If only HyperDrive positions exist, return HyperDrive APR
        if (hdValue > 0 && lpValue === 0) return hdAPR ?? null

        // If both exist but both APRs are null, return null
        if (lpAPR === null && hdAPR === null) return null

        // Calculate weighted average
        return ((lpAPR || 0) * lpValue + (hdAPR || 0) * hdValue) / totalValue
    }

    const combinedAPRs = {
        avg24h: calculateWeightedAPR(lpAPRs?.avg24h, hyperDriveAPRs?.avg24h),
        avg7d: calculateWeightedAPR(lpAPRs?.avg7d, hyperDriveAPRs?.avg7d),
        avg30d: calculateWeightedAPR(lpAPRs?.avg30d, hyperDriveAPRs?.avg30d),
    }

    const combinedAPR = combinedAPRs.avg24h

    // Check if we have any positions with APR data
    const hasAPRData = totalValueUSD > 0 && combinedAPR !== null && combinedAPR !== undefined

    return (
        <CollapsibleCard
            title={
                <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-semibold ${SECTION_CONFIG[SectionType.LONG_EVM].className}`}>
                        {SECTION_CONFIG[SectionType.LONG_EVM].displayName}
                    </h3>

                    {/* Protocol logos */}
                    {uniqueProtocols.length > 0 && (
                        <div className="flex items-center gap-1">
                            {uniqueProtocols.map((dex) => {
                                const protocol = getProtocolByName(dex as ProtocolType)
                                if (!protocol?.fileId) return null

                                return <FileMapper key={dex} id={protocol.fileId} width={20} height={20} className="rounded" />
                            })}
                        </div>
                    )}
                </div>
            }
            defaultExpanded={true}
            headerRight={
                <div className="flex items-center gap-6">
                    {hasAPRData && (
                        <StyledTooltip
                            content={
                                <div className="space-y-3">
                                    <div className="font-semibold">APR</div>

                                    <div className="space-y-2">
                                        {combinedAPRs.avg24h !== null && combinedAPRs.avg24h !== undefined && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-sm font-medium opacity-60">24h avg</span>
                                                <span className="text-sm font-medium text-success">
                                                    {combinedAPRs.avg24h > 0 ? '+' : ''}
                                                    {combinedAPRs.avg24h.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                        {combinedAPRs.avg7d !== null && combinedAPRs.avg7d !== undefined && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-sm font-medium opacity-60">7d avg</span>
                                                <span className="text-sm font-medium text-success">
                                                    {combinedAPRs.avg7d > 0 ? '+' : ''}
                                                    {combinedAPRs.avg7d.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                        {combinedAPRs.avg30d !== null && combinedAPRs.avg30d !== undefined && (
                                            <div className="flex justify-between gap-3">
                                                <span className="text-sm font-medium opacity-60">30d avg</span>
                                                <span className="text-sm font-medium text-success">
                                                    {combinedAPRs.avg30d > 0 ? '+' : ''}
                                                    {combinedAPRs.avg30d.toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-default/10 pt-2">
                                        <div className="text-sm opacity-60">Weighted by position value</div>
                                    </div>
                                </div>
                            }
                        >
                            <div className="flex items-center gap-1 rounded bg-default/5 px-2 py-1">
                                <p className="text-sm text-default/50">APR</p>
                                <p className="text-sm font-medium text-success">
                                    {combinedAPR > 0 ? '+' : ''}
                                    {combinedAPR.toFixed(0)}%
                                </p>
                            </div>
                        </StyledTooltip>
                    )}
                    <p>{numeral(totalValueUSD).format('0,0$')}</p>
                </div>
            }
        >
            <div className="space-y-4">
                {/* LP Positions Sub-section */}
                {(lpMetrics?.positionCount || 0) > 0 && (
                    <div>
                        {/* <SubSectionHeader title="Liquidity Pools" apr={lpAPRs?.avg24h} aprData={lpAPRs} aprLabel="average APR" /> */}
                        <h4 className="mb-2 pl-2 text-sm font-medium opacity-30">Liquidity Pools</h4>
                        <LPPositionsTable />
                    </div>
                )}

                {/* HyperDrive Positions Sub-section */}
                {(hyperDriveMetrics?.positionCount || 0) > 0 && (
                    <div>
                        {/* <SubSectionHeader title="HyperDrive" apr={hyperDriveAPRs?.avg24h} aprData={hyperDriveAPRs} aprLabel="APR" /> */}
                        <h4 className="mb-2 pl-2 text-sm font-medium opacity-30">Lending Markets</h4>
                        <HyperDrivePositionsTable />
                    </div>
                )}
            </div>
        </CollapsibleCard>
    )
}
