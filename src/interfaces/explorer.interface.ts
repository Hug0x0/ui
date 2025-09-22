import type { ProtocolType } from '@/enums'

/**
 * Raw transaction data from blockchain explorer
 */
export interface ExplorerTransaction {
    hash: string
    from: string
    to: string | null
    value: string
    input: string
    blockNumber: number
    blockHash: string
    timestamp: number
    nonce: number
    gasUsed: string
    gasPrice: string
    status: 'success' | 'failed'
    contractAddress?: string | null
    functionName?: string
    methodId?: string
}

/**
 * Raw transaction from API response
 */
export interface RawApiTransaction {
    hash: string
    from: string
    to: string | null
    value: string
    input: string
    blockNumber: string
    blockHash: string
    timeStamp: string
    nonce: string
    gasUsed: string
    gasPrice: string
    isError: string
    contractAddress?: string | null
    functionName?: string
    methodId?: string
}

/**
 * HyperEVMScan API response format
 */
export interface HyperEVMScanResponse {
    status: '0' | '1'
    message: string
    result: RawApiTransaction[] | string
}

/**
 * Parsed DEX transaction with extracted details
 */
export interface ParsedDexTransaction {
    type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'mint' | 'burn' | 'collect' | 'unknown'
    dex: ProtocolType
    pool?: string
    token0?: string
    token1?: string
    token0Symbol?: string
    token1Symbol?: string
    token0Amount?: string
    token1Amount?: string
    amountIn?: string
    amountOut?: string
    liquidity?: string
    txHash: string
    from: string
    to: string | null
    timestamp: number
    blockNumber: number
    gasUsed: string
    status: 'success' | 'failed'
    functionName?: string
    nonce?: number
}

/**
 * Transaction filter options
 */
export interface TransactionFilter {
    address: string
    dexProtocols?: ProtocolType[]
    tokenPair?: {
        token0: string
        token1: string
    }
    startBlock?: number
    endBlock?: number
    limit?: number
    offset?: number
}

/**
 * Explorer service configuration
 */
export interface ExplorerConfig {
    apiUrl: string
    apiKey?: string
    requestsPerSecond?: number
    timeout?: number
}

/**
 * Token pair information
 */
export interface TokenPair {
    token0Address: string
    token1Address: string
    token0Symbol: string
    token1Symbol: string
}

/**
 * Pool information for filtering
 */
export interface ExplorerPoolInfo {
    address: string
    dex: ProtocolType
    token0: string
    token1: string
    fee?: number
}
