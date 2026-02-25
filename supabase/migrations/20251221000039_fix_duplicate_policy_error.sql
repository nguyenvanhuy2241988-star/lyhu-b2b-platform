-- FIX: RESOLVE "ALREADY EXISTS" ERROR (V5)
-- The error "policy already exists" happened because we didn't drop the new name before creating it.
-- This script safely DROPS ALL potential policy names before re-creating them.

BEGIN;

-- =================================================================
-- 1. INTERNAL_PARTICIPANTS (The most critical one)
-- =================================================================

-- Drop RECURSIVE/BAD policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.internal_participants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_participants;
DROP POLICY IF EXISTS "Authenticated users can select participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.internal_participants;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_participants;

-- Drop the NEW name if it already exists (This fixes the 42710 error)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_participants;

-- Create the single, simple policy
drop policy if exists "Allow all for authenticated users" on public.internal_participants;
CREATE POLICY "Allow all for authenticated users"
    ON public.internal_participants
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- =================================================================
-- 2. INTERNAL_CONVERSATIONS
-- =================================================================
DROP POLICY IF EXISTS "Users can view conversations they are in" ON public.internal_conversations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_conversations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_conversations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_conversations; -- Drop potential duplicate

drop policy if exists "Allow all for authenticated users" on public.internal_conversations;
CREATE POLICY "Allow all for authenticated users"
    ON public.internal_conversations
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- =================================================================
-- 3. INTERNAL_MESSAGES
-- =================================================================
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.internal_messages;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.internal_messages; -- Drop potential duplicate

drop policy if exists "Allow all for authenticated users" on public.internal_messages;
CREATE POLICY "Allow all for authenticated users"
    ON public.internal_messages
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- =================================================================
-- 4. FINAL WIPE (Still needed to clear the bad data)
-- =================================================================
DELETE FROM public.internal_conversations
WHERE type IS DISTINCT FROM 'channel';

COMMIT;
