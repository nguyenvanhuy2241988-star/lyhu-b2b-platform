CREATE OR REPLACE FUNCTION public.hide_hr_profile_rpc(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET status = 'inactive'
    WHERE id = p_user_id;
END;
$$;
