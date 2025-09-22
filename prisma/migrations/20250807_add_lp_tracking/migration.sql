-- CreateTable
CREATE TABLE "LPPosition" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "dex" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "PositionSnapshot" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liquidity" TEXT NOT NULL,
    "token0Amount" DOUBLE PRECISION NOT NULL,
    "token1Amount" DOUBLE PRECISION NOT NULL,
    "token0Symbol" TEXT NOT NULL,
    "token1Symbol" TEXT NOT NULL,
    "token0Price" DOUBLE PRECISION NOT NULL,
    "token1Price" DOUBLE PRECISION NOT NULL,
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "unclaimedFees0" DOUBLE PRECISION NOT NULL,
    "unclaimedFees1" DOUBLE PRECISION NOT NULL,
    "unclaimedFeesUSD" DOUBLE PRECISION NOT NULL,
    "feeAPR" DOUBLE PRECISION NOT NULL,
    "poolTick" INTEGER NOT NULL,
    "poolSqrtPriceX96" TEXT NOT NULL,
    "inRange" BOOLEAN NOT NULL,
    "analyticsRunId" TEXT,

    CONSTRAINT "PositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsRun" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chainId" INTEGER NOT NULL DEFAULT 999finis,
    "totalPositions" INTEGER NOT NULL,
    "totalValueUSD" DOUBLE PRECISION NOT NULL,
    "totalUnclaimedFeesUSD" DOUBLE PRECISION NOT NULL,
    "averageFeeAPR" DOUBLE PRECISION NOT NULL,
    "positionsInRange" INTEGER NOT NULL,
    "hyperswapCount" INTEGER NOT NULL DEFAULT 0,
    "hyperswapValueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hyperswapAPR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prjtxCount" INTEGER NOT NULL DEFAULT 0,
    "prjtxValueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prjtxAPR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hybraCount" INTEGER NOT NULL DEFAULT 0,
    "hybraValueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hybraAPR" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AnalyticsRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "priceUSD" DOUBLE PRECISION,
    "lastPriceUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "dex" TEXT NOT NULL,
    "token0Address" TEXT NOT NULL,
    "token1Address" TEXT NOT NULL,
    "feeTier" INTEGER NOT NULL,
    "tickSpacing" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LPPosition_tokenId_dex_positionManagerAddress_key" ON "LPPosition"("tokenId", "dex", "positionManagerAddress");

-- CreateIndex
CREATE INDEX "LPPosition_ownerAddress_idx" ON "LPPosition"("ownerAddress");

-- CreateIndex
CREATE INDEX "LPPosition_dex_idx" ON "LPPosition"("dex");

-- CreateIndex
CREATE INDEX "LPPosition_token0Address_token1Address_idx" ON "LPPosition"("token0Address", "token1Address");

-- CreateIndex
CREATE INDEX "LPPosition_isActive_idx" ON "LPPosition"("isActive");

-- CreateIndex
CREATE INDEX "PositionSnapshot_positionId_idx" ON "PositionSnapshot"("positionId");

-- CreateIndex
CREATE INDEX "PositionSnapshot_timestamp_idx" ON "PositionSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "PositionSnapshot_analyticsRunId_idx" ON "PositionSnapshot"("analyticsRunId");

-- CreateIndex
CREATE INDEX "AnalyticsRun_timestamp_idx" ON "AnalyticsRun"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsRun_chainId_idx" ON "AnalyticsRun"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE INDEX "Token_chainId_idx" ON "Token"("chainId");

-- CreateIndex
CREATE INDEX "Token_symbol_idx" ON "Token"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_address_key" ON "Pool"("address");

-- CreateIndex
CREATE INDEX "Pool_dex_idx" ON "Pool"("dex");

-- CreateIndex
CREATE INDEX "Pool_token0Address_token1Address_feeTier_idx" ON "Pool"("token0Address", "token1Address", "feeTier");

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "LPPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_analyticsRunId_fkey" FOREIGN KEY ("analyticsRunId") REFERENCES "AnalyticsRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;