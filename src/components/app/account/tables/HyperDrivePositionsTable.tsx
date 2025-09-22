'use client'
import { useState } from 'react'
import { FileIds, IconIds, ProtocolType } from '@/enums'
import FileMapper from '@/components/common/FileMapper'
import IconWrapper from '@/components/icons/IconWrapper'
import type { HyperDrivePositionLeg } from '@/interfaces/position-leg.interface'
import { formatUSD, formatNumber } from '@/utils/format.util'
import { cn } from '@/utils'
import StyledTooltip from '@/components/common/StyledTooltip'
import { useAppStore } from '@/stores/app.store'
import { EmptyTablePlaceholder } from './EmptyTablePlaceholder'
import numeral from 'numeral'
import { getProtocolByName } from '@/config'
import PositionIframeModal from '@/components/modals/PositionIframeModal'

interface HyperDrivePositionsTableProps {
    className?: string
}

// Create a row template for HyperDrive similar to LPRowTemplate
const HyperDriveRowTemplate = (props: {
    protocol: React.ReactNode
    market: React.ReactNode
    deposited: React.ReactNode
    value: React.ReactNode
    apr24h: React.ReactNode
    apr7d: React.ReactNode
    apr30d: React.ReactNode
    className?: string
}) => {
    return (
        <div role="row" className={cn('flex items-center gap-1 px-2 text-sm', props.className)}>
            <div role="cell" className="w-[70px] pl-2">
                {props.protocol}
            </div>
            <div role="cell" className="w-[130px]">
                {props.market}
            </div>
            <div role="cell" className="w-[70px] text-right">
                {props.deposited}
            </div>
            <div role="cell" className="w-[70px] text-right">
                {props.value}
            </div>
            <div role="cell" className="w-[60px] text-center">
                {props.apr24h}
            </div>
            <div role="cell" className="w-[60px] text-center">
                {props.apr7d}
            </div>
            <div role="cell" className="w-[60px] text-center">
                {props.apr30d}
            </div>
        </div>
    )
}

export function HyperDrivePositionsTableHeader() {
    return (
        <HyperDriveRowTemplate
            protocol={
                <span role="columnheader" className="truncate">
                    Protocol
                </span>
            }
            market={
                <span role="columnheader" className="truncate">
                    Market
                </span>
            }
            deposited={
                <span role="columnheader" className="truncate">
                    Deposited
                </span>
            }
            value={
                <span role="columnheader" className="truncate">
                    Value $
                </span>
            }
            apr24h={
                <span role="columnheader" className="truncate">
                    Current
                </span>
            }
            apr7d={
                <span role="columnheader" className="truncate">
                    7d APY
                </span>
            }
            apr30d={
                <span role="columnheader" className="truncate">
                    30d APY
                </span>
            }
            className="h-8 border-b border-default/10 text-xs text-default/50"
        />
    )
}

export function HyperDrivePositionsTable({ className }: HyperDrivePositionsTableProps) {
    const [selectedPosition, setSelectedPosition] = useState<HyperDrivePositionLeg | null>(null)

    // Get positions directly from the store
    const snapshot = useAppStore((state) => state.getLatestSnapshot())
    const positions = (snapshot?.positions?.longLegs?.find((l) => l.type === 'hyperdrive')?.positions as unknown as HyperDrivePositionLeg[]) || []

    if (!positions || positions.length === 0) {
        return <EmptyTablePlaceholder message="No HyperDrive positions" className={className} />
    }

    const protocol = getProtocolByName(ProtocolType.HYPERDRIVE)

    const handlePositionClick = (position: HyperDrivePositionLeg) => {
        setSelectedPosition(position)
    }

    const handleCloseModal = () => {
        setSelectedPosition(null)
    }

    return (
        <div role="table" className={cn('overflow-x-auto', className)}>
            <div className="min-w-max">
                <HyperDrivePositionsTableHeader />
                <div role="rowgroup" className="divide-y divide-default/5">
                    {positions.map((position) => {
                        return (
                            <div
                                key={position.id}
                                onClick={() => handlePositionClick(position)}
                                className="cursor-pointer transition-colors hover:bg-default/5"
                                role="presentation"
                            >
                                <HyperDriveRowTemplate
                                    protocol={
                                        <div className="flex items-center gap-1.5">
                                            {protocol?.fileId && <FileMapper id={protocol.fileId} width={18} height={18} className="rounded" />}
                                            <IconWrapper id={IconIds.EXPAND} className="size-3 text-default/40" />
                                        </div>
                                    }
                                    market={
                                        <div className="flex items-center gap-1.5">
                                            <FileMapper id={FileIds.TOKEN_HYPE} width={16} height={16} className="rounded-full" />
                                            <p className="truncate font-medium">HYPE LST Market</p>
                                        </div>
                                    }
                                    deposited={
                                        <StyledTooltip
                                            content={
                                                <div className="space-y-3">
                                                    <div className="font-semibold">Deposited Amount</div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1">
                                                            <FileMapper id={FileIds.TOKEN_HYPE} width={16} height={16} className="rounded-full" />
                                                            <p className="text-sm font-medium">{formatNumber(position.assetsUnits, 4)} HYPE</p>
                                                        </div>
                                                        <div className="text-sm opacity-60">Value: {formatUSD(position.valueUSD)}</div>
                                                    </div>
                                                    <div className="border-t border-default/10 pt-2">
                                                        <div className="text-sm opacity-60">Your underlying HYPE in HyperDrive</div>
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <p className="cursor-help font-medium hover:underline">{formatNumber(position.assetsUnits, 2)}</p>
                                                <FileMapper id={FileIds.TOKEN_HYPE} width={16} height={16} className="rounded-full" />
                                            </div>
                                        </StyledTooltip>
                                    }
                                    value={
                                        <StyledTooltip
                                            content={
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium opacity-60">Position Value</p>
                                                    <p className="text-sm font-medium">{numeral(position.valueUSD).format('0,0.[00]$')}</p>
                                                </div>
                                            }
                                        >
                                            <span className="font-medium hover:underline">{formatUSD(position.valueUSD)}</span>
                                        </StyledTooltip>
                                    }
                                    apr24h={
                                        <StyledTooltip
                                            content={
                                                <div className="space-y-3">
                                                    <div className="font-semibold">Current Supply Rate</div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between gap-3">
                                                            <span className="text-sm font-medium opacity-60">Latest</span>
                                                            <span className="text-sm font-medium text-success">
                                                                {(position.apr?.avg24h ?? 0) > 0 ? '+' : ''}
                                                                {(position.apr?.avg24h ?? 0).toFixed(3)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-default/10 pt-2">
                                                        <div className="opacity-60">Based on recent market data</div>
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <p className="cursor-help font-medium text-success hover:underline">
                                                {position.apr?.avg24h ? `${position.apr.avg24h.toFixed(2)}%` : '-'}
                                            </p>
                                        </StyledTooltip>
                                    }
                                    apr7d={
                                        <StyledTooltip
                                            content={
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium opacity-60">7-day average APY</p>
                                                    <p className="text-sm font-medium">
                                                        {(position.apr?.avg7d ?? 0) > 0 ? '+' : ''}
                                                        {(position.apr?.avg7d ?? 0).toFixed(3)}%
                                                    </p>
                                                    <p className="opacity-60">Compounded annual yield</p>
                                                </div>
                                            }
                                        >
                                            <p className="cursor-help font-medium hover:underline">
                                                {position.apr?.avg7d ? `${position.apr.avg7d.toFixed(2)}%` : '-'}
                                            </p>
                                        </StyledTooltip>
                                    }
                                    apr30d={
                                        <StyledTooltip
                                            content={
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium opacity-60">30-day average APY</p>
                                                    <p className="text-sm font-medium">
                                                        {(position.apr?.avg30d ?? 0) > 0 ? '+' : ''}
                                                        {(position.apr?.avg30d ?? 0).toFixed(3)}%
                                                    </p>
                                                    <p className="opacity-60">Compounded annual yield</p>
                                                </div>
                                            }
                                        >
                                            <p className="cursor-help font-medium hover:underline">
                                                {position.apr?.avg30d ? `${position.apr.avg30d.toFixed(2)}%` : '-'}
                                            </p>
                                        </StyledTooltip>
                                    }
                                    className="h-10 text-sm transition-colors hover:bg-default/5"
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* HyperDrive Iframe Modal */}
            <PositionIframeModal
                isOpen={!!selectedPosition}
                onClose={handleCloseModal}
                position={selectedPosition}
                url={protocol?.portfolioUrl}
                title="HyperDrive Position"
            />
        </div>
    )
}
