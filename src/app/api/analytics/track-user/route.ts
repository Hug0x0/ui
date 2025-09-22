import { NextRequest, NextResponse } from 'next/server'
import { getMonitoringPool } from '@/lib/database-pools'
import { logger } from '@/utils'

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json()

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }

        const pool = getMonitoringPool()
        const client = await pool.connect()
        try {
            // Try to update first
            const updateResult = await client.query(
                'UPDATE "ApiUser" SET "queryCount" = "queryCount" + 1, "lastSeen" = NOW() WHERE address = $1 RETURNING *',
                [String(address).toLowerCase()],
            )

            if (updateResult.rows.length === 0) {
                // If no rows updated, insert new record
                await client.query(
                    'INSERT INTO "ApiUser" (id, address, "firstSeen", "lastSeen", "queryCount") VALUES (gen_random_uuid(), $1, NOW(), NOW(), 1)',
                    [String(address).toLowerCase()],
                )
            }

            return NextResponse.json({ success: true })
        } finally {
            client.release()
        }
    } catch (error) {
        logger.debug('Failed to track API user:', error)
        // Don't fail the request, just return success
        return NextResponse.json({ success: true, warning: 'Tracking failed but request processed' })
    }
}
