-- Fix Permissions for App Settings (Fixes "Not Saving" issue)
-- Date: 2026-02-04

-- 1. Ensure table exists and has RLS enabled
CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "company_info" jsonb DEFAULT '{}'::jsonb,
    "automation_config" jsonb DEFAULT '{}'::jsonb,
    "misa_config" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to authenticated users (so Accountant can read/update)
CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."app_settings" FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable update access for all authenticated users" 
ON "public"."app_settings" FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Ensure distinct Row exists (Insert if empty)
INSERT INTO "public"."app_settings" ("company_info", "automation_config", "misa_config")
SELECT '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "public"."app_settings");

-- 4. Reload Schema cache again just in case
NOTIFY pgrst, 'reload config';
