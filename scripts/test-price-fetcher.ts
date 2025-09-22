#!/usr/bin/env tsx
/**
 * Test script for price fetching functionality
 * Run with: pnpm tsx scripts/test-price-fetcher.ts
 */

import { PriceAggregatorService } from '../src/services/price/price-aggregator.service'

async function testPriceFetching() {
    console.log('Testing price fetching functionality...\n')

    const priceAggregator = PriceAggregatorService.getInstance()

    const tokensToTest = ['HYPE', 'BTC', 'ETH', 'SOL', 'USDC', 'USDT']

    console.log('Fetching prices for:', tokensToTest.join(', '))
    console.log('---')

    for (const token of tokensToTest) {
        try {
            const price = await priceAggregator.getTokenPrice(token)
            if (price !== null) {
                console.log(`✅ ${token}: $${price.toFixed(2)}`)
            } else {
                console.log(`❌ ${token}: No price found`)
            }
        } catch (error) {
            console.log(`❌ ${token}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    console.log('\n---')
    console.log('Cache status:')
    const cacheStatus = priceAggregator.getCacheStatus()
    for (const [symbol, data] of cacheStatus) {
        console.log(`  ${symbol}: $${data.price.toFixed(2)} (source: ${data.source})`)
    }
}

// Run the test
testPriceFetching().catch(console.error)