-- ==========================================
-- SQL Script: Prepare media_briefs table
-- ==========================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.media_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    media_type TEXT NOT NULL DEFAULT 'video',
    priority TEXT NOT NULL DEFAULT 'normal',
    deadline TIMESTAMPTZ,
    requested_department TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5. Add any missing columns (since CREATE TABLE IF NOT EXISTS won't update an existing table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_briefs' AND column_name='created_by') THEN
        ALTER TABLE public.media_briefs ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media_briefs' AND column_name='assignees') THEN
        ALTER TABLE public.media_briefs ADD COLUMN assignees UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 2. Configure Row Level Security (RLS)
ALTER TABLE public.media_briefs ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent collision
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all access for admins" ON public.media_briefs;
    DROP POLICY IF EXISTS "Enable select for assigned users" ON public.media_briefs;
    DROP POLICY IF EXISTS "Enable update for assigned users" ON public.media_briefs;
    DROP POLICY IF EXISTS "media_briefs_admin_all" ON public.media_briefs;
    DROP POLICY IF EXISTS "media_briefs_select" ON public.media_briefs;
    DROP POLICY IF EXISTS "media_briefs_update" ON public.media_briefs;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Let Admin & Sale Admin do whatever they want
CREATE POLICY "media_briefs_admin_all" 
ON public.media_briefs 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'sale_admin')
    )
);

-- Let Media staff see ONLY tasks assigned to them (or tasks they created somehow)
CREATE POLICY "media_briefs_select" 
ON public.media_briefs 
FOR SELECT 
USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
);

-- Let Media staff UPDATE tasks assigned to them (to change status)
CREATE POLICY "media_briefs_update" 
ON public.media_briefs 
FOR UPDATE 
USING (
    assigned_to = auth.uid()
) 
WITH CHECK (
    assigned_to = auth.uid()
);

-- Note: No general insert policy because only Admin creates these tasks, and their ALL policy covers it.

-- 3. Notify completion
SELECT 'Table media_briefs configured properly with RLS policies' as status;
