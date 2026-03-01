-- Fund Contributions: Track monthly fund payments per employee
CREATE TABLE IF NOT EXISTS public.fund_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    amount NUMERIC NOT NULL DEFAULT 50000,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed')),
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, month, year)
);

-- RLS
ALTER TABLE public.fund_contributions ENABLE ROW LEVEL SECURITY;

-- Everyone can view contributions
CREATE POLICY "fund_contributions_select" ON public.fund_contributions
    FOR SELECT USING (true);

-- Admin can insert/update/delete
CREATE POLICY "fund_contributions_admin_insert" ON public.fund_contributions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "fund_contributions_admin_update" ON public.fund_contributions
    FOR UPDATE USING (true);

CREATE POLICY "fund_contributions_admin_delete" ON public.fund_contributions
    FOR DELETE USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_contributions;
