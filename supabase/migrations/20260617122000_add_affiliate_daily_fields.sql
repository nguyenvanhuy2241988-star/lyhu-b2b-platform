-- Add text fields to affiliate_daily_activities
ALTER TABLE public.affiliate_daily_activities 
ADD COLUMN IF NOT EXISTS issues TEXT,
ADD COLUMN IF NOT EXISTS request_support TEXT,
ADD COLUMN IF NOT EXISTS plan_next_day TEXT,
ADD COLUMN IF NOT EXISTS other_tasks TEXT,
ADD COLUMN IF NOT EXISTS candidate_feedback TEXT,
ADD COLUMN IF NOT EXISTS no_post_reason TEXT;

-- Create affiliate_post_logs table for evidence
CREATE TABLE IF NOT EXISTS public.affiliate_post_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    post_type TEXT, -- e.g., POST, COMMENT, SEEDING
    platform TEXT, -- e.g., FACEBOOK, TIKTOK, THREADS
    group_name TEXT,
    group_link TEXT,
    group_notes TEXT,
    post_link TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.affiliate_post_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view affiliate post logs"
ON public.affiliate_post_logs FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'hr_manager', 'manager'))
);

CREATE POLICY "Users can insert their own affiliate post logs"
ON public.affiliate_post_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own affiliate post logs"
ON public.affiliate_post_logs FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own affiliate post logs"
ON public.affiliate_post_logs FOR DELETE
USING (user_id = auth.uid());
