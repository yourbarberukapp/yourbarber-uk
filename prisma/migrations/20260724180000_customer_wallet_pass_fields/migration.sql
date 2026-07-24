-- Consolidated fix for pre-existing schema drift discovered while working on
-- the shop microsite feature: these were all added to schema.prisma during
-- the original Apple/Google Wallet integration but no migration was ever
-- written for them (passAuthToken/passUpdatedAt/passMessage were caught
-- separately in 20260723000000_wallet_push_fields).

ALTER TABLE "Customer" ADD COLUMN "applePassSerialNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN "googlePassId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "loyaltyStamps" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Customer_applePassSerialNumber_key" ON "Customer"("applePassSerialNumber");
CREATE UNIQUE INDEX "Customer_googlePassId_key" ON "Customer"("googlePassId");

CREATE TABLE "BarberPass" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarberPass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarberPass_barberId_key" ON "BarberPass"("barberId");
CREATE UNIQUE INDEX "BarberPass_serialNumber_key" ON "BarberPass"("serialNumber");
CREATE UNIQUE INDEX "BarberPass_qrToken_key" ON "BarberPass"("qrToken");

ALTER TABLE "BarberPass" ADD CONSTRAINT "BarberPass_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WalletDevice" (
    "id" TEXT NOT NULL,
    "deviceLibraryIdentifier" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "passTypeIdentifier" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WalletDevice_deviceLibraryIdentifier_serialNumber_key" ON "WalletDevice"("deviceLibraryIdentifier", "serialNumber");
CREATE INDEX "WalletDevice_serialNumber_idx" ON "WalletDevice"("serialNumber");

ALTER TABLE "WalletDevice" ADD CONSTRAINT "WalletDevice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
