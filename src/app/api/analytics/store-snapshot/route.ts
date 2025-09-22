import { NextRequest, NextResponse } from 'next/server'
import { getMonitoringPool } from '@/lib/database-pools'
import type { AccountSnapshot } from '@/interfaces/account.interface'
import { SCHEMA_VERSION } from '@/config/constants.config'

export async function POST(request: NextRequest) {
    const pool = getMonitoringPool()
    const client = await pool.connect()

    try {
        const snapshot: AccountSnapshot = await request.json()

        if (!snapshot || !snapshot.success) {
            return NextResponse.json({ error: 'Invalid snapshot data' }, { status: 400 })
        }

        // Validate required fields exist
        if (!snapshot.address || !snapshot.metrics?.portfolio) {
            return NextResponse.json({ error: 'Missing required fields: address or metrics.portfolio' }, { status: 400 })
        }

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/i.test(snapshot.address)) {
            return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 })
        }

        // Store snapshot in database
        const address = snapshot.address.toLowerCase()

        await client.query(
            `INSERT INTO "AccountSnapshot" 
            (id, address, timestamp, "evmAddress", "coreAddress", "schemaVersion", snapshot, 
             "totalUSD", "deployedAUM", "netDeltaHYPE", "strategyDelta",
             "lpsDeltaHYPE", "balancesDeltaHYPE", "perpsDeltaHYPE", "spotsDeltaHYPE", 
             "perpsNotionalUSD", "perpsPnlUSD", "withdrawableUSDC", "hypePrice") 
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
                address,
                new Date(snapshot.timestamp),
                snapshot.address?.toLowerCase() || address.toLowerCase(),
                snapshot.address?.toLowerCase() || address.toLowerCase(),
                snapshot.schemaVersion || SCHEMA_VERSION.CURRENT,
                JSON.stringify(snapshot),
                snapshot.metrics.portfolio.totalValueUSD,
                snapshot.metrics.portfolio.deployedValueUSD,
                snapshot.metrics.portfolio.netDeltaHYPE,
                snapshot.metrics.portfolio.strategyDeltaHYPE,
                snapshot.metrics.longLegs?.find((l) => l.type === 'lp')?.metrics?.totalDeltaHYPE || 0,
                snapshot.metrics.idle?.deltas?.balancesDeltaHYPE || 0,
                snapshot.metrics.shortLegs?.deltas?.perpsDeltaHYPE || 0,
                snapshot.metrics.idle?.deltas?.spotDeltaHYPE || 0,
                snapshot.metrics.shortLegs?.values?.perpsNotionalUSD || 0,
                snapshot.metrics.shortLegs?.values?.perpsPnlUSD || 0,
                snapshot.metrics.shortLegs?.values?.withdrawableUSDC || 0,
                snapshot.prices?.HYPE || 0,
            ],
        )

        // Clean up old snapshots (keep last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        await client.query('DELETE FROM "AccountSnapshot" WHERE timestamp < $1', [sevenDaysAgo])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to store snapshot:', error)
        return NextResponse.json(
            { error: 'Failed to store snapshot', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        )
    } finally {
        client.release()
    }
}
