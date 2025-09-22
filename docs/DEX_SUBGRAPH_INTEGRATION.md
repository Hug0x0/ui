# DEX Subgraph Integration

Technical documentation for fetching pool data from HyperEVM DEX subgraphs to calculate APR and other metrics.

## Overview

The HyperLP vault fetches real-time and historical data from V3 DEXs on HyperEVM to:
- Calculate LP fee APR over various time intervals (24h, 7d, 30d)
- Monitor pool liquidity and volume
- Track fee generation
- Identify optimal pools for capital deployment

## V3 DEX Subgraphs

All three V3 forks use similar GraphQL schemas:

| DEX | Subgraph URL |
|-----|-------------|
| **Hyperswap V3** | `https://api.goldsky.com/api/public/project_cm97l77ib0cz601wlgi9wb0ec/subgraphs/v3-subgraph/6.0.0/gn` |
| **Project X** | `https://api.goldsky.com/api/public/project_cmbbm2iwckb1b01t39xed236t/subgraphs/uniswap-v3-hyperevm-position/prod/gn` |
| **Hybra Finance** | `https://api.goldsky.com/api/public/project_cmbj707z4cd9901sib1f6cu0c/subgraphs/hybra-v3/v3/gn` |

## GraphQL Queries

### Fetch HYPE/USDT0 Pools

```graphql
query GetHypeUsdtPools {
  pools(
    where: {
      or: [
        {
          token0_: { symbol: "WHYPE" }
          token1_: { symbol: "USD₮0" }
        },
        {
          token0_: { symbol: "USD₮0" }
          token1_: { symbol: "WHYPE" }
        }
      ]
    }
    orderBy: totalValueLockedUSD
    orderDirection: desc
  ) {
    id
    feeTier
    liquidity
    token0 {
      id
      symbol
      decimals
    }
    token1 {
      id
      symbol
      decimals
    }
    volumeUSD
    feesUSD
    totalValueLockedUSD
  }
}
```

### Fetch Historical Data for APR

```graphql
query GetPoolHistoricalData($poolId: String!, $startTime: Int!) {
  poolDayDatas(
    where: {
      pool: $poolId
      date_gte: $startTime
    }
    orderBy: date
    orderDirection: asc
  ) {
    date
    volumeUSD
    feesUSD
    tvlUSD
  }
}
```

## APR Calculation

### Formula
```
APR = (Fees Generated / TVL) * (365 / Days) * 100
```

### Implementation
```typescript
function calculateFeeAPR(feesUSD: number, tvlUSD: number, days: number): number {
  if (tvlUSD === 0) return 0;
  return (feesUSD / tvlUSD) * (365 / days) * 100;
}
```

## Data Structure

### Pool APR Response
```typescript
interface PoolAPRData {
  dex: string;
  poolAddress: string;
  feeTier: number;
  tvlUSD: number;
  volume24h: number;
  fees24h: number;
  apr24h: number;
  apr7d: number;
  apr30d: number;
}
```

## Error Handling

- Implement retry logic with exponential backoff
- Handle GraphQL errors gracefully
- Provide fallback values when subgraphs are unavailable
- Log errors for monitoring