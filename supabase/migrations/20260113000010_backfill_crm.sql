-- Backfill data to make badges visible
-- Run this in Supabase SQL Editor

-- 1. Backfill Source Category (Default to 'COMPANY' for old deals)
UPDATE crm_deals
SET source_category = 'COMPANY'
WHERE source_category IS NULL;

-- 2. Backfill Potential Level (Default to 'WARM' if missing)
-- (Only if you want to see badges for all)
UPDATE crm_deals
SET potential_level = 'WARM'
WHERE potential_level IS NULL;

-- 3. Ensure Profiles have at least a placeholder avatar if missing
-- (Optional: checks if it helps appear the avatar)
-- UPDATE profiles
-- SET avatar_url = 'https://ui-avatars.com/api/?name=' || COALESCE(full_name, 'User') || '&background=random'
-- WHERE avatar_url IS NULL;
