# Data Flow Architecture

## Overview

This document describes how data flows through the HyperLP application from user interaction to blockchain and back to the UI.

## Complete Data Flow

```
User Interaction
    ↓
React Component (page.tsx)
    ↓
Custom Hook (useAccountData)
    ↓
TanStack Query (React Query)
    ↓
API Route Handler (/api/positions/[account])
    ↓
Service Layer (position-fetcher.util.ts)
    ↓
Blockchain RPC (Viem + Multicall)
    ↓
Data Processing & Calculations
    ↓
Response (AccountSnapshot interface)
    ↓
Zustand Store (Optional caching)
    ↓
React Component (Re-render with data)
```

## Detailed Flow Breakdown

### 1. Component Layer
**File**: `src/app/account/[account]/page.tsx`

```tsx
// Component initiates data fetch
export default function AccountPage({ params }) {
  const { data, isLoading, error } = useAccountData(params.account)
  // Renders UI based on data state
}
```

### 2. Hook Layer
**File**: `src/hooks/useAccountData.ts`

```tsx
// Custom hook using TanStack Query
export function useAccountData(address: string) {
  return useQuery({
    queryKey: ['account', address],
    queryFn: () => fetchAccountData(address),
    staleTime: 60 * 1000,      // Consider data fresh for 60s
    cacheTime: 5 * 60 * 1000,   // Keep in cache for 5 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every 60s
  })
}
```

### 3. API Layer
**File**: `src/app/api/positions/[account]/route.ts`

```tsx
// API route handler
export async function GET(request, { params }) {
  const { account } = params
  
  // Call service layer
  const data = await positionFetcher.fetchAccountSnapshot(account)
  
  // Return AccountSnapshot interface
  return Response.json(data)
}
```

### 4. Service Layer
**File**: `src/utils/position-fetcher.util.ts`

Key responsibilities:
- **Multicall Batching**: Groups blockchain calls
- **Parallel Fetching**: LP, spot, and perp data simultaneously
- **Price Integration**: Fetches current token prices
- **Delta Calculations**: Computes exposure metrics
- **Error Handling**: Graceful fallbacks

```tsx
async fetchAccountSnapshot(address: string): Promise<AccountSnapshot> {
  // 1. Fetch all positions in parallel
  const [lpPositions, spotBalances, perpPositions, evmBalances] = await Promise.all([
    this.fetchLPPositions(address),      // HyperEVM DEX positions
    this.fetchSpotBalances(address),     // HyperCore spot
    this.fetchPerpPositions(address),    // HyperCore perps
    this.fetchEvmBalances(address)       // HyperEVM wallet
  ])
  
  // 2. Calculate metrics
  const metrics = this.calculateMetrics(positions)
  
  // 3. Return structured data
  return {
    success: true,
    timestamp: Date.now(),
    positions: { ... },
    metrics: { ... },
    prices: { ... },
    timings: { ... }
  }
}
```

### 5. Blockchain Layer
**Technologies**: 
- **Viem**: Ethereum client for RPC calls
- **Multicall3**: Batch multiple calls in one request
- **HyperEVM RPC**: Blockchain node connection

```tsx
// Multicall example - fetches multiple LP positions in one RPC call
const results = await multicall({
  contracts: tokenIds.map(id => ({
    address: POSITION_MANAGER,
    abi: positionManagerABI,
    functionName: 'positions',
    args: [id]
  }))
})
```

### 6. State Management (Optional)
**File**: `src/stores/account.store.ts`

Zustand store for client-side caching:
```tsx
interface AccountStore {
  snapshots: Map<string, AccountSnapshot>
  setSnapshot: (address: string, data: AccountSnapshot) => void
  getSnapshot: (address: string) => AccountSnapshot | undefined
}
```

## Data Caching Strategy

### Three Levels of Caching:

1. **Service Level** (60 seconds)
   - In-memory cache in position-fetcher
   - Prevents duplicate RPC calls
   - Token prices cached

2. **React Query** (5 minutes)
   - Client-side cache
   - Automatic background refetch
   - Optimistic updates

3. **Zustand Store** (Session)
   - Optional persistent storage
   - Cross-component state sharing
   - Survives navigation

## Error Handling Flow

```
Try Fetch Data
    ↓
RPC Error? → Return cached data if available
    ↓
Network Error? → Show user-friendly message
    ↓
Invalid Address? → Return empty state
    ↓
Partial Success? → Return available data with warnings
```

## Performance Optimizations

### 1. Multicall Batching
- **Before**: 100+ individual RPC calls
- **After**: 5-10 batched calls
- **Result**: 10-20x faster

### 2. Parallel Processing
```tsx
// All platform data fetched simultaneously
Promise.all([
  fetchHyperEvmData(),  // LP positions + balances
  fetchHyperCoreData()  // Perps + spots
])
```

### 3. Progressive Loading
- Show available data immediately
- Load expensive calculations async
- Update UI as data arrives

## Real-time Updates

### Current Implementation
- **Polling**: Auto-refetch every 60 seconds
- **Manual Refresh**: User-triggered updates
- **Focus Refetch**: Updates when tab regains focus

### Future WebSocket Integration
```
WebSocket Connection
    ↓
Price Updates (real-time)
    ↓
Position Updates (on-chain events)
    ↓
Push to React Query cache
    ↓
Auto re-render components
```

## API Response Structure

The `AccountSnapshot` interface is the contract between backend and frontend:

```typescript
interface AccountSnapshot {
  success: boolean
  error?: string
  timestamp: number
  
  positions: {
    hyperEvm: { lps: LPPosition[], balances: HyperEvmBalance[] }
    hyperCore: { perps: PerpPosition[], spots: SpotBalance[] }
  }
  
  metrics: {
    hyperEvm: { values: {...}, deltas: {...} }
    hyperCore: { values: {...}, deltas: {...} }
    portfolio: { totalUSD: number, netDeltaHYPE: number }
  }
  
  marketData: { poolAPR?: AggregatedPoolAPR }
  prices: { HYPE: number, USDC: number, USDT: number }
  timings: { hyperEvm: {...}, hyperCore: {...} }
}
```

## Example: Complete User Journey

1. **User navigates** to `/account/0x123...`
2. **Page component** renders, calls `useAccountData(0x123...)`
3. **React Query** checks cache (miss on first load)
4. **API call** to `/api/positions/0x123...`
5. **API handler** calls `positionFetcher.fetchAccountSnapshot()`
6. **Service** makes parallel blockchain calls via multicall
7. **Blockchain** returns raw position data
8. **Service** calculates metrics, formats response
9. **API** returns `AccountSnapshot` JSON
10. **React Query** caches response, updates hook
11. **Component** re-renders with data
12. **UI displays** positions, metrics, and charts

## Monitoring & Debugging

### Key Points to Monitor:
- API response times (target: <2s)
- RPC call count (target: <10 per request)
- Cache hit rates (target: >80%)
- Error rates (target: <1%)

### Debug Tools:
- React Query DevTools
- Network tab for API calls
- Console logs for service layer
- RPC provider metrics

## Future Enhancements

1. **GraphQL Integration**: Replace REST with GraphQL for flexible queries
2. **Subscription Model**: WebSocket for real-time updates
3. **Edge Caching**: CDN cache for static data
4. **Database Layer**: Historical data from monitoring DB
5. **Worker Threads**: Offload calculations to web workers