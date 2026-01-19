-- Add extended profile fields to recruitment_candidates
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS hometown TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS id_card_front TEXT;
ALTER TABLE recruitment_candidates ADD COLUMN IF NOT EXISTS id_card_back TEXT;

COMMENT ON COLUMN recruitment_candidates.education IS 'Education level or university';
COMMENT ON COLUMN recruitment_candidates.hometown IS 'Place of origin';
COMMENT ON COLUMN recruitment_candidates.address IS 'Current resident address';
COMMENT ON COLUMN recruitment_candidates.id_card_front IS 'URL to front image of ID card';
COMMENT ON COLUMN recruitment_candidates.id_card_back IS 'URL to back image of ID card';
