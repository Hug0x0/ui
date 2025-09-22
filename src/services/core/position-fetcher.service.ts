import { encodeFunctionData, decodeFunctionResult, type Address } from 'viem'
import { getViemClient, HYPEREVM_CHAIN_ID } from '@/lib/viem'
import { getAllPositionManagers, getDexByPositionManager, HYPEREVM_PROTOCOLS } from '@/config/hyperevm-protocols.config'
import { NONFUNGIBLE_POSITION_MANAGER_ABI, UNISWAP_V3_POOL_ABI, UNISWAP_V3_FACTORY_ABI } from '@/contracts/uniswap-v3-abis'
import { MULTICALL3_ABI, MULTICALL3_ADDRESS } from '@/contracts/multicall-abi'
import { calculateTokenAmounts } from '@/utils/uniswap-v3.util'
import { keccak256, encodePacked, getAddress } from 'viem'
import type { PoolState, LPPosition, SpotBalance, PerpPosition, HyperEvmBalance } from '@/interfaces'
import { NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS, USDT0_ADDRESS } from '@/config/hyperevm-tokens.config'
import { priceAggregator } from '@/services/price/price-aggregator.service'
import { createLogger } from '@/utils'

const logger = createLogger('PositionFetcher')

export class PositionFetcher {
    private poolStateCache = new Map<string, PoolState>()
    private tokenPriceCache = new Map<string, number>()
    private fundingRatesCache = new Map<string, number>()
    private cacheTimestamp = 0
    private readonly CACHE_DURATION = 60000 // 60 seconds

    // Token addresses - Updated to correct addresses
    private readonly HYPE_ADDRESSES = [
        NATIVE_HYPE_ADDRESS, // Native HYPE
        WRAPPED_HYPE_ADDRESS, // WHYPE (Wrapped HYPE)
        '0x6871ee4e36ba76eb3990d4c33eec77cf308ec0ef', // Alternative WHYPE
        '0x20584eb8e2125c4cf568db5baf1646283b8eff02', // Alternative HYPE
    ]

    // Token decimals
    private readonly TOKEN_DECIMALS: Record<string, number> = {
        HYPE: 18,
        WHYPE: 18,
        USDT0: 6, // USDT0 has 6 decimals
        USDC: 6,
    }

    /**
     * Fetch all positions for an account (LP, Spot, Perp, HyperEVM)
     */
    async fetchAllPositions(account: string) {
        // Clear cache if expired
        if (Date.now() - this.cacheTimestamp > this.CACHE_DURATION) {
            this.poolStateCache.clear()
            this.tokenPriceCache.clear()
            this.fundingRatesCache.clear()
            this.cacheTimestamp = Date.now()
        }

        // Fetch all data types in parallel with timing
        const timings: Record<string, number> = {}

        const lpStart = Date.now()
        const lpPromise = this.fetchLPPositionsBatched(account).then((data) => {
            timings.lpFetch = Date.now() - lpStart
            return data
        })

        const spotStart = Date.now()
        const spotPromise = this.fetchSpotBalances(account).then((data) => {
            timings.spotFetch = Date.now() - spotStart
            return data
        })

        const perpStart = Date.now()
        const perpPromise = this.fetchPerpPositions(account).then((data) => {
            timings.perpFetch = Date.now() - perpStart
            return data
        })

        const evmStart = Date.now()
        const evmPromise = this.fetchHyperEvmBalances(account).then((data) => {
            timings.evmFetch = Date.now() - evmStart
            return data
        })

        const fundingStart = Date.now()
        const fundingPromise = this.fetchFundingRates().then((data) => {
            timings.fundingFetch = Date.now() - fundingStart
            return data
        })

        const [lpData, spotData, perpResult, hyperEvmData, fundingRates] = await Promise.all([
            lpPromise,
            spotPromise,
            perpPromise,
            evmPromise,
            fundingPromise,
        ])

        return {
            lpData,
            spotData,
            perpData: perpResult.positions,
            withdrawableUSDC: perpResult.withdrawableUSDC,
            hyperEvmData,
            fundingRates,
            timings,
        }
    }

    /**
     * Fetch LP positions using multicall batching
     */
    private async fetchLPPositionsBatched(account: string): Promise<LPPosition[]> {
        const client = getViemClient(HYPEREVM_CHAIN_ID)
        const positionManagers = getAllPositionManagers()

        // Step 1: Batch all balanceOf calls
        const balanceCalls = positionManagers.map((pm) => ({
            target: pm.address as Address,
            callData: encodeFunctionData({
                abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
                functionName: 'balanceOf',
                args: [account as Address],
            }),
        }))

        // Make multicall for all balanceOf calls
        const balanceResults = (await client.readContract({
            address: MULTICALL3_ADDRESS,
            abi: MULTICALL3_ABI,
            functionName: 'tryAggregate',
            args: [false, balanceCalls],
        })) as Array<{ success: boolean; returnData: `0x${string}` }>
        // Process balance results

        // Step 2: Build tokenId fetch calls for positions with balance > 0
        const tokenIdCalls: Array<{
            pmAddress: string
            protocol: string
            index: number
            call: { target: Address; callData: `0x${string}` }
        }> = []

        for (let i = 0; i < positionManagers.length; i++) {
            if (!balanceResults[i].success) {
                // Balance call failed, skip this protocol
                continue
            }

            const balance = decodeFunctionResult({
                abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
                functionName: 'balanceOf',
                data: balanceResults[i].returnData,
            }) as bigint

            // Process positions for this protocol

            if (balance > 0n) {
                for (let j = 0; j < Number(balance); j++) {
                    tokenIdCalls.push({
                        pmAddress: positionManagers[i].address,
                        protocol: positionManagers[i].protocol,
                        index: j,
                        call: {
                            target: positionManagers[i].address as Address,
                            callData: encodeFunctionData({
                                abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
                                functionName: 'tokenOfOwnerByIndex',
                                args: [account as Address, BigInt(j)],
                            }),
                        },
                    })
                }
            }
        }

        // Fetch position details for all token IDs
        if (tokenIdCalls.length === 0) return []

        // Step 3: Batch fetch all tokenIds
        const tokenIdResults = (await client.readContract({
            address: MULTICALL3_ADDRESS,
            abi: MULTICALL3_ABI,
            functionName: 'tryAggregate',
            args: [false, tokenIdCalls.map((c) => c.call)],
        })) as Array<{ success: boolean; returnData: `0x${string}` }>

        // Step 4: Build position data calls
        const positionCalls: Array<{
            tokenId: bigint
            pmAddress: string
            protocol: string
            call: { target: Address; callData: `0x${string}` }
        }> = []

        for (let i = 0; i < tokenIdResults.length; i++) {
            if (!tokenIdResults[i].success) continue

            const tokenId = decodeFunctionResult({
                abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
                functionName: 'tokenOfOwnerByIndex',
                data: tokenIdResults[i].returnData,
            }) as bigint

            positionCalls.push({
                tokenId,
                pmAddress: tokenIdCalls[i].pmAddress,
                protocol: tokenIdCalls[i].protocol,
                call: {
                    target: tokenIdCalls[i].pmAddress as Address,
                    callData: encodeFunctionData({
                        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
                        functionName: 'positions',
                        args: [tokenId],
                    }),
                },
            })
        }

        if (positionCalls.length === 0) return []

        // Step 5: Batch fetch all position data
        const positionResults = (await client.readContract({
            address: MULTICALL3_ADDRESS,
            abi: MULTICALL3_ABI,
            functionName: 'tryAggregate',
            args: [false, positionCalls.map((c) => c.call)],
        })) as Array<{ success: boolean; returnData: `0x${string}` }>

        // Step 6: Process positions and filter HYPE/USDT0
        const positions: Array<{
            tokenId: string
            pmAddress: string
            protocol: string
            token0: string
            token1: string
            fee: number
            tickLower: number
            tickUpper: number
            liquidity: bigint
            poolAddress: string
            tokensOwed0: bigint
            tokensOwed1: bigint
            feeGrowthInside0LastX128: bigint
            feeGrowthInside1LastX128: bigint
        }> = []

        const uniquePools = new Set<string>()

        for (let i = 0; i < positionResults.length; i++) {
            if (!positionResults[i].success) continue

            const positionData = decodeFunctionResult({
                abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
                functionName: 'positions',
                data: positionResults[i].returnData,
            })

            // Destructure position data from the contract response
            const [
                ,
                ,
                token0,
                token1,
                fee,
                tickLower,
                tickUpper,
                liquidity,
                feeGrowthInside0LastX128,
                feeGrowthInside1LastX128,
                tokensOwed0,
                tokensOwed1,
            ] = positionData as readonly [bigint, string, string, string, number, number, number, bigint, bigint, bigint, bigint, bigint]

            // For now, show all positions - we can filter later
            // if (!this.isHypeUsdt0Pair(token0 as string, token1 as string)) {
            //     continue
            // }

            // Get the correct factory for this DEX
            const dex = getDexByPositionManager(positionCalls[i].pmAddress) || positionCalls[i].protocol
            const dexConfig = HYPEREVM_PROTOCOLS[dex as keyof typeof HYPEREVM_PROTOCOLS]
            const factoryAddress = dexConfig?.dexConfig?.factoryAddress || '0xB1c0fa0B789320044A6F623cFe5eBda9562602E3' // Default to Hyperswap

            // Try to get pool address from factory first
            let poolAddress: string
            try {
                const client = getViemClient(HYPEREVM_CHAIN_ID)
                poolAddress = (await client.readContract({
                    address: factoryAddress as Address,
                    abi: UNISWAP_V3_FACTORY_ABI,
                    functionName: 'getPool',
                    args: [token0 as Address, token1 as Address, Number(fee)],
                })) as string

                if (!poolAddress || poolAddress === NATIVE_HYPE_ADDRESS) {
                    // No pool found in factory
                    continue
                }
                // Pool address found
            } catch {
                // Failed to get pool from factory, computing address
                // Fallback to computing pool address
                poolAddress = this.computePoolAddress(token0 as string, token1 as string, Number(fee), factoryAddress as string)
            }
            uniquePools.add(poolAddress)

            positions.push({
                tokenId: positionCalls[i].tokenId.toString(),
                pmAddress: positionCalls[i].pmAddress,
                protocol: positionCalls[i].protocol,
                token0: token0 as string,
                token1: token1 as string,
                fee: Number(fee),
                tickLower: Number(tickLower),
                tickUpper: Number(tickUpper),
                liquidity,
                poolAddress,
                tokensOwed0: tokensOwed0 || 0n,
                tokensOwed1: tokensOwed1 || 0n,
                feeGrowthInside0LastX128: feeGrowthInside0LastX128 || 0n,
                feeGrowthInside1LastX128: feeGrowthInside1LastX128 || 0n,
            })
        }

        // Step 7: Batch fetch pool states
        // Fetch pool states for all unique pools
        const poolStates = await this.fetchPoolStates(Array.from(uniquePools))
        // Pool states fetched

        // Step 8: Get token prices
        await this.fetchTokenPrices()

        // Step 9: Batch fetch tick data for all positions with liquidity
        const tickDataMap = new Map<
            string,
            { feeGrowthOutside0Lower: bigint; feeGrowthOutside1Lower: bigint; feeGrowthOutside0Upper: bigint; feeGrowthOutside1Upper: bigint }
        >()

        // Only fetch tick data for positions with liquidity and fee growth data available
        const positionsNeedingTickData = positions.filter(
            (pos) => pos.liquidity > 0n && poolStates.get(pos.poolAddress)?.feeGrowthGlobal0X128 !== undefined,
        )

        // Batch fetch tick data
        for (const pos of positionsNeedingTickData) {
            const key = `${pos.poolAddress}-${pos.tickLower}-${pos.tickUpper}`
            if (!tickDataMap.has(key)) {
                const tickData = await this.fetchTickData(pos.poolAddress, pos.tickLower, pos.tickUpper)
                if (tickData) {
                    tickDataMap.set(key, tickData)
                }
            }
        }

        // Step 10: Calculate values for each position
        const calculatedPositions = await Promise.all(
            positions.map(async (pos) => {
                const poolState = poolStates.get(pos.poolAddress)
                const dex = getDexByPositionManager(pos.pmAddress) || pos.protocol

                if (!poolState) {
                    // No pool state available for this position
                }

                // Determine if position is in range
                const inRange = poolState ? pos.tickLower <= poolState.tick && poolState.tick < pos.tickUpper : false

                // Determine token symbols first
                const token0Symbol = this.getTokenSymbol(pos.token0)
                const token1Symbol = this.getTokenSymbol(pos.token1)

                // Get correct decimals for each token
                const token0Decimals = this.TOKEN_DECIMALS[token0Symbol] || 18
                const token1Decimals = this.TOKEN_DECIMALS[token1Symbol] || 18

                // Calculate token amounts
                let token0Amount = 0
                let token1Amount = 0

                if (poolState) {
                    const amounts = calculateTokenAmounts(pos.liquidity, poolState.sqrtPriceX96, pos.tickLower, pos.tickUpper, poolState.tick)
                    // Apply correct decimals
                    token0Amount = Number(amounts.amount0) / 10 ** token0Decimals
                    token1Amount = Number(amounts.amount1) / 10 ** token1Decimals
                }

                // Get token prices
                const token0Price = await this.getTokenPrice(token0Symbol)
                const token1Price = await this.getTokenPrice(token1Symbol)

                // Calculate USD values
                const token0ValueUSD = token0Amount * token0Price
                const token1ValueUSD = token1Amount * token1Price
                const valueUSD = token0ValueUSD + token1ValueUSD

                // Calculate uncollected fees (only shows fees already collected from pool but not withdrawn)
                const fees0Uncollected = pos.tokensOwed0 > 0n ? Number(pos.tokensOwed0) / 10 ** token0Decimals : 0
                const fees1Uncollected = pos.tokensOwed1 > 0n ? Number(pos.tokensOwed1) / 10 ** token1Decimals : 0

                // Calculate unclaimed fees (fees earned but not yet collected from the pool)
                let unclaimedFees0 = 0
                let unclaimedFees1 = 0
                let unclaimedFeesUSD = 0

                if (poolState && pos.liquidity > 0n) {
                    const tickDataKey = `${pos.poolAddress}-${pos.tickLower}-${pos.tickUpper}`
                    const tickData = tickDataMap.get(tickDataKey)

                    if (tickData && poolState.feeGrowthGlobal0X128 !== undefined && poolState.feeGrowthGlobal1X128 !== undefined) {
                        // Calculate fee growth inside for token0
                        const feeGrowthInside0 = this.calculateFeeGrowthInside(
                            pos.tickLower,
                            pos.tickUpper,
                            poolState.tick,
                            poolState.feeGrowthGlobal0X128,
                            tickData.feeGrowthOutside0Lower,
                            tickData.feeGrowthOutside0Upper,
                        )

                        // Calculate fee growth inside for token1
                        const feeGrowthInside1 = this.calculateFeeGrowthInside(
                            pos.tickLower,
                            pos.tickUpper,
                            poolState.tick,
                            poolState.feeGrowthGlobal1X128,
                            tickData.feeGrowthOutside1Lower,
                            tickData.feeGrowthOutside1Upper,
                        )

                        // Calculate unclaimed fees
                        const unclaimedFees0Raw = this.calculateUnclaimedFees(pos.liquidity, feeGrowthInside0, pos.feeGrowthInside0LastX128)

                        const unclaimedFees1Raw = this.calculateUnclaimedFees(pos.liquidity, feeGrowthInside1, pos.feeGrowthInside1LastX128)

                        // Convert to human-readable values
                        unclaimedFees0 = Number(unclaimedFees0Raw) / 10 ** token0Decimals
                        unclaimedFees1 = Number(unclaimedFees1Raw) / 10 ** token1Decimals

                        // Calculate USD value
                        unclaimedFeesUSD = unclaimedFees0 * token0Price + unclaimedFees1 * token1Price
                    }
                }

                return {
                    id: pos.tokenId,
                    tokenId: pos.tokenId,
                    dex: dex.toUpperCase(),
                    pool: pos.poolAddress,
                    token0: pos.token0,
                    token1: pos.token1,
                    token0Symbol,
                    token1Symbol,
                    fee: pos.fee,
                    tickLower: pos.tickLower,
                    tickUpper: pos.tickUpper,
                    tickCurrent: poolState?.tick,
                    liquidity: pos.liquidity.toString(),
                    sqrtPriceX96: poolState?.sqrtPriceX96?.toString(),
                    inRange,
                    valueUSD,
                    token0Amount,
                    token1Amount,
                    token0ValueUSD,
                    token1ValueUSD,
                    fees0Uncollected: fees0Uncollected > 0 ? fees0Uncollected : undefined,
                    fees1Uncollected: fees1Uncollected > 0 ? fees1Uncollected : undefined,
                    unclaimedFees0: unclaimedFees0 > 0 ? unclaimedFees0 : undefined,
                    unclaimedFees1: unclaimedFees1 > 0 ? unclaimedFees1 : undefined,
                    unclaimedFeesUSD: unclaimedFeesUSD > 0 ? unclaimedFeesUSD : undefined,
                    isClosed: pos.liquidity === 0n,
                }
            }),
        )

        return calculatedPositions
    }

    /**
     * Calculate fee growth inside a position range
     */
    private calculateFeeGrowthInside(
        tickLower: number,
        tickUpper: number,
        tickCurrent: number,
        feeGrowthGlobal: bigint,
        feeGrowthOutsideLower: bigint,
        feeGrowthOutsideUpper: bigint,
    ): bigint {
        let feeGrowthBelow: bigint
        let feeGrowthAbove: bigint

        // Calculate fee growth below
        if (tickCurrent >= tickLower) {
            feeGrowthBelow = feeGrowthOutsideLower
        } else {
            feeGrowthBelow = feeGrowthGlobal - feeGrowthOutsideLower
        }

        // Calculate fee growth above
        if (tickCurrent < tickUpper) {
            feeGrowthAbove = feeGrowthOutsideUpper
        } else {
            feeGrowthAbove = feeGrowthGlobal - feeGrowthOutsideUpper
        }

        // Calculate fee growth inside
        return feeGrowthGlobal - feeGrowthBelow - feeGrowthAbove
    }

    /**
     * Calculate unclaimed fees for a position
     */
    private calculateUnclaimedFees(liquidity: bigint, feeGrowthInside: bigint, feeGrowthInsideLast: bigint): bigint {
        // Handle underflow for fee growth
        const feeGrowthDelta =
            feeGrowthInside >= feeGrowthInsideLast
                ? feeGrowthInside - feeGrowthInsideLast
                : BigInt(2) ** BigInt(256) - feeGrowthInsideLast + feeGrowthInside

        // Calculate unclaimed fees: (feeGrowthDelta * liquidity) / 2^128
        return (feeGrowthDelta * liquidity) / BigInt(2) ** BigInt(128)
    }

    /**
     * Fetch tick data for fee calculations
     */
    private async fetchTickData(
        poolAddress: string,
        tickLower: number,
        tickUpper: number,
    ): Promise<{
        feeGrowthOutside0Lower: bigint
        feeGrowthOutside1Lower: bigint
        feeGrowthOutside0Upper: bigint
        feeGrowthOutside1Upper: bigint
    } | null> {
        try {
            const client = getViemClient(HYPEREVM_CHAIN_ID)

            // Fetch tick data for both tickLower and tickUpper
            const tickCalls = [
                {
                    target: poolAddress as Address,
                    callData: encodeFunctionData({
                        abi: UNISWAP_V3_POOL_ABI,
                        functionName: 'ticks',
                        args: [tickLower],
                    }),
                },
                {
                    target: poolAddress as Address,
                    callData: encodeFunctionData({
                        abi: UNISWAP_V3_POOL_ABI,
                        functionName: 'ticks',
                        args: [tickUpper],
                    }),
                },
            ]

            const results = (await client.readContract({
                address: MULTICALL3_ADDRESS,
                abi: MULTICALL3_ABI,
                functionName: 'tryAggregate',
                args: [false, tickCalls],
            })) as Array<{ success: boolean; returnData: `0x${string}` }>

            if (results[0].success && results[1].success) {
                const tickLowerData = decodeFunctionResult({
                    abi: UNISWAP_V3_POOL_ABI,
                    functionName: 'ticks',
                    data: results[0].returnData,
                }) as [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean]

                const tickUpperData = decodeFunctionResult({
                    abi: UNISWAP_V3_POOL_ABI,
                    functionName: 'ticks',
                    data: results[1].returnData,
                }) as [bigint, bigint, bigint, bigint, bigint, bigint, number, boolean]

                return {
                    feeGrowthOutside0Lower: tickLowerData[2],
                    feeGrowthOutside1Lower: tickLowerData[3],
                    feeGrowthOutside0Upper: tickUpperData[2],
                    feeGrowthOutside1Upper: tickUpperData[3],
                }
            }
        } catch {
            // Failed to fetch tick data
        }
        return null
    }

    /**
     * Fetch pool states using multicall
     */
    private async fetchPoolStates(poolAddresses: string[]): Promise<Map<string, PoolState>> {
        if (poolAddresses.length === 0) return new Map()

        const client = getViemClient(HYPEREVM_CHAIN_ID)
        const states = new Map<string, PoolState>()

        // Check cache first
        const uncachedPools = poolAddresses.filter((addr) => !this.poolStateCache.has(addr))

        if (uncachedPools.length > 0) {
            // Build combined multicall for slot0, liquidity, and fee growth in a single batch
            const poolCalls: Array<{ target: Address; callData: `0x${string}` }> = []

            // Add calls for each pool: slot0, liquidity, feeGrowthGlobal0X128, feeGrowthGlobal1X128
            for (const poolAddress of uncachedPools) {
                // slot0 call
                poolCalls.push({
                    target: poolAddress as Address,
                    callData: encodeFunctionData({
                        abi: UNISWAP_V3_POOL_ABI,
                        functionName: 'slot0',
                    }),
                })
                // liquidity call
                poolCalls.push({
                    target: poolAddress as Address,
                    callData: encodeFunctionData({
                        abi: UNISWAP_V3_POOL_ABI,
                        functionName: 'liquidity',
                    }),
                })
                // feeGrowthGlobal0X128 call
                poolCalls.push({
                    target: poolAddress as Address,
                    callData: encodeFunctionData({
                        abi: UNISWAP_V3_POOL_ABI,
                        functionName: 'feeGrowthGlobal0X128',
                    }),
                })
                // feeGrowthGlobal1X128 call
                poolCalls.push({
                    target: poolAddress as Address,
                    callData: encodeFunctionData({
                        abi: UNISWAP_V3_POOL_ABI,
                        functionName: 'feeGrowthGlobal1X128',
                    }),
                })
            }

            // Single multicall for all pool state data
            const poolResults = (await client.readContract({
                address: MULTICALL3_ADDRESS,
                abi: MULTICALL3_ABI,
                functionName: 'tryAggregate',
                args: [false, poolCalls],
            })) as Array<{ success: boolean; returnData: `0x${string}` }>

            // Process results (slot0, liquidity, feeGrowth0, feeGrowth1 are grouped per pool)
            for (let i = 0; i < uncachedPools.length; i++) {
                const slot0Index = i * 4
                const liquidityIndex = i * 4 + 1
                const feeGrowth0Index = i * 4 + 2
                const feeGrowth1Index = i * 4 + 3

                if (poolResults[slot0Index].success && poolResults[liquidityIndex].success) {
                    // Check for empty data
                    if (
                        !poolResults[slot0Index].returnData ||
                        poolResults[slot0Index].returnData === '0x' ||
                        !poolResults[liquidityIndex].returnData ||
                        poolResults[liquidityIndex].returnData === '0x'
                    ) {
                        // Pool returned empty data - may not exist
                        continue
                    }

                    try {
                        const slot0 = decodeFunctionResult({
                            abi: UNISWAP_V3_POOL_ABI,
                            functionName: 'slot0',
                            data: poolResults[slot0Index].returnData,
                        }) as [bigint, number, number, number, number, number, boolean]

                        const liquidity = decodeFunctionResult({
                            abi: UNISWAP_V3_POOL_ABI,
                            functionName: 'liquidity',
                            data: poolResults[liquidityIndex].returnData,
                        }) as bigint

                        // Decode fee growth values if available
                        let feeGrowthGlobal0X128: bigint | undefined
                        let feeGrowthGlobal1X128: bigint | undefined

                        if (poolResults[feeGrowth0Index]?.success && poolResults[feeGrowth0Index].returnData) {
                            try {
                                feeGrowthGlobal0X128 = decodeFunctionResult({
                                    abi: UNISWAP_V3_POOL_ABI,
                                    functionName: 'feeGrowthGlobal0X128',
                                    data: poolResults[feeGrowth0Index].returnData,
                                }) as bigint
                            } catch {
                                // Failed to decode fee growth
                            }
                        }

                        if (poolResults[feeGrowth1Index]?.success && poolResults[feeGrowth1Index].returnData) {
                            try {
                                feeGrowthGlobal1X128 = decodeFunctionResult({
                                    abi: UNISWAP_V3_POOL_ABI,
                                    functionName: 'feeGrowthGlobal1X128',
                                    data: poolResults[feeGrowth1Index].returnData,
                                }) as bigint
                            } catch {
                                // Failed to decode fee growth
                            }
                        }

                        const state = {
                            sqrtPriceX96: slot0[0],
                            tick: slot0[1],
                            liquidity,
                            feeGrowthGlobal0X128,
                            feeGrowthGlobal1X128,
                        }

                        this.poolStateCache.set(uncachedPools[i], state)
                        states.set(uncachedPools[i], state)
                        // Pool state cached
                    } catch {
                        // Failed to decode pool state
                    }
                } else {
                    // Pool calls failed
                }
            }
        }

        // Add cached pools
        for (const poolAddress of poolAddresses) {
            const cached = this.poolStateCache.get(poolAddress)
            if (cached) {
                states.set(poolAddress, cached)
            }
        }

        return states
    }

    /**
     * Fetch spot balances from HyperCore
     */
    private async fetchSpotBalances(account: string): Promise<SpotBalance[]> {
        try {
            const response = await fetch(`https://api.hyperliquid.xyz/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'spotClearinghouseState',
                    user: account,
                }),
            })

            const data = await response.json()
            const balances = data.balances || []

            // Get token prices
            await this.fetchTokenPrices()

            return balances
                .filter((b: { total: string }) => parseFloat(b.total) > 0)
                .filter((b: { coin: string }) => ['HYPE', 'USDT0', 'USDC'].includes(b.coin)) // Only track HYPE, USDT0, USDC
                .map((balance: { coin: string; total: string }) => {
                    const { coin, total } = balance
                    const totalBalance = parseFloat(total)

                    // Get price from cache or use defaults for stables
                    let price = this.tokenPriceCache.get(coin) || 0
                    if (coin === 'USDC' || coin === 'USDT0') {
                        price = 1
                    }

                    return {
                        id: `${account}-${coin}`,
                        asset: coin,
                        balance: totalBalance,
                        valueUSD: totalBalance * price,
                    }
                })
        } catch (error) {
            console.error('Error fetching spot balances:', error)
            return []
        }
    }

    /**
     * Fetch perpetual positions from HyperCore
     */
    private async fetchPerpPositions(account: string): Promise<{ positions: PerpPosition[]; withdrawableUSDC: number }> {
        try {
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'clearinghouseState',
                    user: account,
                }),
            })

            const data = await response.json()
            const assetPositions = data.assetPositions || []
            const withdrawableUSDC = parseFloat(data.withdrawable || '0')

            // Also fetch current mark prices for accurate calculations
            const markPricesResponse = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'allMids',
                }),
            })

            const markPricesData = await markPricesResponse.json()
            const markPrices: Record<string, number> = {}

            // Build mark price map
            if (markPricesData) {
                for (const [coin, price] of Object.entries(markPricesData)) {
                    markPrices[coin] = parseFloat(price as string)
                }
            }

            const positions = assetPositions
                .filter((pos: { position: { szi: string } }) => {
                    const szi = parseFloat(pos.position?.szi || '0')
                    return Math.abs(szi) > 0.00001
                })
                .map(
                    (pos: {
                        position: {
                            coin: string
                            szi: string
                            entryPx: string
                            markPx: string
                            cumFunding: { allTime: string; total: string }
                            marginUsed: string
                        }
                    }) => {
                        const { position } = pos
                        const coin = position.coin
                        const szi = parseFloat(position.szi)
                        const entryPx = parseFloat(position.entryPx || '0')

                        // Use mark price from allMids API or fallback to position data
                        const markPx = markPrices[coin] || parseFloat(position.markPx || '0')

                        // Calculate unrealized PnL manually if needed
                        const unrealizedPnl = szi * (markPx - entryPx)

                        const fundingPaid = parseFloat(position.cumFunding?.allTime || position.cumFunding?.total || '0')
                        const marginUsed = parseFloat(position.marginUsed || Math.abs((szi * entryPx) / 5).toString()) // Estimate 5x leverage if not provided
                        const notionalValue = Math.abs(szi * markPx)

                        return {
                            id: `${account}-perp-${coin}`,
                            asset: coin,
                            sizeUnits: szi,
                            entryPriceUSD: entryPx,
                            markPriceUSD: markPx,
                            notionalValueUSD: notionalValue,
                            unrealizedPnlUSD: unrealizedPnl,
                            fundingPaidUSD: fundingPaid,
                            marginUsedUSD: marginUsed,
                        }
                    },
                )

            return { positions, withdrawableUSDC }
        } catch (error) {
            console.error('Error fetching perp positions:', error)
            return { positions: [], withdrawableUSDC: 0 }
        }
    }

    /**
     * Fetch current funding rates from HyperCore
     */
    private async fetchFundingRates(): Promise<Record<string, number>> {
        try {
            // Check cache first (use same 60-second TTL)
            if (this.fundingRatesCache.size > 0 && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
                return Object.fromEntries(this.fundingRatesCache)
            }

            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'metaAndAssetCtxs',
                }),
            })

            const data = await response.json()
            const fundingRates: Record<string, number> = {}

            // metaAndAssetCtxs returns [meta, assetCtxs] tuple
            if (Array.isArray(data) && data.length >= 2) {
                const [meta, assetCtxs] = data

                if (meta?.universe && Array.isArray(assetCtxs)) {
                    meta.universe.forEach((asset: { name: string }, index: number) => {
                        if (asset.name && assetCtxs[index]) {
                            const ctx = assetCtxs[index]
                            // Use funding rate from context
                            if (ctx.funding) {
                                // Hyperliquid API returns the HOURLY funding rate as a decimal fraction
                                // e.g., 0.0000460814 = 0.00460814% per hour
                                const hourlyFunding = parseFloat(ctx.funding)

                                // Convert to annualized APR percentage
                                // Formula: hourly_rate × 24 hours × 365 days × 100
                                const annualizedAPR = hourlyFunding * 24 * 365 * 100

                                // Store as-is (positive = longs pay shorts, negative = shorts pay longs)
                                fundingRates[asset.name] = annualizedAPR
                                this.fundingRatesCache.set(asset.name, annualizedAPR)
                            }
                        }
                    })
                }
            }

            return fundingRates
        } catch (error) {
            console.error('Error fetching funding rates:', error)
            return {}
        }
    }

    /**
     * Fetch token prices from Hyperliquid API
     */
    private async fetchTokenPrices(): Promise<void> {
        // Skip if recently fetched
        if (this.tokenPriceCache.size > 0 && Date.now() - this.cacheTimestamp < 60000) {
            return
        }

        try {
            // Fetch spot prices from Hyperliquid
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'spotMeta',
                }),
            })

            const data = await response.json()
            const tokens = data.tokens || []

            // Parse prices from API response
            for (const token of tokens) {
                const { name, markPx } = token
                if (name && markPx) {
                    const price = parseFloat(markPx)
                    this.tokenPriceCache.set(name, price)

                    // Special handling for HYPE/WHYPE
                    if (name === 'HYPE') {
                        this.tokenPriceCache.set('WHYPE', price) // WHYPE has same price as HYPE
                    }
                }
            }

            // Set stable coin prices
            this.tokenPriceCache.set('USDT0', 1)
            this.tokenPriceCache.set('USDC', 1)

            // Always ensure HYPE price is fetched
            if (!this.tokenPriceCache.has('HYPE') || this.tokenPriceCache.get('HYPE') === 0) {
                logger.debug('Fetching HYPE price from aggregator...')
                const hypePrice = await priceAggregator.getTokenPrice('HYPE')
                if (hypePrice !== null && hypePrice > 0) {
                    logger.debug(`HYPE price fetched: $${hypePrice}`)
                    this.tokenPriceCache.set('HYPE', hypePrice)
                    this.tokenPriceCache.set('WHYPE', hypePrice)
                } else {
                    logger.warn('Failed to fetch HYPE price from aggregator')
                }
            }
            if (!this.tokenPriceCache.has('BTC')) {
                this.tokenPriceCache.set('BTC', 100000)
            }
            if (!this.tokenPriceCache.has('ETH')) {
                this.tokenPriceCache.set('ETH', 3800)
            }

            // Token prices fetched and cached
        } catch (error) {
            logger.error('Error fetching token prices:', error)
            // Use price aggregator for fallback prices
            const fallbackPrices = await priceAggregator.getTokenPrices(['HYPE', 'USDT0', 'USDC', 'BTC'])
            for (const [symbol, price] of fallbackPrices) {
                if (price !== null) {
                    this.tokenPriceCache.set(symbol, price)
                    // Also set WHYPE price same as HYPE
                    if (symbol === 'HYPE') {
                        this.tokenPriceCache.set('WHYPE', price)
                    }
                }
            }
            // Set stable coin prices to 1 if not found
            if (!this.tokenPriceCache.has('USDT0')) this.tokenPriceCache.set('USDT0', 1)
            if (!this.tokenPriceCache.has('USDC')) this.tokenPriceCache.set('USDC', 1)
            this.tokenPriceCache.set('ETH', 3800)
        }
    }

    /**
     * Compute pool address deterministically
     */
    private computePoolAddress(token0: string, token1: string, fee: number, factory: string): string {
        // Sort tokens
        const [tokenA, tokenB] = token0.toLowerCase() < token1.toLowerCase() ? [token0, token1] : [token1, token0]

        // Pool init code hashes per DEX factory
        const INIT_CODE_HASHES: Record<string, string> = {
            '0xb1c0fa0b789320044a6f623cfe5ebda9562602e3': '0xe3572921be1688dba92df30c6781b8770499ff274d20ae9b325f4242634774fb', // Hyperswap (from config)
            '0xff7b3e8c00e57ea31477c32a5b52a58eea47b072': '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54', // ProjectX (standard Uniswap V3)
            '0x2dc0ec0f0db8baf250eccf268d7dfbf59346e5e': '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54', // Hybra
        }

        const factoryLower = factory.toLowerCase()
        const initCodeHash = INIT_CODE_HASHES[factoryLower] || '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54' // Default to standard Uniswap V3 hash
        // Using init code hash for pool address computation

        const salt = keccak256(encodePacked(['address', 'address', 'uint24'], [getAddress(tokenA), getAddress(tokenB), fee]))

        const poolAddress = getAddress(
            `0x${keccak256(
                encodePacked(['bytes1', 'address', 'bytes32', 'bytes32'], ['0xff', getAddress(factory), salt, initCodeHash as `0x${string}`]),
            ).slice(26)}`,
        )

        // Pool address computed
        return poolAddress
    }

    /**
     * Get token symbol from address
     */
    private getTokenSymbol(address: string): string {
        const addr = address.toLowerCase()
        // Check USDT0 first
        if (addr === USDT0_ADDRESS.toLowerCase()) return 'USDT0'
        // Check HYPE addresses
        if (addr === WRAPPED_HYPE_ADDRESS.toLowerCase()) return 'WHYPE'
        if (this.HYPE_ADDRESSES.map((a) => a.toLowerCase()).includes(addr)) return 'HYPE'
        // Fallback
        return addr.slice(0, 6).toUpperCase()
    }

    /**
     * Get token price in USD
     */
    public async getTokenPrice(symbol: string): Promise<number> {
        // Use cached prices if available
        const cached = this.tokenPriceCache.get(symbol)
        if (cached !== undefined) return cached

        // Default prices for stablecoins
        if (symbol === 'USDT0' || symbol === 'USDT' || symbol === 'USDC' || symbol === 'USD₮0') {
            this.tokenPriceCache.set(symbol, 1.0)
            return 1.0
        }

        // For HYPE/WHYPE, try to fetch from price aggregator
        if (symbol === 'HYPE' || symbol === 'WHYPE') {
            logger.debug(`Fetching ${symbol} price from aggregator...`)
            const price = await priceAggregator.getTokenPrice(symbol === 'WHYPE' ? 'HYPE' : symbol)
            if (price !== null && price > 0) {
                this.tokenPriceCache.set(symbol, price)
                if (symbol === 'HYPE') {
                    this.tokenPriceCache.set('WHYPE', price)
                }
                return price
            }
        }

        // Try to fetch all prices if not cached
        await this.fetchTokenPrices()

        // Check cache again after fetching
        const newCached = this.tokenPriceCache.get(symbol)
        if (newCached !== undefined) return newCached

        // If still no price found, return 0
        logger.warn(`No price found for token: ${symbol}`)
        return 0
    }

    /**
     * Fetch HyperEVM wallet balances
     */
    private async fetchHyperEvmBalances(account: string): Promise<HyperEvmBalance[]> {
        try {
            const client = getViemClient(HYPEREVM_CHAIN_ID)

            // Get native HYPE balance
            const nativeBalance = await client.getBalance({ address: account as Address })

            // Common token addresses on HyperEVM - Only track HYPE, USDT0, USDC
            const tokens = [
                { address: WRAPPED_HYPE_ADDRESS, symbol: 'WHYPE', decimals: 18 },
                { address: USDT0_ADDRESS, symbol: 'USDT0', decimals: 6 },
                // { address: '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70', symbol: 'USDC', decimals: 18 },
            ]

            // Fetch token balances using multicall
            const balanceCalls = tokens.map((token) => ({
                target: token.address as Address,
                callData: encodeFunctionData({
                    abi: [
                        {
                            inputs: [{ name: 'account', type: 'address' }],
                            name: 'balanceOf',
                            outputs: [{ name: '', type: 'uint256' }],
                            stateMutability: 'view',
                            type: 'function',
                        },
                    ],
                    functionName: 'balanceOf',
                    args: [account as Address],
                }),
            }))

            const balanceResults = (await client.readContract({
                address: MULTICALL3_ADDRESS,
                abi: MULTICALL3_ABI,
                functionName: 'tryAggregate',
                args: [false, balanceCalls],
            })) as Array<{ success: boolean; returnData: `0x${string}` }>

            // Get token prices
            await this.fetchTokenPrices()

            const balances: HyperEvmBalance[] = []

            // Add native HYPE balance
            const hypePrice = this.tokenPriceCache.get('HYPE') || (await priceAggregator.getTokenPrice('HYPE')) || 0
            const nativeHypeAmount = Number(nativeBalance) / 10 ** 18
            if (nativeHypeAmount > 0.0001) {
                balances.push({
                    id: `${account}-hyperevm-HYPE`,
                    asset: 'HYPE',
                    symbol: 'HYPE',
                    address: NATIVE_HYPE_ADDRESS,
                    balance: nativeBalance.toString(),
                    decimals: 18,
                    valueUSD: nativeHypeAmount * hypePrice,
                })
            }

            // Process token balances
            for (let i = 0; i < tokens.length; i++) {
                if (!balanceResults[i].success) continue

                const balance = decodeFunctionResult({
                    abi: [
                        {
                            inputs: [{ name: 'account', type: 'address' }],
                            name: 'balanceOf',
                            outputs: [{ name: '', type: 'uint256' }],
                            stateMutability: 'view',
                            type: 'function',
                        },
                    ],
                    functionName: 'balanceOf',
                    data: balanceResults[i].returnData,
                }) as bigint

                if (balance > 0n) {
                    const token = tokens[i]
                    const tokenAmount = Number(balance) / 10 ** token.decimals
                    const tokenPrice = await this.getTokenPrice(token.symbol)

                    // Skip if balance is too small
                    if (tokenAmount > 0.0001) {
                        balances.push({
                            id: `${account}-hyperevm-${token.symbol}`,
                            asset: token.symbol,
                            symbol: token.symbol,
                            address: token.address,
                            balance: balance.toString(),
                            decimals: token.decimals,
                            valueUSD: tokenAmount * tokenPrice,
                        })
                    }
                }
            }

            return balances
        } catch (error) {
            console.error('Error fetching HyperEVM balances:', error)
            return []
        }
    }

    // Removed unused isHypeUsdt0Pair function - we're now showing all positions
}

// Export singleton instance
export const positionFetcher = new PositionFetcher()
