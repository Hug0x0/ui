/**
 * AccountLens contract ABI for HyperDrive positions
 * Contract address: 0x42D3aF2812E79e051cCbA7aE1C757839Edfb3113
 */

export const AccountLensABI = [
    {
        name: 'getMarketsQuery',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'account', type: 'address' },
            { name: 'marketIds', type: 'uint256[]' },
        ],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'account', type: 'address' },
                    {
                        name: 'markets',
                        type: 'tuple[]',
                        components: [
                            { name: 'marketId', type: 'uint256' },
                            { name: 'shares', type: 'uint256' },
                            { name: 'assets', type: 'uint256' },
                            { name: 'liabilities', type: 'uint256' },
                            { name: 'borrowLimit', type: 'uint256' },
                            { name: 'liquidationLimit', type: 'uint256' },
                            { name: 'healthScore', type: 'uint16' },
                            { name: 'totalValue', type: 'uint256' },
                            {
                                name: 'collateral',
                                type: 'tuple[]',
                                components: [
                                    { name: 'token', type: 'address' },
                                    { name: 'symbol', type: 'string' },
                                    { name: 'decimals', type: 'uint8' },
                                    { name: 'price', type: 'uint256' },
                                    { name: 'supplied', type: 'uint256' },
                                    { name: 'totalValue', type: 'uint256' },
                                    { name: 'maxLTV', type: 'uint256' },
                                    { name: 'liquidationLTV', type: 'uint256' },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
] as const
