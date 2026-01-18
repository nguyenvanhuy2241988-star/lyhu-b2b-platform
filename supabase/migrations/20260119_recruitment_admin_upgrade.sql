-- Add Deadline and Employment Type columns
ALTER TABLE public.recruitment_jobs
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'Toàn thời gian'; -- Full-time

-- Optional: Add check constraint for employment_type if we want strict enum, 
-- but usually text is more flexible for "Hợp đồng", "Thực tập", etc.

COMMIT;
