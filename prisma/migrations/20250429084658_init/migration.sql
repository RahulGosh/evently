/*
  Warnings:

  - You are about to drop the column `failureMessage` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `refundDate` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "failureMessage",
DROP COLUMN "refundAmount",
DROP COLUMN "refundDate",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "OrderStatus";
