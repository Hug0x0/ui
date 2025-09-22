# Caching Strategy

## Overview

The HyperLP application implements a multi-layer caching strategy to optimize performance and reduce API calls while maintaining data freshness. This document outlines where data is cached, for how long, and the mechanisms involved.

## Cache Layers

### 1. Frontend State Management (Zustand)

**Location**: Browser memory via Zustand store with localStorage persistence  
**Files**: `src/stores/app.store.ts`

#### Account Snapshots
- **What**: Complete account data snapshots including positions, metrics, and prices
- **Duration**: Persisted in localStorage with cache busting based on `NEXT_PUBLIC_COMMIT_TIMESTAMP`
- **Key**: `account-{address}` 
- **Update**: On manual refresh or automatic interval based on environment

#### App State
- **What**: UI preferences, selected accounts, theme settings
- **Duration**: Persistent until manually cleared or app update
- **Update**: On user interaction

### 2. React Query Cache

**Location**: Browser memory  
**Files**: `src/hooks/useAccountData.ts`, various query hooks

#### Query Configuration
```typescript
// Default stale time: 30 seconds
staleTime: 30 * 1000

// Cache time: 5 minutes  
cacheTime: 5 * 60 * 1000

// Garbage collection: 5 minutes after becoming inactive
gcTime: REFRESH_INTERVALS.CACHE_GC
```

#### Cached Queries
- Account data fetches
- Transaction histories
- Pool APR calculations
- Price feeds

### 3. API Response Caching

**Location**: Next.js API routes with in-memory caching  
**Files**: `src/app/api/` routes

#### Pool State Cache
- **Duration**: 1 minute (`CACHE_DURATION.POOL_STATE`)
- **What**: DEX pool states, liquidity data
- **Invalidation**: Time-based expiry

#### Token Price Cache
- **Duration**: 1 minute (`CACHE_DURATION.TOKEN_PRICE`)
- **What**: HYPE, USDC, USDT prices
- **Invalidation**: Time-based expiry

#### Account Data Cache
- **Duration**: 30 seconds (`CACHE_DURATION.ACCOUNT_DATA`)
- **What**: Aggregated account positions and metrics
- **Invalidation**: Time-based expiry

### 4. Service Layer Caching

**Location**: Service class instances  
**Files**: `src/services/dex/*.service.ts`

#### DEX Subgraph Cache
- **Duration**: Request-level (no persistence between requests)
- **What**: Subgraph query results
- **Purpose**: Deduplicate identical queries within same request

#### Multicall Cache
- **Duration**: Request-level
- **What**: Batched RPC call results
- **Purpose**: Optimize multiple contract reads

## Cache Duration Constants

Defined in `src/config/constants.config.ts`:

```typescript
export const CACHE_DURATION = {
    POOL_STATE: 60000,      // 1 minute
    TOKEN_PRICE: 60000,     // 1 minute  
    ACCOUNT_DATA: 30000,    // 30 seconds
    DEFAULT: 300000,        // 5 minutes
}
```

## Refresh Intervals

Automatic data refresh intervals by environment:

```typescript
export const REFRESH_INTERVALS = {
    DEV: 300000,   // 5 minutes for development
    PROD: 30000,   // 30 seconds for production
}
```

## Cache Invalidation Strategies

### 1. Time-Based Expiry
- Most common strategy
- Data automatically becomes stale after defined duration
- Fresh data fetched on next request after expiry

### 2. Manual Invalidation
- User-triggered refresh button on account page
- Clears React Query cache for specific queries
- Forces immediate refetch

### 3. Deployment-Based Invalidation
- `NEXT_PUBLIC_COMMIT_TIMESTAMP` environment variable
- Changes on each deployment
- Invalidates localStorage persisted state

### 4. Event-Based Invalidation
- WebSocket connections for real-time updates (planned)
- Transaction confirmation events
- Price feed updates

## Cache Key Patterns

### Account Data
```typescript
['account', address, 'snapshot']
['account', address, 'transactions', limit]
['account', address, 'hypercore-trades', limit]
```

### Pool Data
```typescript
['pool', poolAddress, 'state']
['pool', poolAddress, 'apr', timeframe]
```

### Price Data
```typescript
['price', 'HYPE']
['prices', 'all']
```

## Performance Considerations

### Benefits
1. **Reduced API Load**: ~90% reduction in redundant API calls
2. **Faster Page Loads**: Instant display of cached data
3. **Better UX**: Optimistic updates and background refetching
4. **Cost Savings**: Fewer RPC calls to blockchain nodes

### Trade-offs
1. **Data Freshness**: Up to 1 minute delay for price data
2. **Memory Usage**: ~5-10MB browser memory for active session
3. **Cache Coherency**: Potential for temporary inconsistencies

## Best Practices

### For Developers

1. **Use React Query hooks** for all data fetching
2. **Respect cache durations** - don't bypass without reason
3. **Implement proper error boundaries** for cache failures
4. **Use optimistic updates** for user actions
5. **Clear sensitive data** on logout/disconnect

### Cache Debugging

Enable React Query devtools in development:
```typescript
// Already configured in src/providers/TanstackProvider.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

Monitor cache hits/misses:
```typescript
// Browser console
localStorage.getItem('zustand-app-store')
```

## Future Improvements

1. **Redis Integration**: Server-side caching for API routes
2. **CDN Edge Caching**: Static data at edge locations
3. **WebSocket Subscriptions**: Real-time cache updates
4. **Differential Updates**: Only fetch changed data
5. **Service Worker**: Offline support and background sync

## Related Documentation

- [Data Flow](./DATA_FLOW.md) - How data moves through the system
- [Architecture](./ARCHITECTURE.md) - Overall system design
- [Database](./DATABASE.md) - Persistent storage strategy