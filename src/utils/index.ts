import { clsx, ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'An unknown error occurred'
}

export const isCurrentPath = (pathname: string, pagePath: string) => (pagePath === '/' ? pathname === pagePath : pathname.startsWith(pagePath))

export * from './cache.util'
export * from './date.util'
export * from './delta.util'
export * from './explorer.util'
export * from './format.util'
export * from './logger.util'
export * from './position-aggregator.util'
export * from './rate-limit.util'
export * from './snapshot-validator.util'
export * from './token.util'
export * from './trade-aggregation.util'
export * from './uniswap-v3.util'
export * from './validation.util'
