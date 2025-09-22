#!/usr/bin/env tsx

import { HYPEREVM_CHAIN_ID } from '@/lib/viem'
import { getTokenPrice } from '@/services/core/token-prices.service'
import { NATIVE_HYPE_ADDRESS, WRAPPED_HYPE_ADDRESS, USDT0_ADDRESS } from '@/config/hyperevm-tokens.config'

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
}

// Test tokens
const TEST_TOKENS = {
    HYPE: NATIVE_HYPE_ADDRESS,
    WHYPE: WRAPPED_HYPE_ADDRESS,
    USDT0: USDT0_ADDRESS,
    feUSD: '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70',
    UNKNOWN: '0x1234567890123456789012345678901234567890',
}

async function testTokenPrice(tokenName: string, address: string, chainId: number, expectedBehavior: string) {
    console.log(`\n${colors.cyan}Testing ${tokenName}:${colors.reset}`)
    console.log(`  Address: ${address}`)
    console.log(`  Chain ID: ${chainId}`)
    console.log(`  Expected: ${expectedBehavior}`)

    const startTime = Date.now()
    try {
        const price = await getTokenPrice(address as `0x${string}`, chainId)
        const duration = Date.now() - startTime

        if (price > 0) {
            console.log(`  ${colors.green}✓${colors.reset} Price: $${price.toFixed(4)}`)
            console.log(`  ${colors.green}✓${colors.reset} Response time: ${duration}ms`)

            // For HYPE tokens, indicate if we got oracle price vs spot price
            if (tokenName.includes('HYPE') && chainId === HYPEREVM_CHAIN_ID) {
                console.log(`  ${colors.green}ℹ${colors.reset} Source: Oracle/Perpetuals API`)
            }
        } else if (price === 0 && (chainId !== HYPEREVM_CHAIN_ID || tokenName === 'UNKNOWN')) {
            console.log(`  ${colors.green}✓${colors.reset} Correctly returned 0 for unsupported token/chain`)
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Unexpected price: ${price}`)
        }
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error: ${error}`)
    }
}

async function testCaching() {
    console.log(`\n${colors.magenta}Testing Cache Behavior:${colors.reset}`)

    // First call - should hit API
    console.log('  First call (should fetch from API)...')
    const start1 = Date.now()
    const price1 = await getTokenPrice(TEST_TOKENS.HYPE as `0x${string}`, HYPEREVM_CHAIN_ID)
    const duration1 = Date.now() - start1
    console.log(`    Price: $${price1.toFixed(4)}, Duration: ${duration1}ms`)

    // Second call immediately - should use cache
    console.log('  Second call (should use cache)...')
    const start2 = Date.now()
    const price2 = await getTokenPrice(TEST_TOKENS.HYPE as `0x${string}`, HYPEREVM_CHAIN_ID)
    const duration2 = Date.now() - start2
    console.log(`    Price: $${price2.toFixed(4)}, Duration: ${duration2}ms`)

    if (duration2 < duration1 / 2) {
        console.log(`  ${colors.green}✓${colors.reset} Cache is working (${duration2}ms < ${duration1}ms)`)
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} Cache might not be working effectively`)
    }

    // Wait for cache to expire (10 seconds)
    console.log('  Waiting 11 seconds for cache to expire...')
    await new Promise((resolve) => setTimeout(resolve, 11000))

    // Third call - should hit API again
    console.log('  Third call (after cache expiry)...')
    const start3 = Date.now()
    const price3 = await getTokenPrice(TEST_TOKENS.HYPE as `0x${string}`, HYPEREVM_CHAIN_ID)
    const duration3 = Date.now() - start3
    console.log(`    Price: $${price3.toFixed(4)}, Duration: ${duration3}ms`)

    if (duration3 > duration2 * 2) {
        console.log(`  ${colors.green}✓${colors.reset} Cache expiry working (fetched fresh data)`)
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} Cache expiry might not be working`)
    }
}

async function testBatchRequests() {
    console.log(`\n${colors.magenta}Testing Parallel Requests:${colors.reset}`)

    const requests = [
        getTokenPrice(TEST_TOKENS.HYPE as `0x${string}`, HYPEREVM_CHAIN_ID),
        getTokenPrice(TEST_TOKENS.WHYPE as `0x${string}`, HYPEREVM_CHAIN_ID),
        getTokenPrice(TEST_TOKENS.USDT0 as `0x${string}`, HYPEREVM_CHAIN_ID),
        getTokenPrice(TEST_TOKENS.feUSD as `0x${string}`, HYPEREVM_CHAIN_ID),
    ]

    const startTime = Date.now()
    const results = await Promise.all(requests)
    const duration = Date.now() - startTime

    console.log('  Results:')
    console.log(`    HYPE:  $${results[0].toFixed(4)}`)
    console.log(`    WHYPE: $${results[1].toFixed(4)}`)
    console.log(`    USDT0: $${results[2].toFixed(4)}`)
    console.log(`    feUSD: $${results[3].toFixed(4)}`)
    console.log(`  Total duration: ${duration}ms`)

    // Check that HYPE and WHYPE have same price
    if (Math.abs(results[0] - results[1]) < 0.01) {
        console.log(`  ${colors.green}✓${colors.reset} HYPE and WHYPE have same price`)
    } else {
        console.log(`  ${colors.red}✗${colors.reset} HYPE and WHYPE prices differ`)
    }

    // Check that stablecoins are $1
    if (results[2] === 1.0 && results[3] === 1.0) {
        console.log(`  ${colors.green}✓${colors.reset} Stablecoins correctly priced at $1`)
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Stablecoin prices incorrect`)
    }
}

async function main() {
    console.log(`${colors.bright}${colors.cyan}`)
    console.log('════════════════════════════════════════════════')
    console.log('     Token Price Utility Test Suite')
    console.log('════════════════════════════════════════════════')
    console.log(colors.reset)

    // Test individual tokens
    console.log(`${colors.bright}1. Individual Token Tests${colors.reset}`)
    await testTokenPrice('HYPE', TEST_TOKENS.HYPE, HYPEREVM_CHAIN_ID, 'Live price from Hyperliquid')
    await testTokenPrice('WHYPE', TEST_TOKENS.WHYPE, HYPEREVM_CHAIN_ID, 'Live price from Hyperliquid')
    await testTokenPrice('USDT0', TEST_TOKENS.USDT0, HYPEREVM_CHAIN_ID, 'Fixed at $1.00')
    await testTokenPrice('feUSD', TEST_TOKENS.feUSD, HYPEREVM_CHAIN_ID, 'Fixed at $1.00')
    await testTokenPrice('Unknown Token', TEST_TOKENS.UNKNOWN, HYPEREVM_CHAIN_ID, 'Should return 0')
    await testTokenPrice('HYPE (wrong chain)', TEST_TOKENS.HYPE, 1, 'Should return 0')

    // Test caching
    console.log(`\n${colors.bright}2. Cache Tests${colors.reset}`)
    await testCaching()

    // Test batch requests
    console.log(`\n${colors.bright}3. Batch Request Test${colors.reset}`)
    await testBatchRequests()

    // Summary
    console.log(`\n${colors.bright}${colors.green}`)
    console.log('════════════════════════════════════════════════')
    console.log('     All Tests Completed!')
    console.log('════════════════════════════════════════════════')
    console.log(colors.reset)
}

// Run tests
main().catch((error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error)
    process.exit(1)
})
