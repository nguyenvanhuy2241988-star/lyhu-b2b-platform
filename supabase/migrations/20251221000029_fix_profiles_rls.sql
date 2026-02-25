-- FIX: RLS for Profiles & Deduplicate Channels

BEGIN;

-- 1. Fix Profiles RLS (Allow all authenticated users to read profiles)
-- This is critical for the Chat Directory to work
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING ( auth.role() = 'authenticated' );

-- 2. Deduplicate Channels
-- Keep the OLDEST channel for each name, delete newer duplicates
DELETE FROM public.internal_conversations
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (partition BY name, type ORDER BY created_at ASC) as r_num
        FROM public.internal_conversations
        WHERE type = 'channel'
    ) t
    WHERE t.r_num > 1
);

-- 3. Ensure all users are in the remaining public channels
insert into public.internal_participants (conversation_id, user_id, joined_at)
select c.id, u.id, now()
from public.internal_conversations c
cross join auth.users u
where c.type = 'channel' and c.is_public = true
on conflict (conversation_id, user_id) do nothing;

COMMIT;
