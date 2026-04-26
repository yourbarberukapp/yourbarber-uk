-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "shopType" TEXT DEFAULT 'uk_general';

-- CreateTable
CREATE TABLE "ShopStyle" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopStyle_shopId_category_idx" ON "ShopStyle"("shopId", "category");

-- CreateIndex
CREATE INDEX "ShopStyle_shopId_active_idx" ON "ShopStyle"("shopId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ShopStyle_shopId_name_key" ON "ShopStyle"("shopId", "name");

-- AddForeignKey
ALTER TABLE "ShopStyle" ADD CONSTRAINT "ShopStyle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
