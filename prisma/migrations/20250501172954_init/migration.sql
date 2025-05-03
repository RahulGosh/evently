-- AlterTable
ALTER TABLE "events" ADD COLUMN     "allowSharing" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hashtags" TEXT[],
ADD COLUMN     "shareImageUrl" TEXT,
ADD COLUMN     "shareMessage" TEXT;
