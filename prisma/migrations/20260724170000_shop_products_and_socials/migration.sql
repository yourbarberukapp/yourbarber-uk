ALTER TABLE "Shop" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "xUrl" TEXT;

CREATE TABLE "ShopProduct" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "imageUrl" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopProduct_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShopProduct_shopId_idx" ON "ShopProduct"("shopId");

ALTER TABLE "ShopProduct" ADD CONSTRAINT "ShopProduct_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
