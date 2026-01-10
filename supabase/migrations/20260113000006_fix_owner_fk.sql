-- FIX: Add explicit Foreign Key from crm_deals to profiles to allow joining
-- Error was: "Could not find a relationship between 'crm_deals' and 'profiles'"

-- 1. Add/Update the Foreign Key constraint
ALTER TABLE "public"."crm_deals"
DROP CONSTRAINT IF EXISTS crm_deals_owner_profile_fkey; -- Remove if exists to be safe

ALTER TABLE "public"."crm_deals"
ADD CONSTRAINT crm_deals_owner_profile_fkey
FOREIGN KEY (owner_user_id)
REFERENCES public.profiles (id)
ON DELETE SET NULL;

-- 2. Grant access (just in case)
GRANT REFERENCES ON public.profiles TO authenticated;
GRANT REFERENCES ON public.profiles TO service_role;
