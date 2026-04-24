-- AlterTable: Shop
ALTER TABLE "Shop" ADD COLUMN "phone" TEXT;
ALTER TABLE "Shop" ADD COLUMN "about" TEXT;
ALTER TABLE "Shop" ADD COLUMN "coverPhotoUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "googleMapsUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "bookingUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "openingHours" JSONB;

-- AlterTable: Barber
ALTER TABLE "Barber" ADD COLUMN "bio" TEXT;
ALTER TABLE "Barber" ADD COLUMN "photoUrl" TEXT;

-- CreateTable: ShopPhoto
CREATE TABLE "ShopPhoto" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopPhoto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShopPhoto_shopId_idx" ON "ShopPhoto"("shopId");
ALTER TABLE "ShopPhoto" ADD CONSTRAINT "ShopPhoto_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ShopService
CREATE TABLE "ShopService" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT,
    "duration" INTEGER,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopService_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShopService_shopId_idx" ON "ShopService"("shopId");
ALTER TABLE "ShopService" ADD CONSTRAINT "ShopService_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
