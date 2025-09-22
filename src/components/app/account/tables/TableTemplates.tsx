'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils'

/**
 * LP Position Row Template
 */
export const LPRowTemplate = (props: {
    dex: ReactNode
    poolAddress: ReactNode
    feeTier: ReactNode
    status: ReactNode
    hype: ReactNode
    usdt: ReactNode
    value: ReactNode
    split: ReactNode
    tvl: ReactNode
    apr24h: ReactNode
    apr7d: ReactNode
    apr30d: ReactNode
    positionId: ReactNode
    nftId: ReactNode
    className?: string
}) => {
    return (
        <div role="row" className={cn('flex items-center gap-1 px-2 text-sm', props.className)}>
            <div role="cell" className="flex w-[70px] items-center pl-2">
                {props.dex}
            </div>
            <div role="cell" className="flex w-[70px] items-center">
                {props.poolAddress}
            </div>
            <div role="cell" className="flex w-[55px] items-center">
                {props.feeTier}
            </div>
            <div role="cell" className="flex w-[65px] items-center">
                {props.status}
            </div>
            <div role="cell" className="flex w-[80px] items-center justify-center text-center">
                {props.value}
            </div>
            <div role="cell" className="flex w-[60px] items-center text-center">
                {props.hype}
            </div>
            <div role="cell" className="flex w-[60px] items-center text-center">
                {props.usdt}
            </div>
            <div role="cell" className="flex w-[70px] items-center text-center">
                {props.split}
            </div>
            <div role="cell" className="flex w-[50px] items-center text-center">
                {props.tvl}
            </div>
            <div role="cell" className="flex w-[60px] items-center text-center">
                {props.apr24h}
            </div>
            <div role="cell" className="flex w-[60px] items-center text-center">
                {props.apr7d}
            </div>
            <div role="cell" className="flex w-[65px] items-center text-center">
                {props.apr30d}
            </div>
            <div role="cell" className="flex w-[80px] items-center text-center">
                {props.positionId}
            </div>
            {/* <div className="w-[80px] text-right">{props.nftId}</div> */}
        </div>
    )
}

/**
 * Wallet Balance Row Template
 */
export const WalletRowTemplate = (props: {
    token: ReactNode
    balance: ReactNode
    value: ReactNode
    price: ReactNode
    address: ReactNode
    className?: string
}) => {
    return (
        <div role="row" className={cn('flex items-center text-sm', props.className)}>
            <div role="cell" className="w-[140px] px-2">
                {props.token}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.price}
            </div>
            <div role="cell" className="w-[120px] px-2 text-right">
                {props.balance}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.value}
            </div>
            {/* <div className="w-[200px] px-2 text-[10px] text-default/50">{props.address}</div> */}
        </div>
    )
}

/**
 * Perp Position Row Template
 */
export const PerpRowTemplate = (props: {
    asset: ReactNode
    side: ReactNode
    size: ReactNode
    notional: ReactNode
    entry: ReactNode
    mark: ReactNode
    pnl: ReactNode
    funding: ReactNode
    margin: ReactNode
    leverage: ReactNode
    className?: string
}) => {
    return (
        <div role="row" className={cn('flex items-center text-sm', props.className)}>
            <div role="cell" className="w-[120px] px-2">
                {props.asset}
            </div>
            <div role="cell" className="w-[60px] px-2">
                {props.side}
            </div>
            <div role="cell" className="w-[90px] px-2 text-right">
                {props.size}
            </div>
            <div role="cell" className="w-[90px] px-2 text-right">
                {props.notional}
            </div>
            <div role="cell" className="w-[80px] px-2 text-right">
                {props.entry}
            </div>
            <div role="cell" className="w-[80px] px-2 text-right">
                {props.mark}
            </div>
            <div role="cell" className="w-[120px] px-2 text-right">
                {props.pnl}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.funding}
            </div>
            <div role="cell" className="w-[80px] px-2 text-right">
                {props.margin}
            </div>
            <div role="cell" className="w-[60px] px-2 text-right">
                {props.leverage}
            </div>
        </div>
    )
}

/**
 * Spot Balance Row Template
 */
export const SpotRowTemplate = (props: { asset: ReactNode; balance: ReactNode; value: ReactNode; price?: ReactNode; className?: string }) => {
    return (
        <div role="row" className={cn('flex items-center text-sm', props.className)}>
            <div role="cell" className="w-[140px] px-2">
                {props.asset}
            </div>
            {props.price !== undefined && (
                <div role="cell" className="w-[100px] px-2 text-right">
                    {props.price}
                </div>
            )}
            <div role="cell" className="w-[120px] px-2 text-right">
                {props.balance}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.value}
            </div>
        </div>
    )
}

/**
 * Transaction Row Template
 */
export const TransactionRowTemplate = (props: {
    time: ReactNode
    hash: ReactNode
    type: ReactNode
    tokens: ReactNode
    dex: ReactNode
    nonce: ReactNode
    status: ReactNode
    className?: string
}) => {
    return (
        <div role="row" className={cn('flex items-center text-sm', props.className)}>
            <div role="cell" className="w-[100px] px-2">
                {props.time}
            </div>
            <div role="cell" className="w-[120px] px-2">
                {props.hash}
            </div>
            <div role="cell" className="w-[120px] px-2">
                {props.type}
            </div>
            <div role="cell" className="w-[140px] px-2">
                {props.tokens}
            </div>
            <div role="cell" className="w-[100px] px-2">
                {props.dex}
            </div>
            <div role="cell" className="w-[60px] px-2 text-right">
                {props.nonce}
            </div>
            <div role="cell" className="w-[60px] px-2 text-center">
                {props.status}
            </div>
        </div>
    )
}

/**
 * HyperCore Trade Row Template
 */
export const HyperCoreTradeRowTemplate = (props: {
    time: ReactNode
    hash: ReactNode
    type: ReactNode
    coin: ReactNode
    side: ReactNode
    size: ReactNode
    price: ReactNode
    value: ReactNode
    pnl: ReactNode
    className?: string
}) => {
    return (
        <div role="row" className={cn('flex items-center text-sm', props.className)}>
            <div role="cell" className="w-[100px] px-2">
                {props.time}
            </div>
            <div role="cell" className="w-[120px] px-2">
                {props.hash}
            </div>
            <div role="cell" className="w-[80px] px-2">
                {props.type}
            </div>
            <div role="cell" className="w-[80px] px-2">
                {props.coin}
            </div>
            <div role="cell" className="w-[70px] px-2">
                {props.side}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.size}
            </div>
            <div role="cell" className="w-[90px] px-2 text-right">
                {props.price}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.value}
            </div>
            <div role="cell" className="w-[100px] px-2 text-right">
                {props.pnl}
            </div>
        </div>
    )
}
