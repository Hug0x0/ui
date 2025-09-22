import type { AccountSnapshot } from '@/interfaces'

/**
 * Validates that a snapshot has the required structure.
 * Returns true if valid, false if invalid.
 */
export function isValidSnapshot(snapshot: unknown): snapshot is AccountSnapshot {
    if (!snapshot || typeof snapshot !== 'object') {
        return false
    }

    const data = snapshot as Record<string, unknown>

    // Check required top-level fields
    if (!data.address || typeof data.address !== 'string') {
        console.warn('[Snapshot Validator] Missing or invalid address field')
        return false
    }

    // Check metrics structure exists
    if (!data.metrics || typeof data.metrics !== 'object') {
        console.warn('[Snapshot Validator] Missing metrics field')
        return false
    }

    const metrics = data.metrics as Record<string, unknown>

    // Check idle structure if it exists (it's optional but if present must have deltas)
    if (metrics.idle) {
        if (typeof metrics.idle !== 'object') {
            console.warn('[Snapshot Validator] Invalid idle structure')
            return false
        }

        const idle = metrics.idle as Record<string, unknown>
        // If idle exists, deltas should be an object (can be empty)
        if (idle.deltas && typeof idle.deltas !== 'object') {
            console.warn('[Snapshot Validator] Invalid idle.deltas structure')
            return false
        }
    }

    // Check positions structure exists
    if (!data.positions || typeof data.positions !== 'object') {
        console.warn('[Snapshot Validator] Missing positions field')
        return false
    }

    // Check portfolio metrics exist
    if (!metrics.portfolio || typeof metrics.portfolio !== 'object') {
        console.warn('[Snapshot Validator] Missing portfolio metrics')
        return false
    }

    // Basic validation passed
    return true
}

/**
 * Sanitizes a snapshot to ensure it has safe default values for optional fields.
 * This prevents runtime errors from undefined access.
 */
export function sanitizeSnapshot(snapshot: unknown): AccountSnapshot {
    const data = snapshot as Record<string, unknown>
    // Ensure metrics exists
    if (!data.metrics) {
        data.metrics = {}
    }

    const metrics = data.metrics as Record<string, unknown>

    // Ensure metrics.idle exists with all required properties
    if (!metrics.idle) {
        metrics.idle = {
            values: {
                balancesValueUSD: 0,
                spotValueUSD: 0,
                totalValueUSD: 0,
            },
            deltas: {
                balancesDeltaHYPE: 0,
                spotDeltaHYPE: 0,
                totalDeltaHYPE: 0,
            },
        }
    } else {
        const idle = metrics.idle as Record<string, unknown>

        // Ensure values exists
        if (!idle.values) {
            idle.values = {
                balancesValueUSD: 0,
                spotValueUSD: 0,
                totalValueUSD: 0,
            }
        }

        // Ensure deltas exists
        if (!idle.deltas) {
            idle.deltas = {
                balancesDeltaHYPE: 0,
                spotDeltaHYPE: 0,
                totalDeltaHYPE: 0,
            }
        }
    }

    // Ensure shortLegs metrics exist
    if (!metrics.shortLegs) {
        metrics.shortLegs = {
            values: {
                perpsNotionalUSD: 0,
                perpsPnlUSD: 0,
                perpsMarginUSD: 0,
                perpsValueUSD: 0,
                withdrawableUSDC: 0,
            },
            deltas: {
                perpsDeltaHYPE: 0,
            },
            perpAggregates: {
                totalMarginUSD: 0,
                totalNotionalUSD: 0,
                totalPnlUSD: 0,
                avgLeverageRatio: 0,
            },
            apr: {
                avgFundingAPR24h: null,
                avgFundingAPR7d: null,
                avgFundingAPR30d: null,
            },
        }
    } else {
        const shortLegs = metrics.shortLegs as Record<string, unknown>

        // Ensure values exists
        if (!shortLegs.values) {
            shortLegs.values = {
                perpsNotionalUSD: 0,
                perpsPnlUSD: 0,
                perpsMarginUSD: 0,
                perpsValueUSD: 0,
                withdrawableUSDC: 0,
            }
        }

        // Ensure apr exists
        if (!shortLegs.apr) {
            shortLegs.apr = {
                avgFundingAPR24h: null,
                avgFundingAPR7d: null,
                avgFundingAPR30d: null,
            }
        }
    }

    // Ensure longLegs metrics exist
    if (!metrics.longLegs) {
        metrics.longLegs = []
    }

    // Ensure portfolio metrics exist
    if (!metrics.portfolio) {
        metrics.portfolio = {
            totalValueUSD: 0,
            netDeltaHYPE: 0,
            strategyDeltaHYPE: 0,
            deployedValueUSD: 0,
            idleValueUSD: 0,
            longDeltaHYPE: 0,
            shortDeltaHYPE: 0,
            hedgeEfficiencyRatio: 0,
            apr: {
                combined24h: null,
                combined7d: null,
                combined30d: null,
            },
            allocation: {
                longPercentage: 0,
                shortPercentage: 0,
            },
            aprSources: {
                longAPR24h: null,
                longAPR7d: null,
                longAPR30d: null,
                fundingAPR24h: null,
                fundingAPR7d: null,
                fundingAPR30d: null,
            },
        }
    } else {
        const portfolio = metrics.portfolio as Record<string, unknown>

        // Ensure apr exists
        if (!portfolio.apr) {
            portfolio.apr = {
                combined24h: null,
                combined7d: null,
                combined30d: null,
            }
        }

        // Ensure allocation exists
        if (!portfolio.allocation) {
            portfolio.allocation = {
                longPercentage: 0,
                shortPercentage: 0,
            }
        }

        // Ensure aprSources exists
        if (!portfolio.aprSources) {
            portfolio.aprSources = {
                longAPR24h: null,
                longAPR7d: null,
                longAPR30d: null,
                fundingAPR24h: null,
                fundingAPR7d: null,
                fundingAPR30d: null,
            }
        }
    }

    // Ensure positions exists
    if (!data.positions) {
        data.positions = {}
    }

    const positions = data.positions as Record<string, unknown>

    // Ensure positions.idle exists
    if (!positions.idle) {
        positions.idle = {
            balances: [],
        }
    }

    return data as unknown as AccountSnapshot
}
