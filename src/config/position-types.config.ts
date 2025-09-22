/**
 * Configuration for different position types
 * Controls which position types are enabled and their weights
 */

import type { PositionTypeConfig } from '@/interfaces/position-leg.interface'

/**
 * Position type configurations
 * Add new position types here as they are implemented
 */
export const POSITION_CONFIGS: PositionTypeConfig[] = [
    {
        type: 'lp',
        enabled: true,
        weight: 1 / 3, // 1/3 of deployed capital for LP positions
        displayName: 'Liquidity Pools',
        icon: '💧',
    },
    {
        type: 'hyperdrive',
        enabled: true,
        weight: 1 / 3, // 1/3 of deployed capital for HyperDrive positions
        displayName: 'HyperDrive',
        icon: '🏦',
    },
    // Future position types can be added here:
    // {
    //     type: 'staking',
    //     enabled: false,
    //     weight: 0.5, // Example: 50% allocation when enabled
    //     displayName: 'Staking',
    //     icon: '🔒',
    // },
]
