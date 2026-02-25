-- Add priority column to hr_events for sorting (higher number = higher priority)
ALTER TABLE public.hr_events 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Update existing events to have default priority
UPDATE public.hr_events SET priority = 0 WHERE priority IS NULL;
