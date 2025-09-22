export interface RebalanceTransaction {
    hash: string
    step: number
    status: string
    action_name: string
    swap_method: string | null
}

export interface RebalanceMetadata {
    fee: number
    error: string | null
    reason: string
    account: string
    dexName: string
    summary: string
    toRange: [number, number]
    txs?: RebalanceTransaction[]
    txHashes: {
        nft_burned?: string
        fees_collected?: string
        token0_swapped?: string
        token1_swapped?: string
        liquidity_decreased?: string
        new_position_minted?: string
    }
    fromRange: [number, number]
    monitorDex: string
    newTokenId: number
    oldTokenId: number
    currentPrice: number
    token0Symbol: string
    token1Symbol: string
    lpTargetRangeBps: number
    rebalanceTriggerDeviationBps: number
}

export interface RebalanceEvent {
    id: string
    vaultId: string
    timestamp: Date
    status: 'pending' | 'executed' | 'failed' | 'cancelled' | 'completed'
    poolAddress: string
    vaultAddress: string
    metadata: RebalanceMetadata
    createdAt: Date
    updatedAt: Date
}

export interface Vault {
    id: string
    name: string
    symbol: string
    address: string
    poolAddress: string
    metadata: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
    rebalances?: RebalanceEvent[]
}

export interface RebalanceQueryParams {
    vaultAddress?: string
    status?: 'pending' | 'executed' | 'failed' | 'cancelled'
    startDate?: Date | string
    endDate?: Date | string
    limit?: number
    offset?: number
    orderBy?: 'timestamp' | 'createdAt'
    order?: 'asc' | 'desc'
}

export interface RebalanceResponse {
    success: boolean
    data?: RebalanceEvent[]
    pagination?: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
        requestedLimit?: number
        actualLimit?: number
    }
    error?: string
}
