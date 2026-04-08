-- Fix: Add current_ip to get_users_activity_stats return type while preserving misa_employee_code
DROP FUNCTION IF EXISTS get_users_activity_stats(date);

CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text,
    misa_employee_code text,
    online_seconds int, 
    last_seen timestamptz,
    last_path text,
    device_info text,
    current_ip text,
    is_online boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.full_name,
        p.role,
        p.misa_employee_code,
        COALESCE(uda.online_seconds, 0) as online_seconds,
        uda.last_seen,
        uda.last_path,
        uda.device_info,
        uda.current_ip,
        -- Consider online if last_seen within 2 minutes
        (uda.last_seen > (now() - interval '2 minutes')) as is_online
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
