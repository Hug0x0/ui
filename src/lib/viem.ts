import { createPublicClient, http, type PublicClient, defineChain, fallback } from 'viem'
import { createLogger } from '@/utils'

// HyperEVM public RPC endpoints with fallbacks
const HYPEREVM_RPC_URLS = [
    'https://hyperliquid-mainnet.g.alchemy.com/v2/xrhhC2wgJl6OX9lEGPrek', // Alchemy RPC, fberger account
    'https://hyperliquid-mainnet.g.alchemy.com/v2/T4Jmj7HYUBr1psFAZh415', // Alchemy RPC, katalyster account
    'https://hyperliquid.valtitude.xyz?apiKey=5bc51b42-1575-40ae-998f-81c4ef067f6a', // Valtitude RPC
    'https://evmrpc-eu.hyperpc.app/f1db4079052445528a4cb493b62f3def', // HyperPC RPC
    'https://rpc.hypurrscan.io', // Hypurrscan RPC fallback
    'https://rpc.hyperliquid.xyz/evm', // Alternative official RPC
    'https://api.hyperliquid.xyz/evm', // Primary official RPC
    'https://hyperliquid-json-rpc.stakely.io', // Stakely RPC fallback
    'https://g.w.lavanet.xyz:443/gateway/hyperliquid/rpc-http/e1a0a259d9519ff2cb043a434844d733', // Primary official RPC
    'https://rpc.hyperlend.finance', // HyperLend RPC fallback
    'https://hyperliquid.drpc.org', // DRPC RPC fallback
]

export const HYPEREVM_CHAIN_ID = 999
export const hyperEvm = defineChain({
    id: HYPEREVM_CHAIN_ID,
    name: 'HyperEVM',
    nativeCurrency: {
        decimals: 18,
        name: 'HYPE',
        symbol: 'HYPE',
    },
    rpcUrls: {
        default: {
            http: HYPEREVM_RPC_URLS,
        },
    },
    blockExplorers: {
        default: {
            name: 'HyperEVM Explorer',
            url: 'https://explorer.hyperliquid.xyz',
        },
    },
})

let client: PublicClient | null = null

export function getViemClient(chainId: number = HYPEREVM_CHAIN_ID): PublicClient {
    if (chainId !== HYPEREVM_CHAIN_ID) {
        throw new Error(`Only HyperEVM (chain ID ${HYPEREVM_CHAIN_ID}) is supported`)
    }

    if (!client) {
        // Use fallback transport to automatically try multiple RPCs
        const transports = HYPEREVM_RPC_URLS.map((url) =>
            http(url, {
                batch: true,
                retryCount: 2,
                retryDelay: 200, // Reduced from 1000ms - fail fast with multiple RPCs
                timeout: 10000,
                // Only log requests in development if explicitly enabled
                onFetchRequest: (request) => {
                    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_RPC === 'true') {
                        console.log(`🌐 RPC Request to ${url}:`, request.method)
                    }
                },
                onFetchResponse: (response) => {
                    if (!response.ok) {
                        const logger = createLogger('RPC')
                        logger.debug(`Error from ${url}:`, response.status, response.statusText)
                    }
                },
            }),
        )

        client = createPublicClient({
            chain: hyperEvm,
            transport: fallback(transports, {
                retryCount: 1,
                rank: {
                    interval: 60_000, // Re-rank RPCs every minute
                    sampleCount: 5, // Sample 5 requests for ranking
                    timeout: 500, // Reduced from 2000ms - faster ranking
                    weights: {
                        latency: 0.3, // 30% weight on latency
                        stability: 0.7, // 70% weight on stability
                    },
                },
            }),
        })
    }

    return client
}

/**
 * Health check for RPC endpoints
 */
export async function checkRpcHealth(): Promise<{
    healthy: boolean
    latencies: Record<string, number | null>
    errors: Record<string, string>
}> {
    const results: Record<string, number | null> = {}
    const errors: Record<string, string> = {}

    for (const url of HYPEREVM_RPC_URLS) {
        const startTime = Date.now()
        try {
            const testClient = createPublicClient({
                chain: hyperEvm,
                transport: http(url, { timeout: 5000 }),
            })

            // Try to get the latest block number as a health check
            await testClient.getBlockNumber()

            results[url] = Date.now() - startTime
        } catch (error) {
            results[url] = null
            errors[url] = error instanceof Error ? error.message : 'Unknown error'
        }
    }

    const healthy = Object.values(results).some((latency) => latency !== null)

    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_RPC === 'true') {
        console.log('🏥 RPC Health Check Results:')
        for (const [url, latency] of Object.entries(results)) {
            if (latency !== null) {
                console.log(`  ✅ ${url}: ${latency}ms`)
            } else {
                console.log(`  ❌ ${url}: ${errors[url]}`)
            }
        }
    }

    return { healthy, latencies: results, errors }
}
