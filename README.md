# HyperLP - Delta-Neutral LP Vault on Hyperliquid

> **⚠️ VISION DOCUMENT**  
> Iterating since HyperLiquid Hackathon (Aug 2025)

## The Problem

Getting delta-neutral on HyperEVM yields (LP NFTs, stHYPE, lending markets, PTs) requires:

1. Source USDC as margin for 1x shorts
2. Open Short
3. Monitor funding flips
4. Bridge PnL
5. Rebalance
6. Sketchy unwind
7. Mainnet gwei spikes erasing yield

Many steps. Manual hell. Max pain.

**Result**: Gas costs and operational overhead eat into profits. Small positions become unviable.

## The Solution

**1-step to drag & drop your yield assets into HyperLP vault for instant hedge**

## The Mechanism

P2P lending replaces vault complexity:

- **HyperLP** sources USDC margin directly for depositors at current rate + spread
- **Depositors** get instantly hedged
- **Smart contract** opens shorts, compounds funding, ERC7540 with open source, offchain NAV computation

## Economics

- HyperLP lend USDC at current rate + spread (2-5%)
- Depositors pay just the spread. Get yield on their evm leg and funding rate on the short leg.

## Execution

**Before:** Source margin → Short → Monitor → Bridge → Repeat → Manual → Error prone with multiple steps
**After:** Deposit to hedge → 1 step

Result: instant, zero friction, profesionnal hedging

## Use-cases:

- Delta-neutral exposure to majors (HYPE/BTC/ETH)
- HIP-3 strategies: equity perps, RWAs, pre-IPO markets
- Cross assets: BTC hedged with NASDAQ perps
- Clear P&L explanations
- Partnerships (points, liquidity bribes)
- Institutional that needs to hedge their positions around economic calendar events

## Technical Architecture

### Backend with rust

- **ERC-7540 Standard**: Tokenized vault interface
- **Keepers**: 24/7 position monitoring and rebalancing (private repos for now)
- **Risk Management**: Limits on leverage, slippage, and position concentration

### frontend with Nextjs

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **Databases**: PostgreSQL, Prisma ORM, Inngest (cron jobs)
- **Blockchain**: Viem, ERC-7540 vaults, HyperEVM
- **Analytics**: ECharts, TanStack Query

## Setup

### Prerequisites

- Node.js v23.3.0
- PostgreSQL
- pnpm package manager

### Quick Start

```bash
# Clone and install
git clone <repository-url>
cd hyper-lp/ui
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
pnpm prisma:generate
pnpm prisma:deploy

# Start development
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

- See `.env.example` for complete list

## Community

- Twitter: [@HyperLP](https://x.com/HyperLPxyz)
- Documentation: [docs.hyperlp.xyz](https://www.notion.so/HyperLP-Docs-254bbbfcdd3780fb9d0cd5bfbab131f2)

---

Built with ❤️ for the Hyperliquid ecosystem
