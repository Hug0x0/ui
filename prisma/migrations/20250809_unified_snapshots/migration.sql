-- CreateTable LPPosition if not exists
CREATE TABLE IF NOT EXISTS "LPPosition" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "dex" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "walletId" TEXT,
    "poolAddress" TEXT,
    "positionManagerAddress" TEXT NOT NULL,
    "token0Address" TEXT NOT NULL,
    "token1Address" TEXT NOT NULL,
    "feeTier" INTEGER NOT NULL,
    "tickLower" INTEGER NOT NULL,
    "tickUpper" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LPPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable MonitoredWallet if not exists
CREATE TABLE IF NOT EXISTS "MonitoredWallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable HedgePosition if not exists
CREATE TABLE IF NOT EXISTS "HedgePosition" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletId" TEXT,
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

    CONSTRAINT "HedgePosition_pkey" PRIMARY KEY ("id")
);

-- Drop old snapshot tables if they exist
DROP TABLE IF EXISTS "HedgeSnapshot" CASCADE;
DROP TABLE IF EXISTS "PositionSnapshotEnhanced" CASCADE;

-- Rename existing PositionSnapshot if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PositionSnapshot') THEN
        ALTER TABLE "PositionSnapshot" RENAME TO "PositionSnapshot_old";
    END IF;
END $$;

-- CreateTable unified PositionSnapshot
CREATE TABLE "PositionSnapshot" (
    "id" TEXT NOT NULL,
    "walletId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotType" TEXT NOT NULL,
    
    -- Common fields
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "deltaExposure" DOUBLE PRECISION NOT NULL,
    
    -- LP-specific fields (nullable for hedge snapshots)
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
    
    -- Hedge-specific fields (nullable for LP snapshots)
    "hedgePositionId" TEXT,
    "asset" TEXT,
    "size" DOUBLE PRECISION,
    "markPrice" DOUBLE PRECISION,
    "notionalValue" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "unrealizedPnl" DOUBLE PRECISION,
    "fundingRate" DOUBLE PRECISION,
    "fundingPaid" DOUBLE PRECISION,

    CONSTRAINT "PositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- Migrate data from old PositionSnapshot if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PositionSnapshot_old') THEN
        INSERT INTO "PositionSnapshot" (
            "id", "timestamp", "snapshotType", "totalValueUSD", "deltaExposure",
            "lpPositionId", "liquidity", "token0Amount", "token1Amount",
            "token0Symbol", "token1Symbol", "token0Price", "token1Price",
            "unclaimedFees0", "unclaimedFees1", "unclaimedFeesUSD", "feeAPR",
            "poolTick", "poolSqrtPriceX96", "inRange"
        )
        SELECT 
            "id", "timestamp", 'LP', "totalValueUSD", 0,
            "positionId", "liquidity", "token0Amount", "token1Amount",
            "token0Symbol", "token1Symbol", "token0Price", "token1Price",
            "unclaimedFees0", "unclaimedFees1", "unclaimedFeesUSD", "feeAPR",
            "poolTick", "poolSqrtPriceX96", "inRange"
        FROM "PositionSnapshot_old";
        
        DROP TABLE "PositionSnapshot_old";
    END IF;
END $$;

-- CreateIndex for LPPosition
CREATE UNIQUE INDEX IF NOT EXISTS "LPPosition_tokenId_dex_positionManagerAddress_key" ON "LPPosition"("tokenId", "dex", "positionManagerAddress");
CREATE INDEX IF NOT EXISTS "LPPosition_ownerAddress_idx" ON "LPPosition"("ownerAddress");
CREATE INDEX IF NOT EXISTS "LPPosition_walletId_idx" ON "LPPosition"("walletId");
CREATE INDEX IF NOT EXISTS "LPPosition_dex_idx" ON "LPPosition"("dex");
CREATE INDEX IF NOT EXISTS "LPPosition_token0Address_token1Address_idx" ON "LPPosition"("token0Address", "token1Address");
CREATE INDEX IF NOT EXISTS "LPPosition_isActive_idx" ON "LPPosition"("isActive");

-- CreateIndex for PositionSnapshot
CREATE INDEX "PositionSnapshot_walletId_idx" ON "PositionSnapshot"("walletId");
CREATE INDEX "PositionSnapshot_timestamp_idx" ON "PositionSnapshot"("timestamp");
CREATE INDEX "PositionSnapshot_snapshotType_idx" ON "PositionSnapshot"("snapshotType");
CREATE INDEX "PositionSnapshot_lpPositionId_idx" ON "PositionSnapshot"("lpPositionId");
CREATE INDEX "PositionSnapshot_hedgePositionId_idx" ON "PositionSnapshot"("hedgePositionId");

-- CreateIndex for MonitoredWallet
CREATE UNIQUE INDEX IF NOT EXISTS "MonitoredWallet_address_key" ON "MonitoredWallet"("address");
CREATE INDEX IF NOT EXISTS "MonitoredWallet_isActive_idx" ON "MonitoredWallet"("isActive");
CREATE INDEX IF NOT EXISTS "MonitoredWallet_address_idx" ON "MonitoredWallet"("address");

-- CreateIndex for HedgePosition
CREATE INDEX IF NOT EXISTS "HedgePosition_walletAddress_idx" ON "HedgePosition"("walletAddress");
CREATE INDEX IF NOT EXISTS "HedgePosition_walletId_idx" ON "HedgePosition"("walletId");
CREATE INDEX IF NOT EXISTS "HedgePosition_asset_idx" ON "HedgePosition"("asset");
CREATE INDEX IF NOT EXISTS "HedgePosition_isActive_idx" ON "HedgePosition"("isActive");

-- AddForeignKey
ALTER TABLE "LPPosition" ADD CONSTRAINT "LPPosition_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MonitoredWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_lpPositionId_fkey" FOREIGN KEY ("lpPositionId") REFERENCES "LPPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_hedgePositionId_fkey" FOREIGN KEY ("hedgePositionId") REFERENCES "HedgePosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MonitoredWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HedgePosition" ADD CONSTRAINT "HedgePosition_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MonitoredWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;