/*
  Warnings:

  - You are about to drop the column `allowSharing` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `hashtags` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `shareImageUrl` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `shareMessage` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "allowSharing",
DROP COLUMN "hashtags",
DROP COLUMN "shareImageUrl",
DROP COLUMN "shareMessage";
