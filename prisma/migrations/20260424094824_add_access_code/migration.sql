-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "accessCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_accessCode_key" ON "Customer"("accessCode");
