-- Migration: Update Web Analytics to detect AI/Bots
-- Description: Adds columns to track bots vs humans and updates the RPC function.

ALTER TABLE public.website_page_views ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false;
ALTER TABLE public.website_page_views ADD COLUMN IF NOT EXISTS bot_name text;

-- Update RPC Function to include bot stats
CREATE OR REPLACE FUNCTION get_analytics_summary(start_date timestamptz, end_date timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_views integer;
    human_views integer;
    bot_views integer;
    unique_visitors integer;
    total_sessions integer;
    top_pages jsonb;
    top_referrers jsonb;
    device_breakdown jsonb;
    traffic_over_time jsonb;
    bot_breakdown jsonb;
    result jsonb;
BEGIN
    -- Check permissions (admin or marketing)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'marketing')) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Basic stats
    SELECT 
        COUNT(*),
        COUNT(NULLIF(is_bot, true)), 
        COUNT(NULLIF(is_bot, false)),
        COUNT(DISTINCT visitor_id), 
        COUNT(DISTINCT session_id)
    INTO total_views, human_views, bot_views, unique_visitors, total_sessions
    FROM public.website_page_views
    WHERE created_at >= start_date AND created_at <= end_date;

    -- Top Pages (Human only for accuracy)
    SELECT jsonb_agg(row_to_json(t))
    INTO top_pages
    FROM (
        SELECT pathname as path, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        AND (is_bot IS NULL OR is_bot = false)
        GROUP BY pathname
        ORDER BY views DESC
        LIMIT 10
    ) t;

    -- Top Referrers (Human only)
    SELECT jsonb_agg(row_to_json(t))
    INTO top_referrers
    FROM (
        SELECT COALESCE(NULLIF(referrer, ''), 'Direct') as source, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        AND (is_bot IS NULL OR is_bot = false)
        GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct')
        ORDER BY views DESC
        LIMIT 10
    ) t;

    -- Device Breakdown (Human only)
    SELECT jsonb_agg(row_to_json(t))
    INTO device_breakdown
    FROM (
        SELECT COALESCE(NULLIF(device_type, ''), 'unknown') as device, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        AND (is_bot IS NULL OR is_bot = false)
        GROUP BY COALESCE(NULLIF(device_type, ''), 'unknown')
        ORDER BY views DESC
    ) t;

    -- Traffic Over Time (grouped by day, separating human and bot)
    SELECT jsonb_agg(row_to_json(t))
    INTO traffic_over_time
    FROM (
        SELECT 
            date_trunc('day', created_at) as date, 
            COUNT(NULLIF(is_bot, true)) as human_views,
            COUNT(NULLIF(is_bot, false)) as bot_views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
    ) t;

    -- Bot Breakdown
    SELECT jsonb_agg(row_to_json(t))
    INTO bot_breakdown
    FROM (
        SELECT COALESCE(NULLIF(bot_name, ''), 'Unknown Bot') as bot, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        AND is_bot = true
        GROUP BY COALESCE(NULLIF(bot_name, ''), 'Unknown Bot')
        ORDER BY views DESC
    ) t;

    -- Build final result
    result := jsonb_build_object(
        'totalViews', COALESCE(total_views, 0),
        'humanViews', COALESCE(human_views, 0),
        'botViews', COALESCE(bot_views, 0),
        'uniqueVisitors', COALESCE(unique_visitors, 0),
        'totalSessions', COALESCE(total_sessions, 0),
        'topPages', COALESCE(top_pages, '[]'::jsonb),
        'topReferrers', COALESCE(top_referrers, '[]'::jsonb),
        'deviceBreakdown', COALESCE(device_breakdown, '[]'::jsonb),
        'trafficOverTime', COALESCE(traffic_over_time, '[]'::jsonb),
        'botBreakdown', COALESCE(bot_breakdown, '[]'::jsonb)
    );

    RETURN result;
END;
$$;
