-- Add schemaVersion column with default value
ALTER TABLE "AccountSnapshot" 
ADD COLUMN IF NOT EXISTS "schemaVersion" TEXT DEFAULT '1.0.0';

-- Add indexed columns for chart series data
ALTER TABLE "AccountSnapshot"
ADD COLUMN IF NOT EXISTS "totalUSD" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "deployedAUM" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "netDeltaHYPE" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "strategyDelta" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "lpsDeltaHYPE" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "balancesDeltaHYPE" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "perpsDeltaHYPE" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "spotsDeltaHYPE" DECIMAL(38, 18),
ADD COLUMN IF NOT EXISTS "hypePrice" DECIMAL(38, 18);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "AccountSnapshot_schemaVersion_idx" ON "AccountSnapshot"("schemaVersion");
CREATE INDEX IF NOT EXISTS "AccountSnapshot_schemaVersion_timestamp_idx" ON "AccountSnapshot"("schemaVersion", "timestamp");
CREATE INDEX IF NOT EXISTS "AccountSnapshot_address_timestamp_totalUSD_idx" ON "AccountSnapshot"("address", "timestamp", "totalUSD");
CREATE INDEX IF NOT EXISTS "AccountSnapshot_address_timestamp_deployedAUM_idx" ON "AccountSnapshot"("address", "timestamp", "deployedAUM");
CREATE INDEX IF NOT EXISTS "AccountSnapshot_address_timestamp_netDeltaHYPE_idx" ON "AccountSnapshot"("address", "timestamp", "netDeltaHYPE");
CREATE INDEX IF NOT EXISTS "AccountSnapshot_address_timestamp_strategyDelta_idx" ON "AccountSnapshot"("address", "timestamp", "strategyDelta");