-- Migration: HR Scheduling (Smart Scheduling)
-- Purpose: Manage work shifts, weekly schedules, and employee registrations

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

-- Work Shifts: Everyone can view active shifts, Only Admin can manage
CREATE POLICY "Everyone view active shifts" ON public.work_shifts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage shifts" ON public.work_shifts USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Weekly Schedules: Everyone view
CREATE POLICY "Everyone view schedules" ON public.weekly_schedules FOR SELECT USING (true);
CREATE POLICY "Admins manage schedules" ON public.weekly_schedules USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Registrations: 
-- Users can view their own, Admins can view all
CREATE POLICY "View own registrations or Admin" ON public.shift_registrations FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can insert their own (if Schedule is Open)
CREATE POLICY "Users register own shifts" ON public.shift_registrations FOR INSERT WITH CHECK (
    auth.uid() = user_id
    -- AND EXISTS (SELECT 1 FROM public.weekly_schedules WHERE id = schedule_id AND status = 'open') 
    -- (Logic check usually better in app/RPC, but RLS prevents unauthorized user IDs)
);

-- Users can delete their own (if pending)
CREATE POLICY "Users delete own pending" ON public.shift_registrations FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
);

-- Admins can update status (Approve/Reject)
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
