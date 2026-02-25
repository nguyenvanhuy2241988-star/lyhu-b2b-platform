-- USER ACTIVITY TRACKING
-- Run this in Supabase SQL Editor

-- 1. Create Table
CREATE TABLE IF NOT EXISTS user_daily_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    online_seconds int DEFAULT 0,
    last_seen timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

-- 2. Enable RLS
ALTER TABLE user_daily_activities ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can see their own activity
DROP POLICY IF EXISTS "Users can see own activity" ON user_daily_activities;
CREATE POLICY "Users can see own activity" ON user_daily_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own activity (via RPC only technically, but RLS safe)
DROP POLICY IF EXISTS "Users can update own activity" ON user_daily_activities;
CREATE POLICY "Users can update own activity" ON user_daily_activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can see all activity
DROP POLICY IF EXISTS "Admins can view all activity" ON user_daily_activities;
CREATE POLICY "Admins can view all activity" ON user_daily_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4. RPC Function for Heartbeat
-- This function will be called every 30 seconds by the client
CREATE OR REPLACE FUNCTION track_heartbeat()
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
    INSERT INTO user_daily_activities (user_id, date, online_seconds, last_seen)
    VALUES (v_user_id, v_today, 30, now())
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        online_seconds = user_daily_activities.online_seconds + 30,
        last_seen = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper to get online users stats for Admin
DROP FUNCTION IF EXISTS get_users_activity_stats(date) CASCADE;
CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    role text,
    online_seconds int,
    last_seen timestamptz,
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
        -- Consider online if last_seen within 2 minutes (allow some buffer)
        (uda.last_seen > (now() - interval '2 minutes')) as is_online
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
