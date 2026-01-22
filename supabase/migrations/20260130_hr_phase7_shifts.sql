-- Migration: Phase 7 (Shifts & CRM Banner)
-- Date: 2026-01-30 (Part 3)

BEGIN;

-- 1. Create crm_settings table
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id int PRIMARY KEY DEFAULT 1,
    banner_url text,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- RLS for crm_settings
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Authenticated users can view crm_settings" ON public.crm_settings
    FOR SELECT TO authenticated USING (true);

-- Allow update for Admins only
CREATE POLICY "Admins can update crm_settings" ON public.crm_settings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'RECRUITER') -- Assuming Recruiter can also edit? Or just Admin? User said Admin. Let's stick to user request strictly if possible, or allow both management roles.
            -- User said: "Admin là người chỉnh sửa, các role khác chỉ có quyền xem"
            -- So let's check profile role.
            -- Note: Using auth.uid() check against public.profiles is standard.
        )
    )
    WITH CHECK (
         EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );
-- Insert default row if not exists
INSERT INTO public.crm_settings (id, banner_url) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;


-- 2. Upsert Shifts
-- We use start_time as key or name? Name is better key here.
-- Upsert Logic:
-- Ca Sáng : 8h - 12h
-- Ca chiều : 13h30 - 17h30
-- Ca tối : 17h30 - 21h30
-- Cả ngày : 8h - 17h30

INSERT INTO public.work_shifts (name, start_time, end_time, is_active)
VALUES 
    ('Ca Sáng', '08:00:00', '12:00:00', true),
    ('Ca Chiều', '13:30:00', '17:30:00', true),
    ('Ca Tối', '17:30:00', '21:30:00', true),
    ('Cả ngày', '08:00:00', '17:30:00', true)
ON CONFLICT (name) DO UPDATE 
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

COMMIT;
