ALTER TABLE public.fund_contributions
DROP CONSTRAINT IF EXISTS fund_contributions_user_id_fkey;

ALTER TABLE public.fund_contributions
ADD CONSTRAINT fund_contributions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.unhide_hr_profile_rpc(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET status = 'active'
    WHERE id = p_user_id;
END;
$$;
