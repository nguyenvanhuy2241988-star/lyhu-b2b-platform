-- DEFINITIVE FIX FOR CRM
-- Run this to fix ALL issues: Missing Avatar, Missing FK, Missing Classification Columns

BEGIN;

-- 1. PROFILES: Add full_name and avatar_url if missing
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "full_name" text;
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "avatar_url" text;

-- 2. CRM DEALS: Add Classification Columns
ALTER TABLE "public"."crm_deals" ADD COLUMN IF NOT EXISTS "source_category" text;
ALTER TABLE "public"."crm_deals" ADD COLUMN IF NOT EXISTS "source_detail" text;
ALTER TABLE "public"."crm_deals" ADD COLUMN IF NOT EXISTS "customer_type" text;
ALTER TABLE "public"."crm_deals" ADD COLUMN IF NOT EXISTS "potential_level" text;

-- 3. CRM DEALS: Fix Foreign Key to Profiles (for Owner Avatar)
DO $$
BEGIN
    -- Drop constraints if they exist to ensure clean state
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_owner_profile_fkey') THEN
        ALTER TABLE "public"."crm_deals" DROP CONSTRAINT "crm_deals_owner_profile_fkey";
    END IF;
    
    -- Add the constraint back
    ALTER TABLE "public"."crm_deals"
    ADD CONSTRAINT "crm_deals_owner_profile_fkey"
    FOREIGN KEY ("owner_user_id")
    REFERENCES "public"."profiles" ("id")
    ON DELETE SET NULL;
END $$;

-- 4. CUSTOMERS: Add Classification Columns
ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "source_category" text;
ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "potential_level" text;
ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "type" text;

-- 5. REFRESH SCHEMA CACHE (By notifying PostgREST)
NOTIFY pgrst, 'reload schema';

COMMIT;
