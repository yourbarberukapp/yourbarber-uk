-- AlterTable
ALTER TABLE "Barber" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "Barber" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
CREATE UNIQUE INDEX "Barber_resetToken_key" ON "Barber"("resetToken");
