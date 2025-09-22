-- Check if tables already exist and handle accordingly

-- 1. Handle LPPosition.accountId column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'LPPosition' 
        AND column_name = 'accountId'
    ) THEN
        ALTER TABLE "LPPosition" ADD COLUMN "accountId" TEXT;
    END IF;
END $$;

-- 2. Create MonitoredAccount table if it doesn't exist
CREATE TABLE IF NOT EXISTS "MonitoredAccount" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonitoredAccount_pkey" PRIMARY KEY ("id")
);

-- 3. Create PerpPosition table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PerpPosition" (
    "id" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "accountId" TEXT,
    "asset" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "notionalValue" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "markPrice" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "leverage" DOUBLE PRECISION NOT NULL,
    "unrealizedPnl" DOUBLE PRECISION NOT NULL,
    "realizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fundingPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentFundingRate" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerpPosition_pkey" PRIMARY KEY ("id")
);

-- 4. Create unified LpPositionSnapshot table if it doesn't exist
CREATE TABLE IF NOT EXISTS "LpPositionSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Common fields
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "netDelta" DOUBLE PRECISION NOT NULL,
    
    -- LP-specific fields
    "lpPositionId" TEXT,
    "liquidity" TEXT,
    "token0Amount" DOUBLE PRECISION,
    "token1Amount" DOUBLE PRECISION,
    "token0Symbol" TEXT,
    "token1Symbol" TEXT,
    "token0Price" DOUBLE PRECISION,
    "token1Price" DOUBLE PRECISION,
    "unclaimedFees0" DOUBLE PRECISION,
    "unclaimedFees1" DOUBLE PRECISION,
    "unclaimedFeesUSD" DOUBLE PRECISION,
    "feeAPR" DOUBLE PRECISION,
    "poolTick" INTEGER,
    "poolSqrtPriceX96" TEXT,
    "inRange" BOOLEAN,
    
    CONSTRAINT "LpPositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- 5. Create PerpPositionSnapshot table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PerpPositionSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Common fields
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "netDelta" DOUBLE PRECISION NOT NULL,
    
    -- Perp-specific fields
    "perpPositionId" TEXT,
    "asset" TEXT,
    "size" DOUBLE PRECISION,
    "markPrice" DOUBLE PRECISION,
    "notionalValue" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "unrealizedPnl" DOUBLE PRECISION,
    "fundingRate" DOUBLE PRECISION,
    "fundingPaid" DOUBLE PRECISION,
    
    CONSTRAINT "PerpPositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "MonitoredAccount_address_key" ON "MonitoredAccount"("address");
CREATE INDEX IF NOT EXISTS "MonitoredAccount_isActive_idx" ON "MonitoredAccount"("isActive");
CREATE INDEX IF NOT EXISTS "MonitoredAccount_address_idx" ON "MonitoredAccount"("address");
CREATE INDEX IF NOT EXISTS "PerpPosition_accountAddress_idx" ON "PerpPosition"("accountAddress");
CREATE INDEX IF NOT EXISTS "PerpPosition_accountId_idx" ON "PerpPosition"("accountId");
CREATE INDEX IF NOT EXISTS "PerpPosition_asset_idx" ON "PerpPosition"("asset");
CREATE INDEX IF NOT EXISTS "PerpPosition_isActive_idx" ON "PerpPosition"("isActive");
CREATE INDEX IF NOT EXISTS "LpPositionSnapshot_accountId_idx" ON "LpPositionSnapshot"("accountId");
CREATE INDEX IF NOT EXISTS "LpPositionSnapshot_timestamp_idx" ON "LpPositionSnapshot"("timestamp");
CREATE INDEX IF NOT EXISTS "LpPositionSnapshot_lpPositionId_idx" ON "LpPositionSnapshot"("lpPositionId");
CREATE INDEX IF NOT EXISTS "PerpPositionSnapshot_accountId_idx" ON "PerpPositionSnapshot"("accountId");
CREATE INDEX IF NOT EXISTS "PerpPositionSnapshot_timestamp_idx" ON "PerpPositionSnapshot"("timestamp");
CREATE INDEX IF NOT EXISTS "PerpPositionSnapshot_perpPositionId_idx" ON "PerpPositionSnapshot"("perpPositionId");
CREATE INDEX IF NOT EXISTS "LPPosition_accountId_idx" ON "LPPosition"("accountId");

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LPPosition_accountId_fkey'
    ) THEN
        ALTER TABLE "LPPosition" ADD CONSTRAINT "LPPosition_accountId_fkey" 
        FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PerpPosition_accountId_fkey'
    ) THEN
        ALTER TABLE "PerpPosition" ADD CONSTRAINT "PerpPosition_accountId_fkey" 
        FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LpPositionSnapshot_lpPositionId_fkey'
    ) THEN
        ALTER TABLE "LpPositionSnapshot" ADD CONSTRAINT "LpPositionSnapshot_lpPositionId_fkey" 
        FOREIGN KEY ("lpPositionId") REFERENCES "LPPosition"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PerpPositionSnapshot_perpPositionId_fkey'
    ) THEN
        ALTER TABLE "PerpPositionSnapshot" ADD CONSTRAINT "PerpPositionSnapshot_perpPositionId_fkey" 
        FOREIGN KEY ("perpPositionId") REFERENCES "PerpPosition"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'LpPositionSnapshot_accountId_fkey'
    ) THEN
        ALTER TABLE "LpPositionSnapshot" ADD CONSTRAINT "LpPositionSnapshot_accountId_fkey" 
        FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PerpPositionSnapshot_accountId_fkey'
    ) THEN
        ALTER TABLE "PerpPositionSnapshot" ADD CONSTRAINT "PerpPositionSnapshot_accountId_fkey" 
        FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;