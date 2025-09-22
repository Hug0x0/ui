-- CreateTable
CREATE TABLE "public"."AccountSnapshot" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "evmAddress" TEXT NOT NULL,
    "coreAddress" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "totalUSD" DECIMAL(38,18) NOT NULL,
    "netDeltaHYPE" DECIMAL(38,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiUser" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "queryCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ApiUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountSnapshot_address_idx" ON "public"."AccountSnapshot"("address");

-- CreateIndex
CREATE INDEX "AccountSnapshot_timestamp_idx" ON "public"."AccountSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "AccountSnapshot_evmAddress_idx" ON "public"."AccountSnapshot"("evmAddress");

-- CreateIndex
CREATE INDEX "AccountSnapshot_coreAddress_idx" ON "public"."AccountSnapshot"("coreAddress");

-- CreateIndex
CREATE INDEX "AccountSnapshot_address_timestamp_idx" ON "public"."AccountSnapshot"("address", "timestamp");

-- CreateIndex
CREATE INDEX "AccountSnapshot_evmAddress_timestamp_idx" ON "public"."AccountSnapshot"("evmAddress", "timestamp");

-- CreateIndex
CREATE INDEX "AccountSnapshot_coreAddress_timestamp_idx" ON "public"."AccountSnapshot"("coreAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSnapshot_address_timestamp_key" ON "public"."AccountSnapshot"("address", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUser_address_key" ON "public"."ApiUser"("address");

-- CreateIndex
CREATE INDEX "ApiUser_firstSeen_idx" ON "public"."ApiUser"("firstSeen");

-- CreateIndex
CREATE INDEX "ApiUser_lastSeen_idx" ON "public"."ApiUser"("lastSeen");
