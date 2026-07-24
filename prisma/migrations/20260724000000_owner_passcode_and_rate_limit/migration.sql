ALTER TABLE "Barber" ADD COLUMN "ownerPasscode" TEXT;
ALTER TABLE "Barber" ADD COLUMN "ownerPassAuthToken" TEXT;
ALTER TABLE "Barber" ADD COLUMN "ownerPassSerialNumber" TEXT;
CREATE UNIQUE INDEX "Barber_ownerPasscode_key" ON "Barber"("ownerPasscode");
CREATE UNIQUE INDEX "Barber_ownerPassSerialNumber_key" ON "Barber"("ownerPassSerialNumber");

CREATE TABLE "RateLimitBucket" (
    "bucketKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("bucketKey")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
