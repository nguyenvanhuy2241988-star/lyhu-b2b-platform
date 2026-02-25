-- 1. Create the telesales_daily_activities table
CREATE TABLE public.telesales_daily_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- KPIs
    calls_completed INTEGER NOT NULL DEFAULT 0,
    fb_group_posts INTEGER NOT NULL DEFAULT 0,
    fb_comments INTEGER NOT NULL DEFAULT 0,
    fb_friends INTEGER NOT NULL DEFAULT 0,
    fb_personal_posts INTEGER NOT NULL DEFAULT 0,
    zalo_posts INTEGER NOT NULL DEFAULT 0,
    self_sourced_data INTEGER NOT NULL DEFAULT 0,
    
    -- Text fields
    issues TEXT,
    request_support TEXT,
    other_tasks TEXT,
    plan_next_day TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one report per user per day
    UNIQUE(user_id, date)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.telesales_daily_activities ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own telesales daily activities" 
ON public.telesales_daily_activities
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert own telesales daily activities" 
ON public.telesales_daily_activities
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update own telesales daily activities" 
ON public.telesales_daily_activities
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Admins and Managers can view all reports
CREATE POLICY "Admins can view all telesales daily activities"
ON public.telesales_daily_activities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'manager', 'telesales_manager')
    )
);

-- Create index for faster querying by user and date
CREATE INDEX idx_telesales_daily_activities_user_date ON public.telesales_daily_activities(user_id, date);
