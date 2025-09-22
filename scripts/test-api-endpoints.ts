#!/usr/bin/env tsx
/**
 * Test script for API endpoints after restructuring
 * Run with: pnpm tsx scripts/test-api-endpoints.ts
 */

const TEST_ACCOUNT = '0xB0Aa56926bE166Bcc5FB6Cf1169f56d9Fd7A25d7'
const BASE_URL = 'http://localhost:3000'

async function testEndpoint(path: string, description: string) {
    try {
        const response = await fetch(`${BASE_URL}${path}`)
        const status = response.status
        const ok = response.ok
        
        if (ok) {
            console.log(`✅ ${description}: ${status} OK`)
        } else {
            console.log(`❌ ${description}: ${status} ${response.statusText}`)
        }
        
        return ok
    } catch (error) {
        console.log(`❌ ${description}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`)
        return false
    }
}

async function testAllEndpoints() {
    console.log('Testing restructured API endpoints...\n')
    console.log(`Test account: ${TEST_ACCOUNT}\n`)
    console.log('---')
    
    const endpoints = [
        { path: `/api/snapshot/${TEST_ACCOUNT}`, description: 'Snapshot endpoint' },
        { path: `/api/transactions/${TEST_ACCOUNT}?limit=10`, description: 'Transactions endpoint' },
        { path: `/api/trades/${TEST_ACCOUNT}?limit=10`, description: 'Trades endpoint' },
    ]
    
    let allPassed = true
    
    for (const endpoint of endpoints) {
        const passed = await testEndpoint(endpoint.path, endpoint.description)
        if (!passed) allPassed = false
    }
    
    console.log('---')
    console.log(allPassed ? '\n✅ All endpoints working!' : '\n❌ Some endpoints failed')
    
    if (!allPassed) {
        console.log('\nMake sure the Next.js dev server is running: pnpm dev')
    }
}

// Run the test
testAllEndpoints().catch(console.error)