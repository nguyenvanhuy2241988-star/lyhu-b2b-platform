-- Add new columns for detailed candidate information
ALTER TABLE recruitment_candidates 
ADD COLUMN IF NOT EXISTS experience_years TEXT,
ADD COLUMN IF NOT EXISTS expected_salary TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT, -- Stored as comma-separated string
ADD COLUMN IF NOT EXISTS availability_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 0;

-- Refresh cache permissions if needed (though existing policies should cover new columns)
COMMENT ON COLUMN recruitment_candidates.experience_years IS 'Number of years of experience';
COMMENT ON COLUMN recruitment_candidates.expected_salary IS 'Expected salary range or value';
COMMENT ON COLUMN recruitment_candidates.current_company IS 'Current or most recent company';
COMMENT ON COLUMN recruitment_candidates.skills IS 'Comma-separated list of skills';
COMMENT ON COLUMN recruitment_candidates.rating IS '1-5 star rating';
