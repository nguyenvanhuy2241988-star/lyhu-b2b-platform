-- Add job_type column to distinguish between Facebook Group, Page, and Google Maps
ALTER TABLE public.marketing_scrape_jobs 
ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'fb_group';

-- Add keywords column for Google Maps search queries
ALTER TABLE public.marketing_scrape_jobs 
ADD COLUMN IF NOT EXISTS keywords TEXT;

-- Update the check constraint or comments if necessary (optional documentation)
COMMENT ON COLUMN public.marketing_scrape_jobs.job_type IS 'Type of scrape job: fb_group, fb_page, google_maps';
COMMENT ON COLUMN public.marketing_scrape_jobs.keywords IS 'Search keywords for Google Maps or other search-based scrapers';
