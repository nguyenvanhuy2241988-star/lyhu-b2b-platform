-- Create Events table
CREATE TABLE IF NOT EXISTS public.hr_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('birthday', 'party', 'trip', 'meeting', 'other')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    banner_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    budget_total NUMERIC DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Participants table
CREATE TABLE IF NOT EXISTS public.hr_event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.hr_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'going', 'not_going')),
    check_in_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create Budget table
CREATE TABLE IF NOT EXISTS public.hr_event_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.hr_events(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_event_budget ENABLE ROW LEVEL SECURITY;

-- Create helper function to check for Admin or HR (Recruiter) role
CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'recruiter')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for hr_events

-- Everyone can view published events
CREATE POLICY "Everyone can view published events" ON public.hr_events
    FOR SELECT
    USING (status = 'published' OR is_admin_or_hr());

-- Admin/HR can convert/manage all events
CREATE POLICY "Admin/HR can manage events" ON public.hr_events
    FOR ALL
    USING (is_admin_or_hr());

-- Policies for hr_event_participants

-- Everyone can view participants of events they can see
CREATE POLICY "Everyone can view participants" ON public.hr_event_participants
    FOR SELECT
    USING (TRUE);

-- Users can update their own status
CREATE POLICY "Users can update own participation" ON public.hr_event_participants
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin/HR can manage all participants
CREATE POLICY "Admin/HR can manage participants" ON public.hr_event_participants
    FOR ALL
    USING (is_admin_or_hr());

-- Policies for hr_event_budget

-- Only Admin/HR can view/manage budget
CREATE POLICY "Admin/HR can manage budget" ON public.hr_event_budget
    FOR ALL
    USING (is_admin_or_hr());

-- Grant access
GRANT ALL ON public.hr_events TO authenticated;
GRANT ALL ON public.hr_event_participants TO authenticated;
GRANT ALL ON public.hr_event_budget TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_event_participants;
