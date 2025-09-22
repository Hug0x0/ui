import type { Address } from 'viem'
import { getViemClient, HYPEREVM_CHAIN_ID } from '@/lib/viem'
import { UNISWAP_V3_POOL_ABI, NONFUNGIBLE_POSITION_MANAGER_ABI, UNISWAP_V3_FACTORY_ABI, ERC20_ABI } from '@/contracts/uniswap-v3-abis'
import { NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS, USDT0_ADDRESS } from '@/config/hyperevm-tokens.config'

export async function fetchPoolState(
    poolAddress: Address,
    chainId: number = HYPEREVM_CHAIN_ID,
): Promise<{
    sqrtPriceX96: bigint
    tick: number
    liquidity: bigint
    token0: Address
    token1: Address
    fee: number
}> {
    // Check for zero address
    if (poolAddress === NATIVE_HYPE_ADDRESS) {
        throw new Error('Invalid pool address: zero address')
    }

    try {
        const client = getViemClient(chainId)

        const [slot0, liquidity, fee, token0, token1] = await Promise.all([
            client.readContract({
                address: poolAddress,
                abi: UNISWAP_V3_POOL_ABI,
                functionName: 'slot0',
            }),
            client.readContract({
                address: poolAddress,
                abi: UNISWAP_V3_POOL_ABI,
                functionName: 'liquidity',
            }),
            client.readContract({
                address: poolAddress,
                abi: UNISWAP_V3_POOL_ABI,
                functionName: 'fee',
            }),
            client.readContract({
                address: poolAddress,
                abi: UNISWAP_V3_POOL_ABI,
                functionName: 'token0',
            }),
            client.readContract({
                address: poolAddress,
                abi: UNISWAP_V3_POOL_ABI,
                functionName: 'token1',
            }),
        ])

        return {
            sqrtPriceX96: slot0[0],
            tick: slot0[1],
            liquidity,
            fee,
            token0,
            token1,
        }
    } catch (error) {
        const err = error as Error & { code?: string; shortMessage?: string }

        // Enhance error with context
        const enhancedError = new Error(`Failed to fetch pool state for ${poolAddress.slice(0, 10)}...`) as Error & {
            code?: string
            details?: string
            cause?: unknown
        }

        enhancedError.code = err.code
        enhancedError.cause = error

        if (err.code === 'CALL_EXCEPTION') {
            enhancedError.details = 'Pool contract does not exist or is not a valid Uniswap V3 pool'
        } else if (err.code === 'NETWORK_ERROR' || err.code === 'SERVER_ERROR') {
            enhancedError.details = 'RPC endpoint is not responding or network issue'
        } else if (err.code === 'TIMEOUT') {
            enhancedError.details = 'RPC request timed out - endpoint may be overloaded'
        }

        throw enhancedError
    }
}

export async function fetchPosition(
    tokenId: bigint,
    positionManagerAddress: Address,
    chainId: number = HYPEREVM_CHAIN_ID,
): Promise<{
    token0: Address
    token1: Address
    fee: number
    tickLower: number
    tickUpper: number
    liquidity: bigint
    tokensOwed0: bigint
    tokensOwed1: bigint
}> {
    const client = getViemClient(chainId)

    const position = await client.readContract({
        address: positionManagerAddress,
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: 'positions',
        args: [tokenId],
    })

    return {
        token0: position[2],
        token1: position[3],
        fee: position[4],
        tickLower: position[5],
        tickUpper: position[6],
        liquidity: position[7],
        tokensOwed0: position[10],
        tokensOwed1: position[11],
    }
}

export async function getPoolAddress(
    token0: Address,
    token1: Address,
    fee: number,
    factoryAddress: Address,
    chainId: number = HYPEREVM_CHAIN_ID,
): Promise<Address> {
    const client = getViemClient(chainId)

    return await client.readContract({
        address: factoryAddress,
        abi: UNISWAP_V3_FACTORY_ABI,
        functionName: 'getPool',
        args: [token0, token1, fee],
    })
}

export async function getTokenMetadata(tokenAddress: Address, chainId: number = HYPEREVM_CHAIN_ID): Promise<{ symbol: string; decimals: number }> {
    const client = getViemClient(chainId)

    try {
        const [symbol, decimals] = await Promise.all([
            client.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'symbol',
            }),
            client.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'decimals',
            }),
        ])

        return { symbol, decimals }
    } catch {
        const knownHyperEvmTokens: Record<string, { symbol: string; decimals: number }> = {
            [WRAPPED_HYPE_ADDRESS.toLowerCase()]: { symbol: 'WHYPE', decimals: 18 },
            [USDT0_ADDRESS.toLowerCase()]: { symbol: 'USDT0', decimals: 6 },
        }

        return knownHyperEvmTokens[tokenAddress.toLowerCase()] || { symbol: 'UNKNOWN', decimals: 18 }
    }
}
