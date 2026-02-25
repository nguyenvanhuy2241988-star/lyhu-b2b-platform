-- Migration: Phase 6 (Multi-Posters)
-- Date: 2026-01-30 (Part 2)

BEGIN;

-- Helper add column
CREATE OR REPLACE FUNCTION add_column_if_not_exists(t text, c text, ty text, d text DEFAULT NULL) 
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = c) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s %s', t, c, ty, CASE WHEN d IS NOT NULL THEN 'DEFAULT ' || d ELSE '' END);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add Poster Columns
SELECT add_column_if_not_exists('weekly_schedules', 'poster_url_2', 'text');
SELECT add_column_if_not_exists('weekly_schedules', 'poster_url_3', 'text');

DROP FUNCTION add_column_if_not_exists;
COMMIT;
