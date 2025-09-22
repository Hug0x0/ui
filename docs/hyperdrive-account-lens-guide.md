# HyperDrive Account Lens Integration Guide

## Overview

This guide explains how to retrieve user underlying asset amounts using the `account_lens` system. The current implementation is designed for HyperEVM markets.

1. **HyperDrive on Hyperliquid** (existing implementation) - A stablecoin money market and yield hub

This guide covers both scenarios.

---

## Current Implementation: HyperEVM Markets (TypeScript)

### 1. Architecture Overview

The current `AccountLens` system retrieves user positions from HyperEVM markets through a smart contract interface:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ TypeScript SDK  │───▶│  AccountLens     │───▶│  Market Data    │
│                 │    │  Smart Contract  │    │  (assets/shares)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2. Key Data Structures

The TypeScript interfaces for market data:

```typescript
import { Address } from 'viem';

interface TokenBalanceData {
  token: Address;
  balance: bigint;
}

interface CollateralAssetData {
  token: Address;
  symbol: string;
  decimals: number;
  price: bigint;
  supplied: bigint;
  totalValue: bigint;
  maxLTV: bigint;
  liquidationLTV: bigint;
}

interface MarketQueryData {
  marketId: bigint;           // Unique market identifier
  shares: bigint;             // User's share tokens in the market
  assets: bigint;             // Underlying asset amount (key field)
  liabilities: bigint;        // User's borrowed amount
  borrowLimit: bigint;        // Maximum borrowing capacity
  liquidationLimit: bigint;   // Liquidation threshold
  healthScore: number;        // Position health (1-10000)
  totalValue: bigint;         // Total position value in USD
  collateral: CollateralAssetData[]; // Collateral details
}

interface MarketsQueryData {
  account: Address;
  markets: MarketQueryData[];
}
```

**Key Field for Underlying Assets**: `assets` - This field contains the user's underlying asset amount in the market.

### 3. Smart Contract ABI

The `IAccountLens` contract ABI definition:

```typescript
export const AccountLensABI = [
  {
    name: 'getMarketsQuery',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'marketIds', type: 'uint256[]' }
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
                  { name: 'liquidationLTV', type: 'uint256' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
] as const;
```

### 4. AccountLens Client Implementation

TypeScript client for interacting with the AccountLens contract:

```typescript
import { 
  createPublicClient, 
  http, 
  Address, 
  PublicClient,
  getContract
} from 'viem';
import { hyperEvm } from 'viem/chains'; // Assuming HyperEVM chain config

export class AccountLensClient {
  private client: PublicClient;
  private contract: any;

  constructor(
    rpcUrl: string,
    contractAddress: Address
  ) {
    this.client = createPublicClient({
      chain: hyperEvm,
      transport: http(rpcUrl)
    });

    this.contract = getContract({
      address: contractAddress,
      abi: AccountLensABI,
      client: this.client
    });
  }

  async getMarketsQuery(
    account: Address,
    marketIds: bigint[]
  ): Promise<MarketsQueryData> {
    try {
      const result = await this.contract.read.getMarketsQuery([
        account,
        marketIds
      ]);

      return {
        account: result.account,
        markets: result.markets.map((market: any) => ({
          marketId: market.marketId,
          shares: market.shares,
          assets: market.assets,
          liabilities: market.liabilities,
          borrowLimit: market.borrowLimit,
          liquidationLimit: market.liquidationLimit,
          healthScore: market.healthScore,
          totalValue: market.totalValue,
          collateral: market.collateral.map((col: any) => ({
            token: col.token,
            symbol: col.symbol,
            decimals: col.decimals,
            price: col.price,
            supplied: col.supplied,
            totalValue: col.totalValue,
            maxLTV: col.maxLTV,
            liquidationLTV: col.liquidationLTV
          }))
        }))
      };
    } catch (error) {
      throw new Error(`Failed to query markets: ${error}`);
    }
  }
}
```

### 5. Implementation Example

Here's how to retrieve underlying asset amounts:

```typescript
import { parseEther, formatEther } from 'viem';

interface UnderlyingAsset {
  marketId: bigint;
  amount: number;
  symbol?: string;
  valueUSD?: number;
}

async function getUserUnderlyingAssets(
  accountLens: AccountLensClient,
  userAddress: Address,
  marketIds: bigint[]
): Promise<UnderlyingAsset[]> {
  try {
    // Query market data
    const marketsData = await accountLens.getMarketsQuery(
      userAddress,
      marketIds
    );

    const underlyingAssets: UnderlyingAsset[] = [];

    // Extract underlying asset amounts
    for (const market of marketsData.markets) {
      if (hasAssets(market)) {
        const assetAmount = assetsAsNumber(market.assets);
        const symbol = mapMarketIdToToken(market.marketId);
        const valueUSD = getAssetValueUSD(market);
        
        underlyingAssets.push({
          marketId: market.marketId,
          amount: assetAmount,
          symbol,
          valueUSD
        });
        
        console.log(
          `Market ${market.marketId}: ${assetAmount} underlying assets (${symbol || 'Unknown'})`
        );
      }
    }

    return underlyingAssets;
  } catch (error) {
    console.error('Failed to get underlying assets:', error);
    throw error;
  }
}
```

### 6. Key Helper Functions

Utility functions for working with market data:

```typescript
// Convert assets from wei (bigint) to human-readable number (18 decimal scaling)
function assetsAsNumber(assets: bigint, decimals: number = 18): number {
  return Number(formatEther(assets));
}

// Check if position has underlying assets
function hasAssets(market: MarketQueryData): boolean {
  return market.assets > 0n;
}

// Get asset value in USD using collateral price data
function getAssetValueUSD(market: MarketQueryData): number {
  if (market.collateral.length > 0) {
    const collateral = market.collateral[0];
    const price = Number(formatEther(collateral.price));
    const assetAmount = assetsAsNumber(market.assets);
    return assetAmount * price;
  } else {
    // Fallback assumes assets are already in USD terms
    return assetsAsNumber(market.assets);
  }
}

// Scale amounts by specific decimal places
function scaleByDecimals(amount: bigint, decimals: number): number {
  const scalingFactor = 10n ** BigInt(decimals);
  return Number(amount) / Number(scalingFactor);
}

// Format large numbers with commas
function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}
```

### 7. Configuration Setup

Configuration object for the TypeScript implementation:

```typescript
interface HyperEVMConfig {
  rpcEndpoint: string;
  accountLensAddress: Address;
  explorerBaseUrl: string;
  // ... other settings
}

const config: HyperEVMConfig = {
  rpcEndpoint: "https://hyperliquid.valtitude.xyz?apiKey=YOUR_API_KEY",
  accountLensAddress: "0x42D3aF2812E79e051cCbA7aE1C757839Edfb3113",
  explorerBaseUrl: "https://hyperevmscan.io/"
};

// Initialize the client
const accountLens = new AccountLensClient(
  config.rpcEndpoint,
  config.accountLensAddress
);
```

### 8. Market ID Mapping

TypeScript implementation for market ID to token mapping:

```typescript
const MARKET_ID_TO_TOKEN: Record<string, string> = {
  '0': 'HYPE',
  '1': 'ETH', 
  '2': 'BTC',
  '3': 'USDT',
  // Add more mappings as needed
};

function mapMarketIdToToken(marketId: bigint): string | undefined {
  return MARKET_ID_TO_TOKEN[marketId.toString()];
}

// Reverse mapping
function getMarketIdForToken(symbol: string): bigint | undefined {
  const entry = Object.entries(MARKET_ID_TO_TOKEN)
    .find(([_, tokenSymbol]) => tokenSymbol === symbol);
  return entry ? BigInt(entry[0]) : undefined;
}
```

### 9. Complete Usage Example

Full example showing how to use the TypeScript implementation:

```typescript
async function main() {
  try {
    // Initialize the account lens client
    const accountLens = new AccountLensClient(
      "https://hyperliquid.valtitude.xyz?apiKey=YOUR_API_KEY",
      "0x42D3aF2812E79e051cCbA7aE1C757839Edfb3113"
    );

    // Define user address and markets to query
    const userAddress: Address = "0x1234567890123456789012345678901234567890";
    const marketIds = [0n, 1n, 2n]; // HYPE, ETH, BTC markets

    // Get underlying assets
    const underlyingAssets = await getUserUnderlyingAssets(
      accountLens,
      userAddress,
      marketIds
    );

    // Display results
    console.log('=== User Underlying Assets ===');
    for (const asset of underlyingAssets) {
      console.log(`${asset.symbol || 'Unknown'}: ${formatNumber(asset.amount)} tokens`);
      if (asset.valueUSD) {
        console.log(`  USD Value: $${formatNumber(asset.valueUSD)}`);
      }
    }

    // Calculate total USD value
    const totalUSD = underlyingAssets
      .filter(asset => asset.valueUSD)
      .reduce((sum, asset) => sum + (asset.valueUSD || 0), 0);
    
    console.log(`\nTotal Portfolio Value: $${formatNumber(totalUSD)}`);

  } catch (error) {
    console.error('Error in main:', error);
  }
}

