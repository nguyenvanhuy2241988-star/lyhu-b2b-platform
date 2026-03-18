-- ============================================
-- IP-Based Lead Distribution
-- Adds IP tracking to heartbeat and company IP filter to lead distribution
-- ============================================

-- 1. Add current_ip column to user_daily_activities
ALTER TABLE user_daily_activities
ADD COLUMN IF NOT EXISTS current_ip text;

-- 2. Add company IP config to lead_distribution_config
ALTER TABLE lead_distribution_config
ADD COLUMN IF NOT EXISTS company_ips text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS only_company_ip boolean DEFAULT false;

-- 3. Update track_heartbeat RPC to accept IP parameter
CREATE OR REPLACE FUNCTION track_heartbeat(
    p_path text DEFAULT NULL,
    p_device text DEFAULT NULL,
    p_ip text DEFAULT NULL
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

    -- Upsert activity record with IP
    INSERT INTO user_daily_activities (
        user_id, date, online_seconds, last_seen, last_path, device_info, current_ip
    )
    VALUES (
        v_user_id, v_today, 30, now(), p_path, p_device, p_ip
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        online_seconds = user_daily_activities.online_seconds + 30,
        last_seen = now(),
        last_path = COALESCE(p_path, user_daily_activities.last_path),
        device_info = COALESCE(p_device, user_daily_activities.device_info),
        current_ip = COALESCE(p_ip, user_daily_activities.current_ip);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_users_activity_stats to return current_ip
DROP FUNCTION IF EXISTS get_users_activity_stats(date);
CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text,
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
        COALESCE(uda.online_seconds, 0) as online_seconds,
        uda.last_seen,
        uda.last_path,
        uda.device_info,
        uda.current_ip,
        (uda.last_seen > (now() - interval '2 minutes')) as is_online
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update get_online_eligible_telesales to support company IP filter
CREATE OR REPLACE FUNCTION get_online_eligible_telesales()
RETURNS TABLE(user_id uuid, full_name text) AS $$
DECLARE
    config_rec lead_distribution_config;
BEGIN
    SELECT * INTO config_rec FROM lead_distribution_config WHERE id = 1;
    
    IF NOT config_rec.enabled THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT p.id, p.full_name
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = CURRENT_DATE
    WHERE p.id = ANY(config_rec.eligible_user_ids)
      AND p.role IN ('telesales', 'sale_admin')
      AND p.status = 'active'
      -- Online check: last_seen within 2 minutes
      AND (NOT config_rec.only_online OR uda.last_seen > (now() - interval '2 minutes'))
      -- Company IP check: if enabled, user's current_ip must match one of company_ips
      AND (
          NOT config_rec.only_company_ip 
          OR (
              uda.current_ip IS NOT NULL 
              AND uda.current_ip = ANY(config_rec.company_ips)
          )
      )
    ORDER BY random();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
