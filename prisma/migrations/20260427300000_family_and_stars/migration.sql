-- FamilyMember table
CREATE TABLE IF NOT EXISTS "FamilyMember" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FamilyMember_customerId_idx" ON "FamilyMember"("customerId");

ALTER TABLE "FamilyMember"
  ADD CONSTRAINT "FamilyMember_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FamilySharing table
CREATE TABLE IF NOT EXISTS "FamilySharing" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "sharedWithPhone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilySharing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilySharing_ownerId_sharedWithPhone_key" UNIQUE ("ownerId", "sharedWithPhone")
);

CREATE INDEX IF NOT EXISTS "FamilySharing_sharedWithPhone_idx" ON "FamilySharing"("sharedWithPhone");

ALTER TABLE "FamilySharing"
  ADD CONSTRAINT "FamilySharing_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- stars on Feedback and Visit
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "stars" INTEGER;
ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "stars" INTEGER;

-- familyMemberId on Visit and WalkIn
ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "familyMemberId" TEXT;
ALTER TABLE "WalkIn" ADD COLUMN IF NOT EXISTS "familyMemberId" TEXT;

ALTER TABLE "Visit"
  ADD CONSTRAINT "Visit_familyMemberId_fkey"
  FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WalkIn"
  ADD CONSTRAINT "WalkIn_familyMemberId_fkey"
  FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- new CheckIn fields
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "familyMemberId" TEXT;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "groupMemberIds" TEXT;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "includeCustomer" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "CheckIn"
  ADD CONSTRAINT "CheckIn_familyMemberId_fkey"
  FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
