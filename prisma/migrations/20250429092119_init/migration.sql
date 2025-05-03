/*
  Warnings:

  - You are about to drop the column `checkInRate` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `revenue` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `ticketsSold` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `totalTickets` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "checkInRate",
DROP COLUMN "revenue",
DROP COLUMN "ticketsSold",
DROP COLUMN "totalTickets";
