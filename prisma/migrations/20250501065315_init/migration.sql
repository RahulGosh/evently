-- AlterTable
ALTER TABLE "events" ADD COLUMN     "earlyBirdDiscount" DOUBLE PRECISION,
ADD COLUMN     "earlyBirdEndDate" TIMESTAMP(3),
ADD COLUMN     "earlyBirdIsPercentage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "earlyBirdTicketsLimit" INTEGER,
ADD COLUMN     "earlyBirdTicketsSold" INTEGER NOT NULL DEFAULT 0;
