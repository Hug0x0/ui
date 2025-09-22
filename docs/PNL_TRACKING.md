# P&L Tracking Implementation

## Overview

Comprehensive P&L tracking for the HyperLP delta-neutral strategy with separated LP and Perp components.

## Token Configuration

### HYPE
- **Index**: 150
- **Wei Decimals**: 8
- **Sz Decimals**: 2

### USDT0
- **Index**: 268
- **Wei Decimals**: 8
- **Contract**: `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb`

## P&L Components (Ranked by Complexity)

### Easy (Direct API Reads)
1. **Perp Funding**: Hyperliquid API `/info` endpoint
2. **LP Claimed Fees**: DEX subgraph `Collect` events
3. **Perp Fees**: Trade history with maker/taker rates

### Moderate (Simple Calculations)
4. **Gas Costs**: Transaction receipts × ETH price
5. **Unclaimed LP Fees**: `(feeGrowthGlobal - feeGrowthPosition) × liquidity`
6. **Perp Unrealized**: `(markPrice - avgEntryPrice) × position_size`

### Complex (Multi-step)
7. **Swap Costs**: Track slippage and fees on rebalances
8. **Net Delta**: V3 position delta + perp position

### Difficult (State-Dependent)
9. **Impermanent Loss**: Compare position value vs HODL value

## Key Formulas

### Fee APR
```
APR = (Fees / TVL) × (365 / Days) × 100
```

### V3 Position Delta
```python
if p < p_a:
    delta = L / sqrt(p_a)  # 100% token0
elif p > p_b:
    delta = 0  # 100% token1
else:
    delta = L × (1/sqrt(p) - 1/sqrt(p_b))
```

### Daily P&L
```
daily_pnl = lp_fees - il_realized - funding_costs - gas_costs - swap_fees
```

## Rebalancing Logic

### Triggers
- **Price Drift**: >3% from position center
- **Range Coverage**: <50% of range is active
- **Delta Drift**: >5% deviation from target
- **Out of Range**: Price outside tick boundaries

### Cost-Benefit Analysis
```python
breakeven_days = total_cost / daily_fee_gain
rebalance_if: breakeven_days < expected_hold_days
```

## Database Schema

```prisma
model PnlSnapshot {
  // LP Components (USD)
  lpSwapFeesEarned      Decimal
  lpUnclaimedFees       Decimal
  lpImpermanentLoss     Decimal
  lpRebalancingCost     Decimal
  
  // Perp Components (USD)
  perpFundingNet        Decimal
  perpFeesNet           Decimal
  perpUnrealizedPnl     Decimal
  
  // Combined Metrics
  netPnl                Decimal
  netApr                Decimal
}

model RebalanceEvent {
  triggerReason         String
  gasCost               Decimal
  swapFees              Decimal
  ilRealized            Decimal
  expectedDailyGain     Decimal
  breakEvenDays         Decimal
}
```

## Implementation Phases

1. **MVP**: Direct API reads (funding, fees, unrealized P&L)
2. **Core**: Add gas costs, unclaimed fees, basic delta
3. **Advanced**: Swap cost tracking, accurate delta calculations
4. **Complete**: Full IL tracking with historical position state

## Target Returns

- **LP Fee Income**: 15-25% APY
- **Funding Cost**: -10% to -20% APY (hedging cost)
- **Net Target**: 15-30% APY without directional risk