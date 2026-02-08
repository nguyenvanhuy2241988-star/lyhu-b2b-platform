-- Migration: Update RPC get_users_activity_stats to include misa_employee_code
-- Created: 2026-02-08
-- Fixed: Reverted JOIN condition to match original exactly.

DROP FUNCTION IF EXISTS get_users_activity_stats(date);

CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text,
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
        p.misa_employee_code, -- Added from profiles
        COALESCE(uda.online_seconds, 0) as online_seconds,
        uda.last_seen,
        uda.last_path,
        uda.device_info,
        -- Consider online if last_seen within 2 minutes
        (uda.last_seen > (now() - interval '2 minutes')) as is_online
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
