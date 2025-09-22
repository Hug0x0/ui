import { NextRequest, NextResponse } from 'next/server'
import { getMonitoringPool } from '@/lib/database-pools'

export async function GET(request: NextRequest, context: { params: Promise<{ address: string }> }) {
    const pool = getMonitoringPool()
    const client = await pool.connect()

    try {
        const params = await context.params
        const { address } = params
        const accountAddress = address.toLowerCase()

        // Get limit from query params with a default of 500 and max of 1000
        const searchParams = request.nextUrl.searchParams
        const requestedLimit = parseInt(searchParams.get('limit') || '500', 10)
        const limit = Math.min(Math.max(1, requestedLimit), 1000) // Clamp between 1 and 1000

        // Fetch last N snapshots for this address
        // Include indexed fields for efficient access
        const result = await client.query(
            `SELECT 
                snapshot,
                "timestamp",
                "totalUSD",
                "deployedAUM",
                "lpsDeltaHYPE",
                "balancesDeltaHYPE", 
                "perpsDeltaHYPE",
                "spotsDeltaHYPE",
                "strategyDelta",
                "netDeltaHYPE",
                "perpsNotionalUSD",
                "perpsPnlUSD",
                "withdrawableUSDC",
                "hypePrice"
             FROM "AccountSnapshot" 
             WHERE address = $1 
             ORDER BY timestamp DESC 
             LIMIT $2`,
            [accountAddress, limit],
        )

        // Parse JSON snapshots and reverse to get chronological order
        // Include indexed fields for potential optimization
        const snapshots = result.rows
            .map((row) => ({
                ...row.snapshot,
                // Ensure indexed fields are available directly
                _indexed: {
                    timestamp: row.timestamp,
                    totalUSD: parseFloat(row.totalUSD),
                    deployedAUM: parseFloat(row.deployedAUM),
                    lpsDeltaHYPE: parseFloat(row.lpsDeltaHYPE),
                    balancesDeltaHYPE: parseFloat(row.balancesDeltaHYPE),
                    perpsDeltaHYPE: parseFloat(row.perpsDeltaHYPE),
                    spotsDeltaHYPE: parseFloat(row.spotsDeltaHYPE),
                    strategyDelta: parseFloat(row.strategyDelta),
                    netDeltaHYPE: parseFloat(row.netDeltaHYPE),
                    perpsNotionalUSD: parseFloat(row.perpsNotionalUSD),
                    perpsPnlUSD: parseFloat(row.perpsPnlUSD),
                    withdrawableUSDC: parseFloat(row.withdrawableUSDC),
                    hypePrice: parseFloat(row.hypePrice),
                },
            }))
            .reverse()

        return NextResponse.json({
            snapshots,
            pagination: {
                limit,
                requestedLimit,
                actualLimit: limit,
                total: snapshots.length,
            },
        })
    } catch (error) {
        console.error('Failed to fetch snapshots:', error)
        return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
    } finally {
        client.release()
    }
}
