-- Drop the CHECK constraint on recruitment_candidates.status
-- to allow custom Kanban board column statuses (e.g., "xin_nghi_viec")
-- The valid statuses are now managed dynamically via recruitment_board_columns table.

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find and drop all CHECK constraints on the status column
    FOR constraint_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
            AND att.attrelid = con.conrelid
        WHERE con.conrelid = 'public.recruitment_candidates'::regclass
            AND con.contype = 'c'
            AND att.attname = 'status'
    LOOP
        EXECUTE format('ALTER TABLE public.recruitment_candidates DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;
