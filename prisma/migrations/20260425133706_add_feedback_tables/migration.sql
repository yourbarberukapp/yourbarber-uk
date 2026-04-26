-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "preferredReminderWeeks" INTEGER,
ADD COLUMN     "primaryBarberId" TEXT;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "defaultReminderWeeks" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "cutRating" TEXT,
ADD COLUMN     "reminderScheduledAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "issue" TEXT,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackTicket" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unresolved',
    "resolution" TEXT,
    "assignedBarberId" TEXT,
    "preferredDate" TIMESTAMP(3),
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_shopId_createdAt_idx" ON "Feedback"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_customerId_createdAt_idx" ON "Feedback"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_visitId_idx" ON "Feedback"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackTicket_feedbackId_key" ON "FeedbackTicket"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackTicket_status_createdAt_idx" ON "FeedbackTicket"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_primaryBarberId_fkey" FOREIGN KEY ("primaryBarberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackTicket" ADD CONSTRAINT "FeedbackTicket_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackTicket" ADD CONSTRAINT "FeedbackTicket_assignedBarberId_fkey" FOREIGN KEY ("assignedBarberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
