DROP POLICY IF EXISTS "Admins manage fund" ON public.fund_transactions;
DROP POLICY IF EXISTS "SuperAdmins all fund" ON public.fund_transactions;
DROP POLICY IF EXISTS "Recruiters insert fund" ON public.fund_transactions;

CREATE POLICY "Admins and HR manage fund" ON public.fund_transactions
FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'recruiter'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'recruiter'))
);
