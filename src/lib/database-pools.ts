import { Pool } from 'pg'

// Default pool configuration
const DEFAULT_POOL_CONFIG = {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}

// Singleton pool instances
let monitoringPool: Pool | null = null
let keeperPool: Pool | null = null

/**
 * Get or create the monitoring database pool
 */
export function getMonitoringPool(): Pool {
    if (!monitoringPool) {
        monitoringPool = new Pool({
            connectionString: process.env.DATABASE_URL_MONITORING,
            ...DEFAULT_POOL_CONFIG,
        })
    }
    return monitoringPool
}

/**
 * Get or create the keeper database pool
 */
export function getKeeperPool(): Pool {
    if (!keeperPool) {
        keeperPool = new Pool({
            connectionString: process.env.DATABASE_URL_KEEPER,
            ...DEFAULT_POOL_CONFIG,
        })
    }
    return keeperPool
}

/**
 * Close all pools (for cleanup)
 */
export async function closePools(): Promise<void> {
    const promises: Promise<void>[] = []

    if (monitoringPool) {
        promises.push(monitoringPool.end())
        monitoringPool = null
    }

    if (keeperPool) {
        promises.push(keeperPool.end())
        keeperPool = null
    }

    await Promise.all(promises)
}
