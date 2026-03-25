-- ============================================
-- Hide Users from Schedule (Admin only)
-- Adds hidden_from_schedule flag to profiles
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hidden_from_schedule boolean DEFAULT false;

-- Allow admin to update this field (already covered by existing admin update policies)
-- No new RLS needed since admins already have full UPDATE on profiles
