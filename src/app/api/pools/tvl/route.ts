import { NextResponse } from 'next/server'
import { getViemClient, HYPEREVM_CHAIN_ID } from '@/lib/viem'
import { getDexProtocols } from '@/config/hyperevm-protocols.config'
import { getPoolAddress, fetchPoolState } from '@/services/core/uniswap-pool.service'
import { getTokenPrice } from '@/services/core/token-prices.service'
import type { Address } from 'viem'
import { ERC20_ABI } from '@/contracts/uniswap-v3-abis'
import { NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS, USDT0_ADDRESS } from '@/config/hyperevm-tokens.config'

// Token addresses on HyperEVM
const WHYPE_ADDRESS = WRAPPED_HYPE_ADDRESS

// Common fee tiers
const FEE_TIERS = [100, 500, 2000, 2500, 3000, 10000]

interface PoolTVL {
    dex: string
    poolAddress: string
    fee: number
    feeLabel: string
    liquidity: string
    tvlUSD: number
    token0Balance: number
    token1Balance: number
    sqrtPriceX96: string
    tick: number
    isActive: boolean
}

interface DexTVL {
    dex: string
    totalTVL: number
    pools: PoolTVL[]
}

/**
 * Calculate TVL for a pool given its state
 */
async function calculatePoolTVL(
    poolAddress: Address,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    poolState: any,
    prices: { HYPE: number; USDT0: number },
): Promise<{ token0Balance: number; token1Balance: number; tvlUSD: number }> {
    const client = getViemClient(HYPEREVM_CHAIN_ID)

    try {
        // Get token balances directly from the pool
        const [token0Balance, token1Balance] = await Promise.all([
            client.readContract({
                address: poolState.token0,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [poolAddress],
            }),
            client.readContract({
                address: poolState.token1,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [poolAddress],
            }),
        ])

        // Convert to human-readable values (assuming 18 decimals for WHYPE, 6 for USDT0)
        const token0Decimals = poolState.token0.toLowerCase() === WHYPE_ADDRESS.toLowerCase() ? 18 : 6
        const token1Decimals = poolState.token1.toLowerCase() === WHYPE_ADDRESS.toLowerCase() ? 18 : 6

        const token0Amount = Number(token0Balance) / 10 ** token0Decimals
        const token1Amount = Number(token1Balance) / 10 ** token1Decimals

        // Calculate USD values
        const token0USD = poolState.token0.toLowerCase() === WHYPE_ADDRESS.toLowerCase() ? token0Amount * prices.HYPE : token0Amount * prices.USDT0

        const token1USD = poolState.token1.toLowerCase() === WHYPE_ADDRESS.toLowerCase() ? token1Amount * prices.HYPE : token1Amount * prices.USDT0

        return {
            token0Balance: token0Amount,
            token1Balance: token1Amount,
            tvlUSD: token0USD + token1USD,
        }
    } catch (error) {
        console.error(`Error calculating TVL for pool ${poolAddress}:`, error)
        return { token0Balance: 0, token1Balance: 0, tvlUSD: 0 }
    }
}

export async function GET() {
    try {
        // Get current token prices
        const [hypePrice, usdt0Price] = await Promise.all([
            getTokenPrice(WHYPE_ADDRESS, HYPEREVM_CHAIN_ID),
            getTokenPrice(USDT0_ADDRESS, HYPEREVM_CHAIN_ID),
        ])

        const prices = {
            HYPE: hypePrice,
            USDT0: usdt0Price,
        }

        const dexTVLs: DexTVL[] = []

        // Iterate through each DEX
        for (const dexConfig of getDexProtocols()) {
            if (!dexConfig.dexConfig?.contracts?.factory || !dexConfig.dexConfig?.isUniswapV3Fork) {
                continue // Skip non-V3 or unconfigured DEXs
            }

            const pools: PoolTVL[] = []

            // Check each fee tier
            for (const fee of FEE_TIERS) {
                try {
                    // Get pool address - use default Uniswap V3 init code hash
                    const poolAddress = await getPoolAddress(
                        WHYPE_ADDRESS,
                        USDT0_ADDRESS,
                        fee,
                        dexConfig.dexConfig.contracts.factory,
                        undefined, // Will use default Uniswap V3 init code hash
                    )

                    // Skip if pool address is zero (pool doesn't exist)
                    if (poolAddress === NATIVE_HYPE_ADDRESS) {
                        continue
                    }

                    // Fetch pool state
                    const poolState = await fetchPoolState(poolAddress, HYPEREVM_CHAIN_ID)

                    // Skip if pool has no liquidity
                    if (poolState.liquidity === 0n) {
                        continue
                    }

                    // Calculate TVL
                    const { token0Balance, token1Balance, tvlUSD } = await calculatePoolTVL(poolAddress, poolState, prices)

                    pools.push({
                        dex: dexConfig.protocol,
                        poolAddress,
                        fee,
                        feeLabel: `${(fee / 10000).toFixed(2)}%`,
                        liquidity: poolState.liquidity.toString(),
                        tvlUSD,
                        token0Balance,
                        token1Balance,
                        sqrtPriceX96: poolState.sqrtPriceX96.toString(),
                        tick: poolState.tick,
                        isActive: tvlUSD > 1000, // Consider active if TVL > $1000
                    })
                } catch (error) {
                    // Pool doesn't exist for this fee tier, skip
                    console.error(`[Pool TVL] Pool doesn't exist for this fee tier`, error)
                    continue
                }
            }

            // Calculate total TVL for this DEX
            const totalTVL = pools.reduce((sum, pool) => sum + pool.tvlUSD, 0)

            if (pools.length > 0) {
                dexTVLs.push({
                    dex: dexConfig.protocol,
                    totalTVL,
                    pools: pools.sort((a, b) => b.tvlUSD - a.tvlUSD), // Sort by TVL descending
                })
            }
        }

        // Sort DEXs by total TVL
        dexTVLs.sort((a, b) => b.totalTVL - a.totalTVL)

        // Calculate grand total
        const grandTotalTVL = dexTVLs.reduce((sum, dex) => sum + dex.totalTVL, 0)

        return NextResponse.json(
            {
                success: true,
                timestamp: Date.now(),
                prices,
                grandTotalTVL,
                dexes: dexTVLs,
            },
            {
                headers: {
                    'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
                },
            },
        )
    } catch (error) {
        console.error('Error fetching pool TVL data:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch pool TVL data',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        )
    }
}
