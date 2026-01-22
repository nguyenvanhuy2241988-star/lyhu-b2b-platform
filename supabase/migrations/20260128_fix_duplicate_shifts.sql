-- Migration: Robust Deduplication of Work Shifts
-- Purpose: Fix duplicate shifts by merging references and handling FK constraints strictly based on NAME.

BEGIN;

-- 1. Create a temporary mapping of duplicates to their masters
--    Master = The one with the oldest created_at (or smallest ID if tie)
CREATE TEMP TABLE duplicate_map AS
SELECT
    dup.id AS duplicate_id,
    master.id AS master_id
FROM
    public.work_shifts dup
JOIN
    public.work_shifts master ON dup.name = master.name
WHERE
    -- Condition for being a duplicate: master is "better" (older or smaller ID)
    (dup.created_at > master.created_at) OR 
    (dup.created_at = master.created_at AND dup.id > master.id);

-- 2. Handle collisions in shift_registrations
--    If a user registered for both the Master and the Duplicate on the same day,
--    delete the registration for the Duplicate (since Master registration takes precedence).
DELETE FROM public.shift_registrations sr
USING duplicate_map map
WHERE sr.shift_id = map.duplicate_id
  AND EXISTS (
      SELECT 1 FROM public.shift_registrations sr2
      WHERE sr2.shift_id = map.master_id
      AND sr2.user_id = sr.user_id
        -- Ensure we match on non-unique columns that define the "slot"
      AND sr2.date = sr.date
  );

-- 3. Migrate remaining registrations from Duplicate to Master
UPDATE public.shift_registrations sr
SET shift_id = map.master_id
FROM duplicate_map map
WHERE sr.shift_id = map.duplicate_id;

-- 4. Delete the Duplicate shifts from work_shifts
DELETE FROM public.work_shifts
WHERE id IN (SELECT duplicate_id FROM duplicate_map);

-- 5. Add Unique Constraint on 'name' to prevent future recursion
--    We drop it first just in case it partially existed or to be safe
ALTER TABLE public.work_shifts DROP CONSTRAINT IF EXISTS work_shifts_name_unique;
ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_name_unique UNIQUE (name);

-- 6. Clean up
DROP TABLE duplicate_map;

COMMIT;
