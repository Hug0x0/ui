# HyperLP Architecture

## System Overview

HyperLP is a delta-neutral liquidity vault on Hyperliquid that:
- Provides liquidity on HyperEVM DEXs (Hyperswap, ProjectX, Hybra)
- Hedges volatile exposure via perpetual shorts on HyperCore
- Maintains neutral delta while earning LP fees, funding, and incentives

### Capital Allocation
- ⅓ to HyperCore as USDC margin for perp hedging
- ⅓ to HYPE token holdings
- ⅓ to USDT0 for 50/50 LP positions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM (dual database architecture)
- **State**: Zustand with persistence
- **Charts**: ECharts
- **Styling**: Tailwind CSS

## Core Components

### 1. Position Management
**`/src/utils/position-fetcher.util.ts`**
- Optimized blockchain fetching with multicall batching
- Reduces RPC calls from 100+ to ~5-10
- 60-second caching for performance

### 2. Data Architecture
- **Current Schema**: TypeScript interfaces in `src/interfaces/account.interface.ts`
- **AccountSnapshot**: Main interface containing positions, metrics, prices
- **Monitoring DB** (`DATABASE_URL_MONITORING`): Defined but not yet active (will store historical snapshots)
- **Keeper DB** (`DATABASE_URL_KEEPER`): Defined but not yet active (will store keeper configurations)

### 3. Data Flow

#### Current Implementation
```
Page Request → Fetch from Blockchain → Calculate Metrics → Return Real-time Data
```

#### Future Implementation (with Monitoring DB)
```
Cron Job → Sync Positions → Calculate Metrics → Store Snapshots
Page Request → Read from DB (fast cached data)
```

### 4. API Endpoints

**Active**
- `/api/positions/[account]` - Real-time account positions and metrics

**Future** (When monitoring DB is active)
- `/api/internal/sync/*` - Position synchronization for cron jobs
- `/api/internal/analytics/*` - Metrics calculation and storage

## Key Identifiers

### Hyperliquid Platform IDs
- **Token Index**: Unique ID for spot tokens (e.g., HYPE = 150)
- **Spot Index**: ID for trading pairs (e.g., HYPE/USDC = 107)
- **Asset ID**: Trading identifier (spot = spotIndex + 10000)

### Token Addresses
- **WHYPE**: `0x5555555555555555555555555555555555`
- **USDT0**: `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb`

## Terminology

### Position Types
- **LpPosition**: Liquidity provider positions on DEXs
- **PerpPosition**: Perpetual futures for hedging
- **SpotPosition**: Spot token holdings

### Key Metrics
- **netDelta**: Combined exposure from LP and perp positions
- **lpFeeAPR**: Annual rate from LP trading fees
- **fundingAPR**: Rate from perp funding payments
- **netAPR**: Combined yield after costs

## Development Patterns

### Adding API Endpoints
Create route handlers in `src/app/api/[endpoint]/route.ts`

### Component State Management
```tsx
const { state, setState } = useStore()
```

### Database Queries
```typescript
import { prismaMonitoring } from '@/lib/prisma-monitoring'
import { prismaKeeper } from '@/lib/prisma-keeper'
```

### Theme-Aware Components
```tsx
const { resolvedTheme } = useTheme()
const isDarkMode = resolvedTheme === 'dark'
```

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build           # Build production
pnpm lint:fix        # Fix linting

# Database
pnpm prisma:studio   # Open Prisma Studio
pnpm db:migrate      # Run migrations
pnpm db:sync         # Check sync status
```