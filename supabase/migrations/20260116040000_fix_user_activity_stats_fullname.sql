-- g:\LYHU\Projects\LYHU-app\supabase\migrations\20260116040000_fix_user_activity_stats_fullname.sql

-- Update the RPC to include full_name from profiles
DROP FUNCTION IF EXISTS get_users_activity_stats(date);

CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text, -- NEW FIELD
    role text,
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
        p.full_name, -- Added from profiles
        p.role,
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
