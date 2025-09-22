'use client'

import { cn, cleanOutput } from '@/utils'
import StyledTooltip from './StyledTooltip'
import numeral from 'numeral'

export function RoundedAmount(props: { amount: string | number; className?: string; children?: React.ReactNode }) {
    return (
        <StyledTooltip disableAnimation={true} content={<span>{cleanOutput(numeral(props.amount).format('0,0.[0000000000000]'))}</span>}>
            <p className={cn('truncate hover:underline', props.className)}>{props.children}</p>
        </StyledTooltip>
    )
}
