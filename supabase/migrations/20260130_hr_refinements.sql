-- Migration: HR Refinements Phase 3 (Poster, Theme, Shift Note)
-- Date: 2026-01-30

BEGIN;

-- 1. Helper Function to add column if not exists
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    t_name text, 
    c_name text, 
    c_type text,
    c_default text DEFAULT NULL
) 
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = c_name) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s %s', t_name, c_name, c_type, CASE WHEN c_default IS NOT NULL THEN 'DEFAULT ' || c_default ELSE '' END);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Weekly Schedules: Add Poster & Theme Color
SELECT add_column_if_not_exists('weekly_schedules', 'poster_url', 'text');
SELECT add_column_if_not_exists('weekly_schedules', 'theme_color', 'text', '''#0d9488'''); -- Default Teal

-- 3. Shift Registrations: Add Note (Per-shift note)
SELECT add_column_if_not_exists('shift_registrations', 'note', 'text');

-- 4. Cleanup old Weekly User Notes (Optional - we can keep for backup or drop)
-- DROP TABLE IF EXISTS public.weekly_schedule_user_notes; -- Keeping it safe for now

-- 5. Drop helper
DROP FUNCTION add_column_if_not_exists;

COMMIT;
