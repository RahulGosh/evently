/*
  Warnings:

  - You are about to drop the column `discountApplied` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `promoCodeId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `early_bird_discounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promo_codes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "early_bird_discounts" DROP CONSTRAINT "early_bird_discounts_eventId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "promo_codes" DROP CONSTRAINT "promo_codes_createdById_fkey";

-- DropForeignKey
ALTER TABLE "promo_codes" DROP CONSTRAINT "promo_codes_eventId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "discountApplied",
DROP COLUMN "promoCodeId",
ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountAmount" TEXT;

-- DropTable
DROP TABLE "early_bird_discounts";

-- DropTable
DROP TABLE "promo_codes";

-- DropEnum
DROP TYPE "DiscountType";

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_eventId_key" ON "coupons"("code", "eventId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
