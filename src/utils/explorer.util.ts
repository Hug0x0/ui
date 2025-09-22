/**
 * Explorer URL utilities following Single Responsibility principle
 * Centralizes explorer URL construction logic
 */

const HYPERCORE_EXPLORER_BASE = 'https://app.hyperliquid.xyz/explorer'
const HYPEREVM_EXPLORER_BASE = 'https://hyperevmscan.io'

/**
 * Get HyperCore explorer URL for a transaction
 */
export function getHyperCoreExplorerUrl(txHash: string): string {
    return `${HYPERCORE_EXPLORER_BASE}/tx/${txHash}`
}

/**
 * Get HyperCore explorer URL for an address
 */
export function getHyperCoreAddressExplorerUrl(address: string): string {
    return `${HYPERCORE_EXPLORER_BASE}/address/${address}`
}

/**
 * Get HyperEVM explorer URL for a transaction
 */
export function getHyperEvmExplorerUrl(txHash: string): string {
    // Handle double 0x prefix if present
    const cleanHash = txHash.replace('0x0x', '0x')
    return `${HYPEREVM_EXPLORER_BASE}/tx/${cleanHash}`
}

/**
 * Get HyperEVM explorer URL for an address
 */
export function getHyperEvmAddressExplorerUrl(address: string): string {
    return `${HYPEREVM_EXPLORER_BASE}/address/${address}`
}
