-- Create a table to store unique group data for future reuse/analytics
CREATE TABLE IF NOT EXISTS public.recruitment_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link TEXT UNIQUE NOT NULL, -- The group link is the unique identifier
    name TEXT,
    platform TEXT,
    notes TEXT, -- User notes about the group (e.g., "Good engagement", "Pending approval")
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'banned')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for recruitment_groups
ALTER TABLE public.recruitment_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view and insert/update groups (Shared knowledge base)
CREATE POLICY "Authenticated users can view groups" ON public.recruitment_groups
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert/update groups" ON public.recruitment_groups
    FOR ALL TO authenticated USING (true); -- Allow shared editing for now

-- Update post_logs to support Comments and Group Notes
ALTER TABLE public.recruitment_post_logs
ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (activity_type IN ('post', 'comment', 'reaction', 'share')) DEFAULT 'post',
ADD COLUMN IF NOT EXISTS group_note TEXT; -- Specific note for this log entry regarding the group (snapshot)
