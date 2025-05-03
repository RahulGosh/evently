-- DropForeignKey
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_eventId_fkey";

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
