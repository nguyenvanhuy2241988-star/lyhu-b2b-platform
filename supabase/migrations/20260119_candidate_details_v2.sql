-- 1. Safely add columns if they don't exist
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS experience_years TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS expected_salary TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS availability_date TIMESTAMPTZ;

-- 2. Handle rating column
-- First add it if missing
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS rating INT DEFAULT 0;

-- 3. Fix Warning/Errors on Constraints
-- Drop the old strict constraint if it exists (the one that required rating >= 1)
ALTER TABLE recruitment_candidates DROP CONSTRAINT IF EXISTS recruitment_candidates_rating_check;

-- Add the correct constraint (allowing 0)
ALTER TABLE recruitment_candidates ADD CONSTRAINT recruitment_candidates_rating_check CHECK (rating >= 0 AND rating <= 5);

-- 4. Update comments
COMMENT ON COLUMN recruitment_candidates.experience_years IS 'Number of years of experience';
COMMENT ON COLUMN recruitment_candidates.expected_salary IS 'Expected salary range or value';
COMMENT ON COLUMN recruitment_candidates.rating IS '0-5 star rating (0 = unrated)';
