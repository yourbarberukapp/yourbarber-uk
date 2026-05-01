-- AlterTable
ALTER TABLE "WalkIn" ADD COLUMN IF NOT EXISTS "presenceStatus" TEXT NOT NULL DEFAULT 'IN_SHOP';
ALTER TABLE "WalkIn" ADD COLUMN IF NOT EXISTS "standbySince" TIMESTAMP(3);
ALTER TABLE "WalkIn" ADD COLUMN IF NOT EXISTS "nudgeSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WalkIn_shopId_presenceStatus_idx" ON "WalkIn"("shopId", "presenceStatus");
