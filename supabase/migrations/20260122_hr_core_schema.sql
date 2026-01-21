-- Migration: HR Core Schema (Departments & Profile Extensions)
-- Purpose: Support HR Directory, Shift Scheduling (work_type), and Birthday Tracking (dob)

BEGIN;

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    manager_id uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- 2. Add HR Columns to Profiles
-- Using DO block to safely add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id uuid REFERENCES public.departments(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employee_code') THEN
        ALTER TABLE public.profiles ADD COLUMN employee_code text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dob') THEN
        ALTER TABLE public.profiles ADD COLUMN dob date; -- Date of Birth for Birthdays
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'start_date') THEN
        ALTER TABLE public.profiles ADD COLUMN start_date date; -- Join Date
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
        ALTER TABLE public.profiles ADD COLUMN position text; -- Job Title
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'work_type') THEN
        ALTER TABLE public.profiles ADD COLUMN work_type text DEFAULT 'fulltime'; -- fulltime, parttime, intern
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Departments
DROP POLICY IF EXISTS "Everyone can view departments" ON public.departments;
CREATE POLICY "Everyone can view departments" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments" ON public.departments USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Seed Initial Departments
INSERT INTO public.departments (name, description) VALUES
('Ban Giám Đốc', 'Ban lãnh đạo công ty'),
('Hành chính Nhân sự', 'Tuyển dụng, C&B, Văn hóa'),
('Kinh doanh (Sales)', 'Telesales, Sales Online'),
('Marketing', 'Content, Ads, Branding'),
('Kho vận (Logistics)', 'Kho, Vận chuyển, Đóng gói'),
('Kế toán (Finance)', 'Thu chi, Công nợ, Lương'),
('Công nghệ (Tech)', 'IT, Phần mềm')
ON CONFLICT DO NOTHING;

COMMIT;
