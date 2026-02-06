-- Migration: Add Flux Integration
-- Description: Add support for Replicate/Flux API integration

-- 1. Add new enum values to GenerationStatus
ALTER TYPE "GenerationStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "GenerationStatus" ADD VALUE IF NOT EXISTS 'MODERATED';

-- 2. Create GenerationType enum
DO $$ BEGIN
    CREATE TYPE "GenerationType" AS ENUM ('TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE', 'INPAINTING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add new columns to generations table
ALTER TABLE "generations"
ADD COLUMN IF NOT EXISTS "replicate_prediction_id" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "generation_type" "GenerationType" DEFAULT 'TEXT_TO_IMAGE',
ADD COLUMN IF NOT EXISTS "guidance" DOUBLE PRECISION DEFAULT 3.5,
ADD COLUMN IF NOT EXISTS "steps" INTEGER DEFAULT 28,
ADD COLUMN IF NOT EXISTS "seed" INTEGER,
ADD COLUMN IF NOT EXISTS "strength" DOUBLE PRECISION DEFAULT 0.75,
ADD COLUMN IF NOT EXISTS "source_telegram_file_id" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "mask_image_url" TEXT,
ADD COLUMN IF NOT EXISTS "mask_telegram_file_id" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "result_url" TEXT,
ADD COLUMN IF NOT EXISTS "result_telegram_file_id" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "moderation_reason" TEXT,
ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);

-- 4. Rename columns for consistency (if they exist with old names)
DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "createdAt" TO "created_at";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "processingStartedAt" TO "processing_started_at";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "processingEndedAt" TO "processing_ended_at";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "sourceImageUrl" TO "source_image_url";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "generatedImageUrl" TO "generated_image_url";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "negativePrompt" TO "negative_prompt";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "templateId" TO "template_id";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "aspectRatio" TO "aspect_ratio";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "errorMessage" TO "error_message";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "generations" RENAME COLUMN "externalId" TO "external_id";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- 5. Create unique index on replicate_prediction_id
CREATE UNIQUE INDEX IF NOT EXISTS "generations_replicate_prediction_id_key"
ON "generations"("replicate_prediction_id");

-- 6. Create index on replicate_prediction_id for faster lookups
CREATE INDEX IF NOT EXISTS "generations_replicate_prediction_id_idx"
ON "generations"("replicate_prediction_id");

-- 7. Update cost column precision (from 10,2 to 10,4)
ALTER TABLE "generations"
ALTER COLUMN "cost" TYPE DECIMAL(10,4);

-- 8. Make width and height nullable
ALTER TABLE "generations"
ALTER COLUMN "width" DROP NOT NULL,
ALTER COLUMN "height" DROP NOT NULL;

-- 9. Create api_usage table
CREATE TABLE IF NOT EXISTS "api_usage" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "request_count" INTEGER DEFAULT 0,
    "success_count" INTEGER DEFAULT 0,
    "failed_count" INTEGER DEFAULT 0,
    "total_cost" DECIMAL(10,4) DEFAULT 0,
    CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_usage_user_id_date_model_key" ON "api_usage"("user_id", "date", "model");
CREATE INDEX IF NOT EXISTS "api_usage_date_idx" ON "api_usage"("date");

-- 10. Create moderation_logs table
CREATE TABLE IF NOT EXISTS "moderation_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "user_id" TEXT NOT NULL,
    "generation_id" TEXT,
    "input_type" VARCHAR(50) NOT NULL,
    "input_content" TEXT NOT NULL,
    "blocked" BOOLEAN DEFAULT false,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moderation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "moderation_logs_user_id_idx" ON "moderation_logs"("user_id");
CREATE INDEX IF NOT EXISTS "moderation_logs_blocked_idx" ON "moderation_logs"("blocked");
CREATE INDEX IF NOT EXISTS "moderation_logs_created_at_idx" ON "moderation_logs"("created_at");
