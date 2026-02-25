-- FIX: ENABLE DELETE RLS AND WIPE DATA (V3)
-- Issue: Previous wipe likely blocked by RLS because I didn't enable DELETE permissions.
-- Solution: Grant DELETE permission and then wipe.

BEGIN;

-- 1. Grant DELETE Policies (Authenticated Users)
drop policy if exists "Enable delete access for authenticated users" on public.internal_conversations;
CREATE POLICY "Enable delete access for authenticated users"
    ON public.internal_conversations FOR DELETE
    USING (auth.role() = 'authenticated');

drop policy if exists "Enable delete access for authenticated users" on public.internal_participants;
CREATE POLICY "Enable delete access for authenticated users"
    ON public.internal_participants FOR DELETE
    USING (auth.role() = 'authenticated');

drop policy if exists "Enable delete access for authenticated users" on public.internal_messages;
CREATE POLICY "Enable delete access for authenticated users"
    ON public.internal_messages FOR DELETE
    USING (auth.role() = 'authenticated');


-- 2. EXECUTE WIPE (Again)
-- Now that we have permission, this should actually work.
DELETE FROM public.internal_conversations
WHERE type IS DISTINCT FROM 'channel';

COMMIT;
