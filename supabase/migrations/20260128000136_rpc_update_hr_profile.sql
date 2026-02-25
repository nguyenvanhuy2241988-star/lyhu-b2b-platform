-- RPC: Update HR Profile (Bypassing RLS for Admins)
-- This function allows Admins to update user profiles without getting blocked by RLS.

CREATE OR REPLACE FUNCTION public.update_hr_profile_rpc(
  p_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_dob DATE DEFAULT NULL,
  p_place_of_origin TEXT DEFAULT NULL,
  p_identity_card TEXT DEFAULT NULL,
  p_education_school TEXT DEFAULT NULL,
  p_education_major TEXT DEFAULT NULL,
  p_interests TEXT DEFAULT NULL,
  p_social_facebook TEXT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL,
  p_position TEXT DEFAULT NULL,
  p_work_type TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_employee_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as creator (admin) privileges
AS $$
DECLARE
  v_current_user_role TEXT;
  v_result JSONB;
BEGIN
  -- 1. Check Permissions
  SELECT role INTO v_current_user_role FROM public.profiles WHERE id = auth.uid();
  
  -- Allow if Admin OR Recruiter OR updating own profile
  IF v_current_user_role NOT IN ('admin', 'recruiter') AND auth.uid() <> p_id THEN
    RAISE EXCEPTION 'Permission Denied: Only Admins or Recruiters can update other profiles.';
  END IF;

  -- 2. Perform Update
  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    dob = p_dob, -- Allow setting to null/value directly (client should pass existing val if no change)
    place_of_origin = COALESCE(p_place_of_origin, place_of_origin),
    identity_card = COALESCE(p_identity_card, identity_card),
    education_school = COALESCE(p_education_school, education_school),
    education_major = COALESCE(p_education_major, education_major),
    interests = COALESCE(p_interests, interests),
    social_facebook = COALESCE(p_social_facebook, social_facebook),
    department_id = p_department_id,
    position = COALESCE(p_position, position),
    work_type = COALESCE(p_work_type, work_type),
    start_date = p_start_date,
    employee_code = COALESCE(p_employee_code, employee_code),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING to_jsonb(profiles.*) INTO v_result;

  RETURN v_result;
END;
$$;
