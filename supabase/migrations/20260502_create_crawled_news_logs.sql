-- Migration to create crawled_news_logs table to prevent duplicate blog generation from RSS

CREATE TABLE IF NOT EXISTS public.crawled_news_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('published', 'ignored', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Admin only)
ALTER TABLE public.crawled_news_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to crawled_news_logs" 
ON public.crawled_news_logs 
AS PERMISSIVE FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Allow authenticated admins to view logs if needed in the future
CREATE POLICY "Allow admins to view crawled_news_logs" 
ON public.crawled_news_logs 
FOR SELECT 
TO authenticated 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
