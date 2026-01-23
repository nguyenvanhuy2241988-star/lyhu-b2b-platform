-- Migration to backfill source_category from legacy source column

UPDATE crm_deals 
SET source_category = 'MARKETING' 
WHERE source = 'data_moi' AND source_category IS NULL;

UPDATE crm_deals 
SET source_category = 'SELF_FOUND' 
WHERE source = 'self_found' AND source_category IS NULL;

UPDATE crm_deals 
SET source_category = 'COMPANY' 
WHERE source_category IS NULL; -- Default remaining to COMPANY (including referral, inbound etc for now, or map them if needed)

-- Optional: Map 'referral' to something? For now map 'referral', 'inbound' to COMPANY or keep as is?
-- The requirements only specify COMPANY, SELF_FOUND, MARKETING.
-- 'referral', 'inbound', 'reactivation' -> Let's map to COMPANY for category, usually.
-- Or better, leave them as is? But UI only has 3 filters.
-- Let's stick to the 3 main categories requested.
