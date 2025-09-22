-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Dex" AS ENUM ('HYPERSWAP', 'PRJTX', 'HYBRA', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Asset" AS ENUM ('HYPE', 'USDT0', 'USDC', 'BTC', 'ETH', 'OTHER');

-- CreateTable
CREATE TABLE "public"."MonitoredAccount" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasHyperEvm" BOOLEAN NOT NULL DEFAULT true,
    "hasHyperCore" BOOLEAN NOT NULL DEFAULT true,
    "hyperEvmAddress" TEXT,
    "hyperCoreAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lpValue" DECIMAL(38,18) NOT NULL,
    "perpValue" DECIMAL(38,18) NOT NULL,
    "spotValue" DECIMAL(38,18) NOT NULL,
    "netDelta" DECIMAL(38,18) NOT NULL,
    "lpFeeAPR" DECIMAL(20,10) NOT NULL,
    "fundingAPR" DECIMAL(20,10) NOT NULL,
    "netAPR" DECIMAL(20,10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LpPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "dex" "public"."Dex" NOT NULL,
    "token0Symbol" TEXT NOT NULL,
    "token1Symbol" TEXT NOT NULL,
    "liquidity" DECIMAL(38,18) NOT NULL,
    "tickLower" INTEGER NOT NULL,
    "tickUpper" INTEGER NOT NULL,
    "inRange" BOOLEAN NOT NULL,
    "poolAddress" TEXT,
    "feeTier" INTEGER,
    "valueUSD" DECIMAL(38,18) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LpPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerpPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "szi" DECIMAL(38,18) NOT NULL,
    "entryPx" DECIMAL(38,18) NOT NULL,
    "markPx" DECIMAL(38,18) NOT NULL,
    "marginUsed" DECIMAL(38,18) NOT NULL,
    "unrealizedPnl" DECIMAL(38,18) NOT NULL,
    "fundingPaid" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerpPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpotBalance" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "asset" "public"."Asset" NOT NULL,
    "balance" DECIMAL(38,18) NOT NULL,
    "valueUSD" DECIMAL(38,18) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredAccount_address_key" ON "public"."MonitoredAccount"("address");

-- CreateIndex
CREATE INDEX "MonitoredAccount_isActive_idx" ON "public"."MonitoredAccount"("isActive");

-- CreateIndex
CREATE INDEX "MonitoredAccount_hasHyperEvm_idx" ON "public"."MonitoredAccount"("hasHyperEvm");

-- CreateIndex
CREATE INDEX "MonitoredAccount_hasHyperCore_idx" ON "public"."MonitoredAccount"("hasHyperCore");

-- CreateIndex
CREATE INDEX "AccountSnapshot_timestamp_idx" ON "public"."AccountSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "AccountSnapshot_accountId_timestamp_idx" ON "public"."AccountSnapshot"("accountId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSnapshot_accountId_timestamp_key" ON "public"."AccountSnapshot"("accountId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "LpPosition_tokenId_key" ON "public"."LpPosition"("tokenId");

-- CreateIndex
CREATE INDEX "LpPosition_accountId_idx" ON "public"."LpPosition"("accountId");

-- CreateIndex
CREATE INDEX "LpPosition_inRange_idx" ON "public"."LpPosition"("inRange");

-- CreateIndex
CREATE INDEX "PerpPosition_accountId_asset_idx" ON "public"."PerpPosition"("accountId", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "PerpPosition_accountId_asset_key" ON "public"."PerpPosition"("accountId", "asset");

-- CreateIndex
CREATE INDEX "SpotBalance_accountId_asset_idx" ON "public"."SpotBalance"("accountId", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "SpotBalance_accountId_asset_key" ON "public"."SpotBalance"("accountId", "asset");

-- AddForeignKey
ALTER TABLE "public"."AccountSnapshot" ADD CONSTRAINT "AccountSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."MonitoredAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LpPosition" ADD CONSTRAINT "LpPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."MonitoredAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerpPosition" ADD CONSTRAINT "PerpPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."MonitoredAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpotBalance" ADD CONSTRAINT "SpotBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."MonitoredAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

