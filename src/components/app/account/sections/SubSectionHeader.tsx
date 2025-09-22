import { cn } from '@/utils'
import StyledTooltip from '@/components/common/StyledTooltip'

interface APRData {
    avg24h?: number | null
    avg7d?: number | null
    avg30d?: number | null
}

interface SubSectionHeaderProps {
    title: string
    className?: string
    apr?: number | null
    aprData?: APRData | null
    aprLabel?: string
}

export function SubSectionHeader({ title, className, apr, aprData, aprLabel = 'APR' }: SubSectionHeaderProps) {
    return (
        <div className={cn('mb-2 flex items-center gap-2 pl-2', className)}>
            <h4 className="text-sm font-medium opacity-30">{title}</h4>
            {apr !== null && apr !== undefined && (
                <StyledTooltip
                    content={
                        aprData ? (
                            <div className="space-y-3">
                                <div className="font-semibold">
                                    {title} {aprLabel} (historic)
                                </div>
                                <div className="space-y-2">
                                    {aprData.avg24h !== null && aprData.avg24h !== undefined && (
                                        <div className="flex justify-between gap-6">
                                            <span className="text-sm opacity-60">24h APR</span>
                                            <span className="text-sm font-medium">{aprData.avg24h.toFixed(2)}%</span>
                                        </div>
                                    )}
                                    {aprData.avg7d !== null && aprData.avg7d !== undefined && (
                                        <div className="flex justify-between gap-6">
                                            <span className="text-sm opacity-60">7d APR</span>
                                            <span className="text-sm font-medium">{aprData.avg7d.toFixed(2)}%</span>
                                        </div>
                                    )}
                                    {aprData.avg30d !== null && aprData.avg30d !== undefined && (
                                        <div className="flex justify-between gap-6">
                                            <span className="text-sm opacity-60">30d APR</span>
                                            <span className="text-sm font-medium">{aprData.avg30d.toFixed(2)}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-default/10 pt-2">
                                    <div className="text-sm opacity-60">Weighted by position value</div>
                                </div>
                            </div>
                        ) : (
                            <div>{apr.toFixed(1)}% APR (24h average)</div>
                        )
                    }
                >
                    <span className="cursor-help rounded bg-default/10 px-2 py-0.5 text-xs font-medium text-default/50">
                        24h APR {apr.toFixed(1)}%
                    </span>
                </StyledTooltip>
            )}
        </div>
    )
}
