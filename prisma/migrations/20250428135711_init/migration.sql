-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'COMPLETED';
