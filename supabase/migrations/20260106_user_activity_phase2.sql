-- PHASE 2: DETAILED USER ANALYTICS
-- Run this in Supabase SQL Editor

-- 1. Add Columns for Context
ALTER TABLE user_daily_activities 
ADD COLUMN IF NOT EXISTS last_path text,
ADD COLUMN IF NOT EXISTS device_info text;

-- 2. Update Heartbeat RPC to accept metadata
CREATE OR REPLACE FUNCTION track_heartbeat(
    p_path text DEFAULT NULL,
    p_device text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_user_id uuid;
    v_today date;
BEGIN
    v_user_id := auth.uid();
    v_today := CURRENT_DATE;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Upsert activity record
    INSERT INTO user_daily_activities (
        user_id, date, online_seconds, last_seen, last_path, device_info
    )
    VALUES (
        v_user_id, v_today, 30, now(), p_path, p_device
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        online_seconds = user_daily_activities.online_seconds + 30,
        last_seen = now(),
        last_path = COALESCE(p_path, user_daily_activities.last_path),
        device_info = COALESCE(p_device, user_daily_activities.device_info);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Stats Helper to return path & context
DROP FUNCTION IF EXISTS get_users_activity_stats(date); -- Drop old signature if needed safely
CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
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

-- 4. New RPC: Get User History Chart Data (7 Days / 30 Days)
CREATE OR REPLACE FUNCTION get_user_activity_history(
    p_user_id uuid,
    p_days int DEFAULT 7
)
RETURNS TABLE (
    date date,
    online_seconds int,
    path_summary text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uda.date,
        uda.online_seconds,
        uda.last_path as path_summary
    FROM user_daily_activities uda
    WHERE uda.user_id = p_user_id
    AND uda.date >= (CURRENT_DATE - (p_days || ' days')::interval)::date
    ORDER BY uda.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
