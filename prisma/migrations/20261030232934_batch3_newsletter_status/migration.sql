-- AlterTable
ALTER TABLE "Newsletter" ADD COLUMN     "error" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'sending';

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "confirmationSentAt" TIMESTAMP(3);
