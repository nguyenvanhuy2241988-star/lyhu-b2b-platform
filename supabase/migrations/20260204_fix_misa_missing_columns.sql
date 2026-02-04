-- Migration: Fix missing Misa columns and reload schema cache
-- Date: 2026-02-04

-- 1. Add misa_code to products and customers (Fixes 400 Bad Request error)
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "misa_code" text;
ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "misa_code" text;
ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "tax_code" text; -- Ensure tax_code exists too as it is used

-- 2. Ensure app_settings has misa_config
ALTER TABLE "public"."app_settings" ADD COLUMN IF NOT EXISTS "misa_config" jsonb DEFAULT '{}'::jsonb;

-- 3. Reload PostgREST schema cache (Fixes API not seeing new columns)
NOTIFY pgrst, 'reload config';
