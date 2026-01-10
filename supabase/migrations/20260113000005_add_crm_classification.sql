-- 1. Ensure owner_user_id links to profiles using standard FK
-- Note: It might already be linked to auth.users, but checking/adding explicit link if needed
-- Actually, best practice is to rely on implicit link or check if we can query profiles.
-- Supabase usually allows joining if FK exists.
-- crm_deals.owner_user_id -> auth.users.id

-- 2. Add Lead Classification Columns
ALTER TABLE "public"."crm_deals"
ADD COLUMN IF NOT EXISTS "source_category" text, -- 'SELF_FOUND', 'COMPANY'
ADD COLUMN IF NOT EXISTS "source_detail" text,   -- 'Ads', 'Direct', 'Referral'
ADD COLUMN IF NOT EXISTS "customer_type" text,   -- 'RETAIL', 'AGENCY'
ADD COLUMN IF NOT EXISTS "potential_level" text; -- 'HOT', 'WARM', 'COLD'

-- Add to customers table as well for sync
ALTER TABLE "public"."customers"
ADD COLUMN IF NOT EXISTS "type" text, -- Already exists? Checking
ADD COLUMN IF NOT EXISTS "potential_level" text,
ADD COLUMN IF NOT EXISTS "source_category" text;

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_deals_source_category ON "public"."crm_deals" ("source_category");
CREATE INDEX IF NOT EXISTS idx_crm_deals_potential_level ON "public"."crm_deals" ("potential_level");

-- 4. Enable RLS (Should be already enabled, just ensuring)
ALTER TABLE "public"."crm_deals" ENABLE ROW LEVEL SECURITY;
