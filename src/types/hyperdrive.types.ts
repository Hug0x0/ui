/**
 * HyperDrive API response types
 */

export interface HyperDriveMarketData {
    chain_id: number
    address: string
    timestamp: number
    symbol: string
    decimals: number
    total_supply: string
    total_assets: string
    exchange_rate: string
    apr: number
    apr_7d: string
    apr_28d: string
}

export interface HyperDriveApiResponse {
    data: HyperDriveMarketData[]
}

export interface HyperDriveMarketHistoryData {
    chainId: number
    marketId: number
    timestamp: number
    shares: string
    assets: string
    exchange_rate: string
    reserve_assets: string
    liabilities: string
    utilization: string
    supply_rate: string
    supply_rate_text: string
    supply_rate_apy: string
    supply_rate_apy_text: string
    supply_rate_7d: string
    supply_rate_7d_text: string
    supply_rate_7d_apy: string
    supply_rate_7d_apy_text: string
    supply_rate_14d: string
    supply_rate_14d_text: string
    supply_rate_14d_apy: string
    supply_rate_14d_apy_text: string
    supply_rate_28d: string
    supply_rate_28d_text: string
    supply_rate_28d_apy: string
    supply_rate_28d_apy_text: string
    borrow_rate: string
    borrow_rate_text: string
    borrow_rate_apy: string
    borrow_rate_apy_text: string
}

export interface HyperDriveMarketHistoryResponse {
    data: HyperDriveMarketHistoryData[]
}

export interface HyperDriveCurrentAPR {
    current: number
    apr7d: number
    apr28d: number
    apy7d: number
    apy28d: number
    timestamp: number
}
