ALTER TABLE "Customer" ADD COLUMN "passAuthToken" TEXT;
ALTER TABLE "Customer" ADD COLUMN "passUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "passMessage" TEXT;

-- SMS removed: drop OTP fields and the SmsLog table entirely.
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "otpCode";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "otpExpiry";
DROP TABLE IF EXISTS "SmsLog";
