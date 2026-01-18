-- Fix rating constraint to allow 0 (default value)
ALTER TABLE recruitment_candidates DROP CONSTRAINT IF EXISTS recruitment_candidates_rating_check;
ALTER TABLE recruitment_candidates ADD CONSTRAINT recruitment_candidates_rating_check CHECK (rating >= 0 AND rating <= 5);
