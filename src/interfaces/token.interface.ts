import { FileIds } from '@/enums'
import type { Address } from 'viem'

export interface TokenConfig {
    name: string
    address: Address
    symbol: string
    decimals: number
    chainId: number
    tags: string[]
    fileId: FileIds
    decimalsForRounding: number
}
