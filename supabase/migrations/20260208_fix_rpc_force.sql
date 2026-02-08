-- Migration: FORCE Fix RPC get_users_activity_stats
-- Created: 2026-02-08
-- Details: Drop function completely before recreating to avoid signature mismatches.

-- 1. Drop the function with exact signature
DROP FUNCTION IF EXISTS public.get_users_activity_stats(date);

-- 2. Drop any other potential overloads (just in case)
DROP FUNCTION IF EXISTS public.get_users_activity_stats();

-- 3. Recreate the function
CREATE OR REPLACE FUNCTION public.get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text,
    status text, -- Adding status just in case it was missing too? (Check frontend interface)
    misa_employee_code text, -- NEW FIELD
    online_seconds int, 
    last_seen timestamptz,
    last_path text,
    device_info text,
    is_online boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.full_name,
        p.role,
        p.status, -- Make sure status is returned if used
        p.misa_employee_code, -- Added from profiles
        
        COALESCE(uda.online_seconds, 0) as online_seconds,
        uda.last_seen,
        uda.last_path,
        uda.device_info,
        
        -- Consider online if last_seen within 2 minutes
        (uda.last_seen > (now() - interval '2 minutes')) as is_online
    FROM public.profiles p
    LEFT JOIN public.user_daily_activities uda ON p.id = uda.user_id AND uda.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant access
GRANT EXECUTE ON FUNCTION public.get_users_activity_stats(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_activity_stats(date) TO service_role;
