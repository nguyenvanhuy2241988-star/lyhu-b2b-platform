-- Add avatar_url to profiles to fix CRM join error
ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "avatar_url" text;

-- Also try to sync from auth.users (Optional, helpful if data exists)
-- This is a best-effort sync for existing users
UPDATE public.profiles p
SET avatar_url = (
    SELECT raw_user_meta_data->>'avatar_url'
    FROM auth.users u
    WHERE u.id = p.id
)
WHERE p.avatar_url IS NULL;
