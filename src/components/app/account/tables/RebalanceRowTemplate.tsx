import { cn } from '@/utils'

interface RebalanceRowTemplateProps {
    time: React.ReactNode
    dex: React.ReactNode
    pair: React.ReactNode
    summary: React.ReactNode
    transactions: React.ReactNode
    raw: React.ReactNode
    className?: string
}

export function RebalanceRowTemplate({ time, dex, pair, summary, transactions, raw, className }: RebalanceRowTemplateProps) {
    return (
        <div role="row" className={cn('flex items-center gap-1 px-2', className)}>
            <div role="cell" className="w-[130px] px-2">
                {time}
            </div>
            <div role="cell" className="w-[50px] px-2">
                {dex}
            </div>
            <div role="cell" className="w-[180px] px-2">
                {pair}
            </div>
            <div role="cell" className="w-[260px] px-2">
                {summary}
            </div>
            <div role="cell" className="min-w-[300px] grow px-2">
                {transactions}
            </div>
            <div role="cell" className="flex w-[80px] justify-end px-2">
                {raw}
            </div>
        </div>
    )
}
