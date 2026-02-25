-- TOTAL CHAT SYNC: Merge duplicates and sync participants
BEGIN;

-- 1. Permissive RLS (Ensure everyone can see messages for now)
DROP POLICY IF EXISTS "messages_select_participant" ON public.internal_messages;
DROP POLICY IF EXISTS "messages_select_permissive" ON public.internal_messages;
drop policy if exists "messages_select_total_permissive" on public.internal_messages;
CREATE POLICY "messages_select_total_permissive" 
ON public.internal_messages FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2. Merge Duplicate Groups (Same Name)
DO $$
DECLARE
    r RECORD;
    v_keep_id UUID;
BEGIN
    FOR r IN (
        SELECT name, count(*) 
        FROM internal_conversations 
        WHERE type = 'group' AND name IS NOT NULL
        GROUP BY name 
        HAVING count(*) > 1
    ) LOOP
        -- Oldest survives
        SELECT id INTO v_keep_id 
        FROM internal_conversations 
        WHERE name = r.name AND type = 'group'
        ORDER BY created_at ASC 
        LIMIT 1;

        RAISE NOTICE 'Merging group % into %', r.name, v_keep_id;

        UPDATE internal_messages SET conversation_id = v_keep_id 
        WHERE conversation_id IN (SELECT id FROM internal_conversations WHERE name = r.name AND type = 'group' AND id != v_keep_id);

        INSERT INTO internal_participants (conversation_id, user_id)
        SELECT v_keep_id, user_id FROM internal_participants 
        WHERE conversation_id IN (SELECT id FROM internal_conversations WHERE name = r.name AND type = 'group' AND id != v_keep_id)
        ON CONFLICT DO NOTHING;

        DELETE FROM internal_conversations WHERE name = r.name AND type = 'group' AND id != v_keep_id;
    END LOOP;
END $$;

-- 3. Sync "Sales" Group Participants
-- Ensure EVERYONE in the profiles table is a participant of the "Sales" group(s)
DO $$
DECLARE
    v_sales_id UUID;
    v_user RECORD;
BEGIN
    FOR v_sales_id IN (SELECT id FROM internal_conversations WHERE name ILIKE 'Sales%') LOOP
        FOR v_user IN (SELECT id FROM profiles) LOOP
            INSERT INTO internal_participants (conversation_id, user_id)
            VALUES (v_sales_id, v_user.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

COMMIT;
NOTIFY pgrst, 'reload config';
