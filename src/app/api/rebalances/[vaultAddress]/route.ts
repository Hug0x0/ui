import { NextRequest, NextResponse } from 'next/server'
import { getKeeperPool } from '@/lib/database-pools'
import { MemoryCache, createCachedResponse } from '@/utils/cache.util'
import type { RebalanceResponse, RebalanceMetadata } from '@/interfaces/rebalance.interface'

// Simple in-memory cache with 1-second TTL
const cache = new MemoryCache<RebalanceResponse>(1000)

export async function GET(request: NextRequest, context: { params: Promise<{ vaultAddress: string }> }): Promise<NextResponse<RebalanceResponse>> {
    try {
        const params = await context.params
        const { vaultAddress } = params
        const searchParams = request.nextUrl.searchParams

        // Parse query parameters
        const requestedLimit = parseInt(searchParams.get('limit') || '50')
        const limit = Math.min(Math.max(1, requestedLimit), 500) // Clamp between 1 and 500
        const offset = parseInt(searchParams.get('offset') || '0')
        const status = searchParams.get('status') || null
        const orderBy = searchParams.get('orderBy') || 'timestamp'
        const order = (searchParams.get('order') || 'desc').toUpperCase()

        // Create cache key from parameters
        const cacheKey = `${vaultAddress}-${limit}-${offset}-${status}-${orderBy}-${order}`

        // Check cache first
        const cachedData = cache.get(cacheKey)
        if (cachedData) {
            return createCachedResponse(cachedData, true, cache.getCacheAge(cacheKey))
        }

        const pool = getKeeperPool()
        const client = await pool.connect()

        // Build WHERE clause conditions
        const conditions = [`r."vaultAddress" = $1`]
        const values: (string | number)[] = [vaultAddress]
        let paramCount = 1

        if (status) {
            paramCount++
            conditions.push(`r.status = $${paramCount}`)
            values.push(status)
        }

        const whereClause = conditions.join(' AND ')

        // Get total count for pagination
        const countResult = await client.query(
            `SELECT COUNT(*) as total 
             FROM "Rebalance" r 
             WHERE ${whereClause}`,
            values,
        )
        const totalCount = parseInt(countResult.rows[0].total)

        // Fetch rebalances with vault info
        paramCount++
        values.push(limit)
        paramCount++
        values.push(offset)

        const result = await client.query(
            `SELECT 
                r.id,
                r."vaultId",
                r.timestamp,
                r.status,
                r."poolAddress",
                r."vaultAddress",
                r.metadata,
                r."createdAt",
                r."updatedAt",
                v.id as vault_id,
                v.name as vault_name,
                v."fullName" as vault_fullname,
                v.address as vault_address,
                v."lastSync" as vault_lastsync,
                v."createdAt" as vault_created,
                v."updatedAt" as vault_updated
             FROM "Rebalance" r
             LEFT JOIN "Vault" v ON r."vaultId" = v.id
             WHERE ${whereClause}
             ORDER BY r."${orderBy}" ${order}
             LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
            values,
        )

        // Format response
        const formattedRebalances = result.rows.map((row) => ({
            id: row.id,
            vaultId: row.vaultId,
            timestamp: row.timestamp,
            status: row.status as 'pending' | 'executed' | 'failed' | 'cancelled' | 'completed',
            poolAddress: row.poolAddress,
            vaultAddress: row.vaultAddress,
            metadata: row.metadata as RebalanceMetadata,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            vault: row.vault_id
                ? {
                      id: row.vault_id,
                      name: row.vault_name,
                      fullName: row.vault_fullname,
                      address: row.vault_address,
                      lastSync: row.vault_lastsync,
                      createdAt: row.vault_created,
                      updatedAt: row.vault_updated,
                  }
                : undefined,
        }))

        const response: RebalanceResponse = {
            success: true,
            data: formattedRebalances,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount,
                requestedLimit,
                actualLimit: limit,
            },
        }

        // Store in cache
        cache.set(cacheKey, response)

        client.release()

        return createCachedResponse(response, false)
    } catch (error) {
        console.error('Error fetching rebalances:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch rebalances',
            },
            { status: 500 },
        )
    }
}
