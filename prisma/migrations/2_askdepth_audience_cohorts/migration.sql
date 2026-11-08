-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "device_type" TEXT NOT NULL DEFAULT 'desktop',
ADD COLUMN     "has_abandoned_cart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "internal_notes" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "loyalty_tier" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "marketing_opt_in" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferred_category" TEXT NOT NULL DEFAULT 'electronics',
ADD COLUMN     "segment" TEXT NOT NULL DEFAULT 'new_customer',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "users_segment_idx" ON "users"("segment");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
