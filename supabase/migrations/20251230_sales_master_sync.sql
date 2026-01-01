-- FINAL SALES SYNC: Merge all "Sales" groups and force participants
BEGIN;

-- 1. Identify "Sales" MASTER ID
DO $$
DECLARE
    v_master_id UUID;
    v_dup RECORD;
    v_user RECORD;
BEGIN
    -- Pick the oldest "Sales" group as Master
    SELECT id INTO v_master_id 
    FROM internal_conversations 
    WHERE name ILIKE 'Sales%' 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_master_id IS NULL THEN
        RAISE NOTICE 'No Sales group found. Creating one...';
        INSERT INTO internal_conversations (name, type) VALUES ('Sales', 'group') RETURNING id INTO v_master_id;
    END IF;

    RAISE NOTICE 'MASTER Sales Group ID: %', v_master_id;

    -- 2. Merge all other groups that look like "Sales"
    FOR v_dup IN (
        SELECT id, name FROM internal_conversations 
        WHERE (name ILIKE 'Sales%' OR name ILIKE 'Nhóm Bán Hàng%')
        AND id != v_master_id
    ) LOOP
        RAISE NOTICE 'Merging Duplicate Group % (%) into Master', v_dup.name, v_dup.id;

        -- Move Messages
        UPDATE internal_messages SET conversation_id = v_master_id WHERE conversation_id = v_dup.id;

        -- Move Participants
        INSERT INTO internal_participants (conversation_id, user_id)
        SELECT v_master_id, user_id FROM internal_participants WHERE conversation_id = v_dup.id
        ON CONFLICT DO NOTHING;

        -- Delete Duplicate Group
        DELETE FROM internal_conversations WHERE id = v_dup.id;
    END LOOP;

    -- 3. Force EVERYONE into the Sales Master group
    FOR v_user IN (SELECT id, email FROM profiles) LOOP
        INSERT INTO internal_participants (conversation_id, user_id)
        VALUES (v_master_id, v_user.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Synced all users to Sales Master group.';
END $$;

-- 4. Ensure RLS doesn't block Select
DROP POLICY IF EXISTS "messages_select_total_permissive" ON public.internal_messages;
CREATE POLICY "messages_select_total_permissive" 
ON public.internal_messages FOR SELECT 
TO authenticated 
USING (true);

COMMIT;
NOTIFY pgrst, 'reload config';
