'use client'

import StyledTooltip from './StyledTooltip'
import { formatUSD, formatDelta, getDeltaColor } from '@/utils/format.util'

interface HypeDeltaTooltipProps {
    delta: number
    hypePrice: number // Now required
    className?: string
    decimals?: number
    children?: React.ReactNode
}

export function HypeDeltaTooltip({ delta, hypePrice, className, decimals = 1, children }: HypeDeltaTooltipProps) {
    return (
        <StyledTooltip
            content={
                <div className="space-y-1.5">
                    <div className="font-semibold">HYPE Δ</div>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-6 text-xs">
                            <span className="opacity-75">= Amount</span>
                            <span className="font-medium">
                                {delta >= 0 ? '+' : ''}
                                {delta} HYPE
                            </span>
                        </div>
                        <div className="flex justify-between gap-6 text-xs">
                            <span className="opacity-75">* HYPE Price</span>
                            <span className="font-medium">{formatUSD(hypePrice)}</span>
                        </div>
                        <div className="flex justify-between gap-6 border-t border-default/10 pt-1.5 text-xs">
                            <span className="opacity-75">= USD Value</span>
                            <span className="font-medium">{formatUSD(Math.abs(delta * hypePrice))}</span>
                        </div>
                    </div>
                </div>
            }
        >
            {children || <span className={`cursor-help font-medium ${getDeltaColor(delta)} ${className}`}>{formatDelta(delta, decimals)}</span>}
        </StyledTooltip>
    )
}
