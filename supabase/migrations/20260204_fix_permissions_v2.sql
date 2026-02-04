-- Fix Permissions V2: Drop existing policies first to avoid error 42710
-- Date: 2026-02-04

-- 1. Drop existing policies if they exist (to clean up)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."app_settings";
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON "public"."app_settings";

-- 2. Grant permissions to authenticated users (Read & Update)
CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."app_settings" FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable update access for all authenticated users" 
ON "public"."app_settings" FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Ensure INSERT permission also exists (in case we need to create the row)
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON "public"."app_settings";
CREATE POLICY "Enable insert access for all authenticated users" 
ON "public"."app_settings" FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Ensure distinct Row exists (Insert if empty)
INSERT INTO "public"."app_settings" ("company_info", "automation_config", "misa_config")
SELECT '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "public"."app_settings");

-- 5. Reload Schema cache
NOTIFY pgrst, 'reload config';
