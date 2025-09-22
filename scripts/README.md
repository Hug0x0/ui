# LP Monitoring Scripts - Cron Flow

These scripts test and demonstrate the LP monitoring cron job flow in sequential order:

## Cron Job Flow Steps

### 1. **01-discover-pools.ts** - Pool Discovery
Discovers all HYPE/USDT0 pools across all configured DEXs (Hyperswap, Project X, Hybra).
- Lists all pools with their fee tiers
- Identifies active pools (with liquidity) vs empty pools
- Shows current liquidity and price

```bash
pnpm tsx scripts/01-discover-pools.ts
```

### 2. **02-fetch-positions.ts** - Position Fetching
Fetches LP positions for monitored wallets from the blockchain.
- Checks all position managers for NFT positions
- Filters for HYPE/USDT0 positions only
- Stores positions in database

```bash
# Fetch positions for a specific wallet
pnpm tsx scripts/02-fetch-positions.ts --fetch 0xWALLET_ADDRESS

# Save positions to database
pnpm tsx scripts/02-fetch-positions.ts --fetch 0xWALLET_ADDRESS --save
```

### 3. **03-compute-metrics.ts** - Metrics Calculation
Computes detailed metrics for LP positions.
- Calculates token amounts from liquidity
- Computes fees, APR, and impermanent loss
- Aggregates metrics by DEX

```bash
# Test with mock data
pnpm tsx scripts/03-compute-metrics.ts

# Test with real positions
pnpm tsx scripts/03-compute-metrics.ts --real
```

### 4. **04-full-cron-flow.ts** - Complete Cron Test
Tests the entire cron job flow end-to-end.
- Discovers pools
- Fetches positions for wallets
- Calculates exposure
- Demonstrates delta hedging

```bash
# Test with default wallet
pnpm tsx scripts/04-full-cron-flow.ts

# Test with specific wallet
pnpm tsx scripts/04-full-cron-flow.ts 0xWALLET_ADDRESS
```

### 5. **05-test-price-oracle.ts** - Price Oracle Testing
Tests the HYPE token price fetching from Hyperliquid oracle.
- Tests oracle price fetching
- Tests caching behavior
- Tests parallel requests

```bash
pnpm tsx scripts/05-test-price-oracle.ts
```

## Cron Job Implementation

The actual cron job is located at `src/inngest/pull-and-store-analytics.ts` and follows this exact flow:

1. **Discover all active HYPE/USDT0 pools**
2. **For each monitored wallet, fetch positions**
3. **Compute exposure metrics and delta**
4. **Store position snapshots in database**

The cron job can be triggered via Inngest or run manually for testing.