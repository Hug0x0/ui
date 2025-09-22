import type { ExplorerTransaction, ParsedDexTransaction } from '@/interfaces'
import { HYPEREVM_PROTOCOLS, ProtocolType } from '@/config/hyperevm-protocols.config'
import { NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS } from '@/config/hyperevm-tokens.config'

// Common function signatures for DEX interactions
const DEX_FUNCTION_SIGNATURES: Record<string, string> = {
    // Uniswap V3 and forks
    '0x88316456': 'mint', // mint(address,int24,int24,uint128,bytes)
    '0x13ead562': 'mint', // mint(MintParams)
    '0x219f5d17': 'mint', // mint position
    '0x42966c68': 'burn', // burn(uint256)
    '0x89afcb44': 'burn', // burn liquidity
    '0xa0712d68': 'burn', // burn(uint128)
    '0xfc6f7865': 'collect', // collect fees
    '0x4f1eb3d8': 'collect', // collect(CollectParams)
    '0x128acb08': 'swap', // swap exact input
    '0xfa461e33': 'swap', // swap exact output
    '0x414bf389': 'exactInputSingle', // exactInputSingle(ExactInputSingleParams)
    '0xdb3e2198': 'exactOutputSingle', // exactOutputSingle(ExactOutputSingleParams)
    '0xc04b8d59': 'exactInput', // exactInput(ExactInputParams)
    '0xf28c0498': 'exactOutput', // exactOutput(ExactOutputParams)
    '0xac9650d8': 'multicall', // multicall operations
    '0x5ae401dc': 'multicall', // multicall with deadline
    '0x12210e8a': 'refundETH', // refund ETH
    '0x49616997': 'unwrapWETH9', // unwrap WETH
    '0xdf2ab5bb': 'sweepToken', // sweep token
    '0xe90a182f': 'sweepToken', // sweepToken(address,uint256,address)
    '0x395e0df0': 'increaseLiquidity', // increaseLiquidity(IncreaseLiquidityParams)
    '0x0c49ccbe': 'decreaseLiquidity', // decreaseLiquidity(DecreaseLiquidityParams)

    // Liquidity Book (HyperBrick)
    '0xd4e4e5e3': 'addLiquidity', // LB addLiquidity
    '0x5b36a19e': 'addLiquidityAVAX', // LB addLiquidityAVAX
    '0xf5298aca': 'removeLiquidity', // LB removeLiquidity
    '0xfeb92e51': 'removeLiquidityAVAX', // LB removeLiquidityAVAX
    '0x52a03c3e': 'swapExactTokensForTokens', // LB swap
    '0x2dc77e0f': 'swapExactTokensForAVAX', // LB swap for native
    '0x53c43f15': 'swapExactAVAXForTokens', // LB swap from native
    '0x3b442cb6': 'swapTokensForExactTokens', // LB swap
    '0xa32e1e24': 'swapTokensForExactAVAX', // LB swap
    '0xd4c3e4': 'swapAVAXForExactTokens', // LB swap
}

// Token addresses we're interested in
const HYPE_ADDRESSES = [
    WRAPPED_HYPE_ADDRESS, // WHYPE
    NATIVE_HYPE_ADDRESS, // Native HYPE
].map((a) => a.toLowerCase())

/**
 * Parse a raw transaction to extract DEX interaction details
 */
export function parseDexTransaction(
    tx: ExplorerTransaction,
    targetDexes?: ProtocolType[],
    targetTokens?: { token0: string; token1: string },
): ParsedDexTransaction | null {
    // Get function signature (first 10 characters of input data)
    const functionSig = tx.input?.slice(0, 10).toLowerCase()
    if (!functionSig || functionSig === '0x') {
        return null
    }

    // Identify the transaction type
    const functionName = DEX_FUNCTION_SIGNATURES[functionSig]
    if (!functionName) {
        return null
    }

    // Determine transaction type from function name
    let type: ParsedDexTransaction['type'] = 'unknown'
    if (functionName.includes('mint') || functionName.includes('add') || functionName.includes('increase')) {
        type = 'addLiquidity'
    } else if (functionName.includes('burn') || functionName.includes('remove') || functionName.includes('decrease')) {
        type = 'removeLiquidity'
    } else if (functionName.includes('swap') || functionName.includes('exact')) {
        type = 'swap'
    } else if (functionName.includes('collect')) {
        type = 'collect'
    }

    // Check if the transaction is to a known DEX
    const to = tx.to?.toLowerCase()
    if (!to) return null

    // Find which DEX this transaction belongs to
    let dex: ProtocolType | null = null
    for (const [protocol, config] of Object.entries(HYPEREVM_PROTOCOLS)) {
        const addresses = [
            config.dexConfig?.factoryAddress,
            config.dexConfig?.positionManagerAddress,
            config.dexConfig?.routerAddress,
            config.dexConfig?.contracts?.swapRouter,
            config.dexConfig?.contracts?.swapRouter02,
            config.dexConfig?.contracts?.positionManager,
            config.dexConfig?.lbContracts?.router,
            config.dexConfig?.lbContracts?.factory,
        ]
            .filter(Boolean)
            .map((a) => a?.toLowerCase())

        if (addresses.includes(to)) {
            dex = protocol as ProtocolType
            break
        }
    }

    if (!dex) return null

    // Filter by target DEXes if specified
    if (targetDexes && !targetDexes.includes(dex)) {
        return null
    }

    // Create parsed transaction
    const parsed: ParsedDexTransaction = {
        type,
        dex,
        txHash: tx.hash,
        from: tx.from,
        to: tx.to,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber,
        gasUsed: tx.gasUsed,
        status: tx.status,
        functionName,
    }

    // Try to extract token information from input data
    // This is simplified - in production you'd decode the full calldata
    if (targetTokens) {
        const inputLower = tx.input.toLowerCase()
        const token0Lower = targetTokens.token0.toLowerCase()
        const token1Lower = targetTokens.token1.toLowerCase()

        // Check if either token address appears in the input data
        const hasToken0 = inputLower.includes(token0Lower.slice(2)) // Remove 0x prefix
        const hasToken1 = inputLower.includes(token1Lower.slice(2))

        // Only include transaction if it involves our target tokens
        if (!hasToken0 && !hasToken1) {
            return null
        }

        parsed.token0 = targetTokens.token0
        parsed.token1 = targetTokens.token1
    }

    return parsed
}

/**
 * Filter and parse transactions for specific DEXes and token pairs
 */
export function filterDexTransactions(
    transactions: ExplorerTransaction[],
    options?: {
        dexProtocols?: ProtocolType[]
        tokenPair?: { token0: string; token1: string }
        onlyHypeUsdt?: boolean
    },
): ParsedDexTransaction[] {
    const parsed: ParsedDexTransaction[] = []

    // If onlyHypeUsdt is true, set up the token pair filter
    let tokenFilter = options?.tokenPair
    if (options?.onlyHypeUsdt) {
        // We'll check for any combination of HYPE/USDT0
        tokenFilter = undefined // We'll handle this specially
    }

    for (const tx of transactions) {
        // Special handling for HYPE/USDT0 filter
        if (options?.onlyHypeUsdt) {
            // Try with WHYPE/USDT0
            let result = parseDexTransaction(tx, options.dexProtocols, {
                token0: '0x1FA22a8bb4876DfAECa89A2B7621a0AB6469C909', // WHYPE
                token1: '0x68749Bc5d5c85f05a7c0E4E6DA88616226f6e2fA', // USDT0
            })

            if (!result) {
                // Try reverse order
                result = parseDexTransaction(tx, options.dexProtocols, {
                    token0: '0x68749Bc5d5c85f05a7c0E4E6DA88616226f6e2fA', // USDT0
                    token1: '0x1FA22a8bb4876DfAECa89A2B7621a0AB6469C909', // WHYPE
                })
            }

            if (result) {
                // Set token symbols for clarity
                result.token0Symbol = result.token0?.toLowerCase() === HYPE_ADDRESSES[0] ? 'WHYPE' : 'USDT0'
                result.token1Symbol = result.token1?.toLowerCase() === HYPE_ADDRESSES[0] ? 'WHYPE' : 'USDT0'
                parsed.push(result)
            }
        } else {
            // Normal parsing
            const result = parseDexTransaction(tx, options?.dexProtocols, tokenFilter)
            if (result) {
                parsed.push(result)
            }
        }
    }

    return parsed
}

/**
 * Group parsed transactions by DEX
 */
export function groupTransactionsByDex(transactions: ParsedDexTransaction[]): Record<ProtocolType, ParsedDexTransaction[]> {
    const grouped: Partial<Record<ProtocolType, ParsedDexTransaction[]>> = {}

    for (const tx of transactions) {
        const dex = tx.dex as ProtocolType
        if (!grouped[dex]) {
            grouped[dex] = []
        }
        grouped[dex]!.push(tx)
    }

    return grouped as Record<ProtocolType, ParsedDexTransaction[]>
}

/**
 * Get transaction statistics
 */
export function getTransactionStats(transactions: ParsedDexTransaction[]) {
    const stats = {
        total: transactions.length,
        byType: {
            swap: 0,
            addLiquidity: 0,
            removeLiquidity: 0,
            collect: 0,
            mint: 0,
            burn: 0,
            unknown: 0,
        },
        byDex: {} as Record<ProtocolType, number>,
        successful: 0,
        failed: 0,
    }

    for (const tx of transactions) {
        const dex = tx.dex as ProtocolType
        stats.byType[tx.type]++
        stats.byDex[dex] = (stats.byDex[dex] || 0) + 1
        if (tx.status === 'success') {
            stats.successful++
        } else {
            stats.failed++
        }
    }

    return stats
}
