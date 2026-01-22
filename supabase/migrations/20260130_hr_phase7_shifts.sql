-- Migration: Phase 7 (Shifts & CRM Banner) - FIXED IDEMPOTENCY
-- Date: 2026-01-30

BEGIN;

-- 1. Create crm_settings table (Safe if exists)
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id int PRIMARY KEY DEFAULT 1,
    banner_url text,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS (Safe to re-run)
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view crm_settings" ON public.crm_settings;
DROP POLICY IF EXISTS "Admins can update crm_settings" ON public.crm_settings;

-- 3. Re-create Policies
CREATE POLICY "Authenticated users can view crm_settings" ON public.crm_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update crm_settings" ON public.crm_settings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    )
    WITH CHECK (
         EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- 4. Insert default row (Safe)
INSERT INTO public.crm_settings (id, banner_url) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;

-- 5. Upsert Shifts (Safe)
INSERT INTO public.work_shifts (name, start_time, end_time, is_active)
VALUES 
    ('Ca Sáng', '08:00:00', '12:00:00', true),
    ('Ca Chiều', '13:30:00', '17:30:00', true),
    ('Ca Tối', '17:30:00', '21:30:00', true),
    ('Cả ngày', '08:00:00', '17:30:00', true)
ON CONFLICT (name) DO UPDATE 
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

COMMIT;
