import { cn } from '@/utils'

interface TradeRowTemplateProps {
    time: React.ReactNode
    coin: React.ReactNode
    side: React.ReactNode
    size: React.ReactNode
    price: React.ReactNode
    value: React.ReactNode
    pnl?: React.ReactNode
    fee: React.ReactNode
    hash: React.ReactNode
    raw?: React.ReactNode
    className?: string
}

export function TradeRowTemplate({ time, coin, side, size, price, value, pnl, fee, hash, raw, className }: TradeRowTemplateProps) {
    return (
        <div role="row" className={cn('flex items-center gap-1 px-2', className)}>
            <div role="cell" className="w-[160px] px-2">
                {time}
            </div>
            <div role="cell" className="w-[80px] px-2">
                {coin}
            </div>
            <div role="cell" className="w-[70px] px-2">
                {side}
            </div>
            <div role="cell" className="w-[110px] px-2 text-right">
                {size}
            </div>
            <div role="cell" className="w-[110px] px-2 text-right">
                {price}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {value}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {pnl || <span className="text-default/30">-</span>}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {fee}
            </div>
            <div role="cell" className="w-[120px] px-2 text-right">
                {hash}
            </div>
            <div role="cell" className="flex min-w-[80px] grow justify-end px-2">
                {raw}
            </div>
        </div>
    )
}
