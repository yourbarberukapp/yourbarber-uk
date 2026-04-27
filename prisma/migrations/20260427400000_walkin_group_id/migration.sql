ALTER TABLE "WalkIn" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
CREATE INDEX IF NOT EXISTS "WalkIn_groupId_idx" ON "WalkIn"("groupId");
