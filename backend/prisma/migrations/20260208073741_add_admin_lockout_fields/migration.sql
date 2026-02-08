/*
  Warnings:

  - Made the column `request_count` on table `api_usage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `success_count` on table `api_usage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `failed_count` on table `api_usage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_cost` on table `api_usage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `generation_type` on table `generations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `blocked` on table `moderation_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `moderation_logs` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "PromocodeType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE', 'BONUS_CREDITS');

-- AlterTable
ALTER TABLE "api_usage" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "model" SET DATA TYPE TEXT,
ALTER COLUMN "request_count" SET NOT NULL,
ALTER COLUMN "success_count" SET NOT NULL,
ALTER COLUMN "failed_count" SET NOT NULL,
ALTER COLUMN "total_cost" SET NOT NULL;

-- AlterTable
ALTER TABLE "generations" ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "replicate_prediction_id" SET DATA TYPE TEXT,
ALTER COLUMN "generation_type" SET NOT NULL,
ALTER COLUMN "source_telegram_file_id" SET DATA TYPE TEXT,
ALTER COLUMN "mask_telegram_file_id" SET DATA TYPE TEXT,
ALTER COLUMN "result_telegram_file_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "moderation_logs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "input_type" SET DATA TYPE TEXT,
ALTER COLUMN "blocked" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_settings" ALTER COLUMN "defaultModel" SET DEFAULT 'flux-1.1-pro';

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'MODERATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocodes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromocodeType" NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "max_usages" INTEGER,
    "max_usages_per_user" INTEGER DEFAULT 1,
    "min_balance" DECIMAL(10,2),
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promocodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocode_usages" (
    "id" TEXT NOT NULL,
    "promocode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "applied_value" DECIMAL(10,4) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_id" TEXT,

    CONSTRAINT "promocode_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "admin_users_username_idx" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "admin_users_is_active_idx" ON "admin_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "promocodes_code_key" ON "promocodes"("code");

-- CreateIndex
CREATE INDEX "promocodes_code_idx" ON "promocodes"("code");

-- CreateIndex
CREATE INDEX "promocodes_is_active_idx" ON "promocodes"("is_active");

-- CreateIndex
CREATE INDEX "promocodes_expires_at_idx" ON "promocodes"("expires_at");

-- CreateIndex
CREATE INDEX "promocode_usages_promocode_id_idx" ON "promocode_usages"("promocode_id");

-- CreateIndex
CREATE INDEX "promocode_usages_user_id_idx" ON "promocode_usages"("user_id");

-- CreateIndex
CREATE INDEX "promocode_usages_used_at_idx" ON "promocode_usages"("used_at");

-- CreateIndex
CREATE INDEX "admin_logs_admin_id_idx" ON "admin_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");

-- CreateIndex
CREATE INDEX "admin_logs_created_at_idx" ON "admin_logs"("created_at");

-- RenameForeignKey
ALTER TABLE "generations" RENAME CONSTRAINT "generations_templateId_fkey" TO "generations_template_id_fkey";

-- AddForeignKey
ALTER TABLE "promocodes" ADD CONSTRAINT "promocodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocode_usages" ADD CONSTRAINT "promocode_usages_promocode_id_fkey" FOREIGN KEY ("promocode_id") REFERENCES "promocodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocode_usages" ADD CONSTRAINT "promocode_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "generations_createdAt_idx" RENAME TO "generations_created_at_idx";
