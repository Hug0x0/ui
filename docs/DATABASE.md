# Database Configuration

## Current Architecture

### Active: TypeScript Interfaces
The current data schema is defined in TypeScript interfaces:
- **Main Schema**: `src/interfaces/account.interface.ts`
- **AccountSnapshot**: Single source of truth for account data
- **Real-time fetching**: Direct from blockchain, no database persistence yet

### Future: Monitoring Database (Not Active)
- **Connection**: `DATABASE_URL_MONITORING`
- **Schema**: `prisma/monitoring/schema.prisma`
- **Purpose**: Will store position snapshots and analytics
- **Status**: Schema defined but not yet integrated

### Future: Keeper Database (Not Active)
- **Connection**: `DATABASE_URL_KEEPER`
- **Schema**: `prisma/keeper/schema.prisma`
- **Purpose**: Keeper configurations and strategies
- **Status**: Schema defined but not yet integrated

## Setup

### Environment Variables
```env
DATABASE_URL_MONITORING="postgresql://..."
DATABASE_URL_KEEPER="postgresql://..."
```

### Commands
```bash
# Generate Prisma clients
pnpm prisma:generate

# Migrations
pnpm prisma:monitoring:migrate   # Dev migration for monitoring
pnpm prisma:keeper:migrate       # Dev migration for keeper
pnpm prisma:deploy               # Deploy both to production

# Studio (GUI)
pnpm prisma:monitoring:studio   # Port 5556
pnpm prisma:keeper:studio       # Port 5557
```

## Migration Management

### Development Workflow
1. Edit schema files
2. Create migration: `pnpm prisma:[db]:migrate`
3. Test thoroughly
4. Check sync: `pnpm db:sync`
5. Deploy to prod: `pnpm db:migrate:prod`

### Best Practices
- ✅ Create migrations in dev first
- ✅ Test before applying to prod
- ✅ Keep migrations small and focused
- ❌ Never delete migration files
- ❌ Never edit existing migrations
- ❌ Never use `db push` in production

## Vercel Deployment

### Critical Configuration
- Output paths MUST be in `src/generated/`
- Binary targets: `["native", "rhel-openssl-3.0.x"]`
- Post-install runs `prisma:generate`

### Build Script
```json
"vercel-build": "pnpm prisma:generate && pnpm prisma:deploy && next build"
```

## Usage

### Import Clients
```typescript
import { prismaMonitoring } from '@/lib/prisma-monitoring'
import { prismaKeeper } from '@/lib/prisma-keeper'
```

### Import Types
```typescript
import type { MonitoredAccount } from '@/generated/prisma-monitoring'
import type { KeeperConfig } from '@/generated/prisma-keeper'
```

## Troubleshooting

### Query Engine Not Found
- Ensure output in `src/generated/`
- Check binary targets include `rhel-openssl-3.0.x`
- Verify post-install runs

### Databases Out of Sync
1. Run `pnpm db:sync` to check status
2. Apply missing migrations
3. If needed, reset and start fresh