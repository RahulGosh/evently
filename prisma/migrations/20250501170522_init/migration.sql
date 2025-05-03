/*
  Warnings:

  - You are about to drop the column `earlyBirdDiscount` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `earlyBirdEndDate` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `earlyBirdIsPercentage` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `earlyBirdTicketsLimit` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `earlyBirdTicketsSold` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `isEarlyBird` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "earlyBirdDiscount",
DROP COLUMN "earlyBirdEndDate",
DROP COLUMN "earlyBirdIsPercentage",
DROP COLUMN "earlyBirdTicketsLimit",
DROP COLUMN "earlyBirdTicketsSold";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "isEarlyBird";
