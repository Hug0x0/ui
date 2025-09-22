# HyperLP Documentation

Essential technical documentation for the HyperLP delta-neutral liquidity vault.

## 📚 Core Documentation

### [Architecture](./ARCHITECTURE.md)
System overview, tech stack, components, and development patterns.

### [Data Flow](./DATA_FLOW.md)
Complete data flow from component → hook → API → service → blockchain and back.

### [Database](./DATABASE.md)
Multi-database setup with Prisma, migration management, and Vercel deployment.

### [P&L Tracking](./PNL_TRACKING.md)
P&L calculation formulas, rebalancing logic, and implementation roadmap.

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env.local
   pnpm install
   pnpm prisma:generate
   ```

2. **Start Development**
   ```bash
   pnpm dev
   ```

3. **Database Commands**
   ```bash
   pnpm prisma:studio      # Open Prisma Studio
   pnpm db:sync           # Check database sync
   pnpm db:migrate        # Run migrations
   ```

## 🎯 Key Concepts

### Delta-Neutral Strategy
- Provide liquidity on HyperEVM DEXs
- Hedge with perpetual shorts on HyperCore
- Maintain neutral exposure while earning fees

### Supported DEXs
- Hyperswap V3
- Project X
- Hybra Finance

### Token Pairs
- HYPE/USDT0 (primary focus)
- HYPE token: `0x5555555555555555555555555555555555`
- USDT0 token: `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb`

## 📁 Project Structure

```
docs/
├── README.md          # This file
├── ARCHITECTURE.md    # System design and components
├── DATABASE.md        # Database configuration
└── PNL_TRACKING.md    # P&L calculation and tracking
```

## 🔗 Related Resources

- [Main README](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - AI assistant configuration
- [Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/)
- [Prisma Docs](https://www.prisma.io/docs/)