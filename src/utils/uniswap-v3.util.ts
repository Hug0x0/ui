const Q96 = 2n ** 96n

export function tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick)
}

export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
    const price = (Number(sqrtPriceX96) / Number(Q96)) ** 2
    return price
}

export function calculateTokenAmounts(
    liquidity: bigint,
    sqrtPriceX96: bigint,
    tickLower: number,
    tickUpper: number,
    currentTick: number,
): { amount0: bigint; amount1: bigint } {
    const sqrtRatioA = BigInt(Math.floor(Math.sqrt(1.0001 ** tickLower) * Number(Q96)))
    const sqrtRatioB = BigInt(Math.floor(Math.sqrt(1.0001 ** tickUpper) * Number(Q96)))

    let amount0 = 0n
    let amount1 = 0n

    if (currentTick < tickLower) {
        amount0 = (liquidity * Q96 * (sqrtRatioB - sqrtRatioA)) / (sqrtRatioB * sqrtRatioA)
        amount1 = 0n
    } else if (currentTick >= tickUpper) {
        amount0 = 0n
        amount1 = (liquidity * (sqrtRatioB - sqrtRatioA)) / Q96
    } else {
        amount0 = (liquidity * Q96 * (sqrtRatioB - sqrtPriceX96)) / (sqrtRatioB * sqrtPriceX96)
        amount1 = (liquidity * (sqrtPriceX96 - sqrtRatioA)) / Q96
    }

    return { amount0, amount1 }
}

export function calculateImpermanentLoss(
    currentPrice: number,
    entryPrice: number,
    tickLower: number,
    tickUpper: number,
    currentTick: number,
): number {
    if (currentTick < tickLower || currentTick >= tickUpper) {
        return 0
    }

    const priceRatio = currentPrice / entryPrice
    const il = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1
    return Math.abs(il) * 100
}
