-- DropForeignKey
ALTER TABLE "LPPosition" DROP CONSTRAINT IF EXISTS "LPPosition_walletId_fkey";
ALTER TABLE "PositionSnapshot" DROP CONSTRAINT IF EXISTS "PositionSnapshot_lpPositionId_fkey";
ALTER TABLE "PositionSnapshot" DROP CONSTRAINT IF EXISTS "PositionSnapshot_hedgePositionId_fkey";
ALTER TABLE "PositionSnapshot" DROP CONSTRAINT IF EXISTS "PositionSnapshot_walletId_fkey";
ALTER TABLE "HedgePosition" DROP CONSTRAINT IF EXISTS "HedgePosition_walletId_fkey";

-- DropTable
DROP TABLE IF EXISTS "PositionSnapshot";
DROP TABLE IF EXISTS "HedgePosition";
DROP TABLE IF EXISTS "MonitoredWallet";

-- CreateTable
CREATE TABLE "MonitoredAccount" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedAsset" (
    "id" TEXT NOT NULL,
    "coin" TEXT NOT NULL,
    "spotIndex" TEXT,
    "assetType" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "leverageType" TEXT NOT NULL,
    "leverage" DOUBLE PRECISION NOT NULL,
    "szi" TEXT NOT NULL,
    "entryPx" DOUBLE PRECISION NOT NULL,
    "markPx" DOUBLE PRECISION NOT NULL,
    "marginUsed" DOUBLE PRECISION NOT NULL,
    "unrealizedPnl" DOUBLE PRECISION NOT NULL,
    "closedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fundingPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "PerpPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "valuePx" DOUBLE PRECISION NOT NULL,
    "valueUSD" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LPSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liquidity" TEXT NOT NULL,
    "token0Amount" TEXT NOT NULL,
    "token1Amount" TEXT NOT NULL,
    "poolSqrtPriceX96" TEXT NOT NULL,
    "poolTick" INTEGER NOT NULL,
    "inRange" BOOLEAN NOT NULL,
    "unclaimedFees0" TEXT NOT NULL,
    "unclaimedFees1" TEXT NOT NULL,
    "feesUSD" DOUBLE PRECISION NOT NULL,
    "feeAPR" DOUBLE PRECISION,
    "token0Price" DOUBLE PRECISION NOT NULL,
    "token1Price" DOUBLE PRECISION NOT NULL,
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "deltaContribution" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LPSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "szi" TEXT NOT NULL,
    "markPx" DOUBLE PRECISION NOT NULL,
    "notionalValue" DOUBLE PRECISION NOT NULL,
    "marginUsed" DOUBLE PRECISION NOT NULL,
    "crossMarginUsed" DOUBLE PRECISION,
    "unrealizedPnl" DOUBLE PRECISION NOT NULL,
    "closedPnl" DOUBLE PRECISION NOT NULL,
    "fundingRate" DOUBLE PRECISION NOT NULL,
    "fundingPaid" DOUBLE PRECISION NOT NULL,
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "deltaContribution" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PerpSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance" TEXT NOT NULL,
    "pricePx" DOUBLE PRECISION NOT NULL,
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "deltaContribution" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SpotSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeltaConsolidation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lpDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lpValueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spotDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spotValueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perpDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perpValueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netDelta" DOUBLE PRECISION NOT NULL,
    "grossDelta" DOUBLE PRECISION NOT NULL,
    "targetDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rebalanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "needsRebalance" BOOLEAN NOT NULL DEFAULT false,
    "fundingRate" DOUBLE PRECISION,
    "lpFeeAPR" DOUBLE PRECISION,
    "netAPR" DOUBLE PRECISION,

    CONSTRAINT "DeltaConsolidation_pkey" PRIMARY KEY ("id")
);

-- Update LPPosition table
ALTER TABLE "LPPosition" DROP COLUMN IF EXISTS "walletId";
ALTER TABLE "LPPosition" DROP COLUMN IF EXISTS "ownerAddress";
ALTER TABLE "LPPosition" DROP COLUMN IF EXISTS "token0Address";
ALTER TABLE "LPPosition" DROP COLUMN IF EXISTS "token1Address";
ALTER TABLE "LPPosition" DROP COLUMN IF EXISTS "isActive";

ALTER TABLE "LPPosition" ADD COLUMN "accountId" TEXT NOT NULL;
ALTER TABLE "LPPosition" ADD COLUMN "token0Id" TEXT NOT NULL;
ALTER TABLE "LPPosition" ADD COLUMN "token1Id" TEXT NOT NULL;
ALTER TABLE "LPPosition" ADD COLUMN "liquidity" TEXT NOT NULL;
ALTER TABLE "LPPosition" ADD COLUMN "inRange" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LPPosition" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LPPosition" ADD COLUMN "closedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredAccount_address_platform_key" ON "MonitoredAccount"("address", "platform");
CREATE INDEX "MonitoredAccount_isActive_idx" ON "MonitoredAccount"("isActive");
CREATE INDEX "MonitoredAccount_platform_idx" ON "MonitoredAccount"("platform");

CREATE UNIQUE INDEX "TrackedAsset_coin_assetType_key" ON "TrackedAsset"("coin", "assetType");
CREATE INDEX "TrackedAsset_assetType_idx" ON "TrackedAsset"("assetType");
CREATE INDEX "TrackedAsset_isActive_idx" ON "TrackedAsset"("isActive");

CREATE INDEX "PerpPosition_accountId_idx" ON "PerpPosition"("accountId");
CREATE INDEX "PerpPosition_assetId_idx" ON "PerpPosition"("assetId");
CREATE INDEX "PerpPosition_isActive_idx" ON "PerpPosition"("isActive");
CREATE INDEX "PerpPosition_leverageType_idx" ON "PerpPosition"("leverageType");

CREATE UNIQUE INDEX "SpotPosition_accountId_assetId_key" ON "SpotPosition"("accountId", "assetId");
CREATE INDEX "SpotPosition_isActive_idx" ON "SpotPosition"("isActive");

CREATE INDEX "LPSnapshot_accountId_idx" ON "LPSnapshot"("accountId");
CREATE INDEX "LPSnapshot_positionId_idx" ON "LPSnapshot"("positionId");
CREATE INDEX "LPSnapshot_timestamp_idx" ON "LPSnapshot"("timestamp");

CREATE INDEX "PerpSnapshot_accountId_idx" ON "PerpSnapshot"("accountId");
CREATE INDEX "PerpSnapshot_positionId_idx" ON "PerpSnapshot"("positionId");
CREATE INDEX "PerpSnapshot_timestamp_idx" ON "PerpSnapshot"("timestamp");

CREATE INDEX "SpotSnapshot_accountId_idx" ON "SpotSnapshot"("accountId");
CREATE INDEX "SpotSnapshot_positionId_idx" ON "SpotSnapshot"("positionId");
CREATE INDEX "SpotSnapshot_timestamp_idx" ON "SpotSnapshot"("timestamp");

CREATE INDEX "DeltaConsolidation_accountId_idx" ON "DeltaConsolidation"("accountId");
CREATE INDEX "DeltaConsolidation_assetId_idx" ON "DeltaConsolidation"("assetId");
CREATE INDEX "DeltaConsolidation_timestamp_idx" ON "DeltaConsolidation"("timestamp");
CREATE INDEX "DeltaConsolidation_needsRebalance_idx" ON "DeltaConsolidation"("needsRebalance");

-- Update LPPosition indexes
DROP INDEX IF EXISTS "LPPosition_ownerAddress_idx";
DROP INDEX IF EXISTS "LPPosition_walletId_idx";
DROP INDEX IF EXISTS "LPPosition_token0Address_token1Address_idx";

CREATE INDEX "LPPosition_accountId_idx" ON "LPPosition"("accountId");
CREATE INDEX "LPPosition_poolAddress_idx" ON "LPPosition"("poolAddress");
CREATE INDEX "LPPosition_inRange_idx" ON "LPPosition"("inRange");

-- AddForeignKey
ALTER TABLE "LPPosition" ADD CONSTRAINT "LPPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LPPosition" ADD CONSTRAINT "LPPosition_token0Id_fkey" FOREIGN KEY ("token0Id") REFERENCES "TrackedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LPPosition" ADD CONSTRAINT "LPPosition_token1Id_fkey" FOREIGN KEY ("token1Id") REFERENCES "TrackedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PerpPosition" ADD CONSTRAINT "PerpPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PerpPosition" ADD CONSTRAINT "PerpPosition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "TrackedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SpotPosition" ADD CONSTRAINT "SpotPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpotPosition" ADD CONSTRAINT "SpotPosition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "TrackedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LPSnapshot" ADD CONSTRAINT "LPSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LPSnapshot" ADD CONSTRAINT "LPSnapshot_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "LPPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerpSnapshot" ADD CONSTRAINT "PerpSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PerpSnapshot" ADD CONSTRAINT "PerpSnapshot_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PerpPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpotSnapshot" ADD CONSTRAINT "SpotSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpotSnapshot" ADD CONSTRAINT "SpotSnapshot_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "SpotPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeltaConsolidation" ADD CONSTRAINT "DeltaConsolidation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MonitoredAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeltaConsolidation" ADD CONSTRAINT "DeltaConsolidation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "TrackedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;