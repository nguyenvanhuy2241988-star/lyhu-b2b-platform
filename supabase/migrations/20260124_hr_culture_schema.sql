-- Migration: HR Culture (Events & Company Fund)
-- Purpose: Manage internal events, birthdays, and company fund transparency

BEGIN;

-- 1. Culture Events (Sự kiện, Lịch công ty)
CREATE TABLE IF NOT EXISTS public.culture_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    type text DEFAULT 'event' CHECK (type IN ('event', 'meeting', 'holiday', 'party')),
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- 2. Fund Transactions (Quỹ công ty - Thu/Chi)
CREATE TABLE IF NOT EXISTS public.fund_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    amount numeric NOT NULL, -- Positive for both, Type determines +/-
    type text NOT NULL CHECK (type IN ('income', 'expense')), -- Thu / Chi
    description text NOT NULL,
    category text, -- e.g., 'Sinh nhật', 'Ăn vặt', 'Thưởng nóng'
    attachment_url text, -- Receipt image
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.culture_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Events: Everyone can view, Only Admin/HR can manage
DROP POLICY IF EXISTS "Everyone view events" ON public.culture_events;
CREATE POLICY "Everyone view events" ON public.culture_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage events" ON public.culture_events;
CREATE POLICY "Admins manage events" ON public.culture_events USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
);

-- Fund: Transparency (Everyone can view), Only Admin can manage
DROP POLICY IF EXISTS "Everyone view fund" ON public.fund_transactions;
CREATE POLICY "Everyone view fund" ON public.fund_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage fund" ON public.fund_transactions;
CREATE POLICY "Admins manage fund" ON public.fund_transactions USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Seed Data (Sample Events)
INSERT INTO public.culture_events (title, start_time, type, description) VALUES
('Happy Hour T1/2026', now() + interval '5 days', 'party', 'Liên hoan nhẹ cuối tháng'),
('Nghỉ Tết Nguyên Đán', '2026-02-17 00:00:00+07', 'holiday', 'Lịch nghỉ tết âm lịch dự kiến')
ON CONFLICT DO NOTHING;

-- Seed Data (Sample Fund)
INSERT INTO public.fund_transactions (amount, type, description, category) VALUES
(5000000, 'income', 'Ngân sách Team Building Q1', 'Quỹ cty'),
(1200000, 'expense', 'Mua trái cây Happy Hour', 'Ăn uống')
ON CONFLICT DO NOTHING;

COMMIT;
