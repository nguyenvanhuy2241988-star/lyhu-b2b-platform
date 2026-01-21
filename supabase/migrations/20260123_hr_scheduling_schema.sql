-- Migration: HR Scheduling (Smart Scheduling)
-- Purpose: Manage work shifts, weekly schedules, and employee registrations
-- Includes DROP POLICY IF EXISTS to allow re-running

BEGIN;

-- 1. Work Shifts (Ca làm việc mẫu)
CREATE TABLE IF NOT EXISTS public.work_shifts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, -- Ca Sáng, Ca Chiều
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. Weekly Schedules (Đợt đăng ký lịch)
CREATE TABLE IF NOT EXISTS public.weekly_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    week_number int NOT NULL,
    year int NOT NULL,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'published')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(week_number, year)
);

-- 3. Shift Registrations (Đăng ký của nhân viên)
CREATE TABLE IF NOT EXISTS public.shift_registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id uuid REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES public.work_shifts(id),
    date date NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date, shift_id) -- Prevent double booking key
);

-- 4. Enable RLS
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- Work Shifts
DROP POLICY IF EXISTS "Everyone view active shifts" ON public.work_shifts;
CREATE POLICY "Everyone view active shifts" ON public.work_shifts FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage shifts" ON public.work_shifts;
CREATE POLICY "Admins manage shifts" ON public.work_shifts USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Weekly Schedules
DROP POLICY IF EXISTS "Everyone view schedules" ON public.weekly_schedules;
CREATE POLICY "Everyone view schedules" ON public.weekly_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage schedules" ON public.weekly_schedules;
CREATE POLICY "Admins manage schedules" ON public.weekly_schedules USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Shift Registrations
DROP POLICY IF EXISTS "View own registrations or Admin" ON public.shift_registrations;
CREATE POLICY "View own registrations or Admin" ON public.shift_registrations FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users register own shifts" ON public.shift_registrations;
CREATE POLICY "Users register own shifts" ON public.shift_registrations FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users delete own pending" ON public.shift_registrations;
CREATE POLICY "Users delete own pending" ON public.shift_registrations FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
);

DROP POLICY IF EXISTS "Admins update registrations" ON public.shift_registrations;
CREATE POLICY "Admins update registrations" ON public.shift_registrations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Seed Data
INSERT INTO public.work_shifts (name, start_time, end_time) VALUES
('Ca Sáng', '08:00', '12:00'),
('Ca Chiều', '13:30', '17:30'),
('Ca Tối', '18:00', '22:00')
ON CONFLICT DO NOTHING;

COMMIT;
