-- Migration: Add Misa Sync fields to orders table and Misa Config to app_settings
-- Date: 2026-02-04

-- 1. Orders Table Updates
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "misa_sync_status" text DEFAULT 'pending', -- pending, synced, failed
ADD COLUMN IF NOT EXISTS "misa_ref_id" text,
ADD COLUMN IF NOT EXISTS "misa_sync_error" text,
ADD COLUMN IF NOT EXISTS "misa_last_sync_at" timestamp with time zone;

-- Create index for faster filtering by sync status
CREATE INDEX IF NOT EXISTS "idx_orders_misa_sync" ON "public"."orders" ("misa_sync_status");

-- Add comments
COMMENT ON COLUMN "public"."orders"."misa_sync_status" IS 'Trạng thái đồng bộ Misa: pending, synced, failed';
COMMENT ON COLUMN "public"."orders"."misa_ref_id" IS 'ID chứng từ trên Misa sau khi sync thành công';

-- 2. App Settings Updates
-- Check if column exists first to avoid error if re-running (though IF NOT EXISTS handles it usually)
ALTER TABLE "public"."app_settings" 
ADD COLUMN IF NOT EXISTS "misa_config" jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN "public"."app_settings"."misa_config" IS 'Cấu hình kết nối Misa: client_id, secret, etc.';
