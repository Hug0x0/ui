import StyledTooltip from './StyledTooltip'

interface RawDataTooltipProps {
    data: unknown
    label?: string
    className?: string
}

/**
 * Reusable component for displaying raw JSON data in a tooltip
 * Following DRY principle - extracted from repeated pattern in modals
 */
export default function RawDataTooltip({ data, label = 'Raw data', className = 'text-xs' }: RawDataTooltipProps) {
    return (
        <StyledTooltip
            content={
                <div className="max-h-[400px] max-w-[600px] overflow-auto">
                    <pre className="text-foreground text-xs">{JSON.stringify(data, null, 2)}</pre>
                </div>
            }
        >
            <button className={`${className} text-default hover:text-primary`}>{label}</button>
        </StyledTooltip>
    )
}
