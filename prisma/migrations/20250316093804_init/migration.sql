/*
  Warnings:

  - You are about to drop the column `startDateTimcloue` on the `events` table. All the data in the column will be lost.
  - Added the required column `startDateTime` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "startDateTimcloue",
ADD COLUMN     "startDateTime" TIMESTAMP(3) NOT NULL;
