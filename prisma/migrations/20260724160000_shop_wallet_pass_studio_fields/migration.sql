-- Shop-level Wallet Pass Studio + loyalty config fields (schema.prisma had these
-- for the Pass Studio / loyalty stamp feature, but a migration was never written).
ALTER TABLE "Shop" ADD COLUMN "passAccentColor" TEXT DEFAULT '#111111';
ALTER TABLE "Shop" ADD COLUMN "passLabelColor" TEXT DEFAULT '#C8F135';
ALTER TABLE "Shop" ADD COLUMN "passStripUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN "loyaltyTarget" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Shop" ADD COLUMN "loyaltyReward" TEXT NOT NULL DEFAULT '50% Off 5th Cut';
ALTER TABLE "Shop" ADD COLUMN "promoMessage" TEXT;
