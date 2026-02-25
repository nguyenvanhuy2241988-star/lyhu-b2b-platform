-- Create table for tracking scraping jobs
CREATE TABLE IF NOT EXISTS public.marketing_scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    target_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    apify_run_id TEXT,
    result_count INT DEFAULT 0,
    processed_count INT DEFAULT 0,
    error_message TEXT
);

-- Enable RLS
ALTER TABLE public.marketing_scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for reading: Users can see jobs they created, or Admins/Marketing can see all
CREATE POLICY "Users can view their own scrape jobs" 
ON public.marketing_scrape_jobs FOR SELECT 
USING (
    user_id = auth.uid() 
    OR 
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role in ('admin', 'marketing', 'sale_admin')
    )
);

-- Policy for inserting: Authenticated users (marketing role mainly) can create jobs
CREATE POLICY "Marketing users can create scrape jobs" 
ON public.marketing_scrape_jobs FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);

-- Policy for updating: Users can update their own jobs (e.g. to mark as cancelled), or system via service role
CREATE POLICY "Users can update their own scrape jobs" 
ON public.marketing_scrape_jobs FOR UPDATE 
USING (
    user_id = auth.uid() 
    OR
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role in ('admin', 'marketing')
    )
);

-- Realtime subscription for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_scrape_jobs;
