DROP POLICY IF EXISTS "Admins manage fund" ON public.fund_transactions;

CREATE POLICY "SuperAdmins all fund" ON public.fund_transactions
FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
);

CREATE POLICY "Recruiters insert fund" ON public.fund_transactions
FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'recruiter'))
);
