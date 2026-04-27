-- Migration: Create Web Analytics Schema
-- Description: Adds tables and functions to track website page views.

CREATE TABLE IF NOT EXISTS public.website_page_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    visitor_id text NOT NULL,
    url text NOT NULL,
    pathname text NOT NULL,
    referrer text,
    device_type text, -- 'mobile', 'tablet', 'desktop'
    browser text,
    os text,
    country text,
    user_agent text,
    screen_width integer,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for fast analytics querying
CREATE INDEX IF NOT EXISTS idx_website_page_views_created_at ON public.website_page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_page_views_pathname ON public.website_page_views (pathname);
CREATE INDEX IF NOT EXISTS idx_website_page_views_session_id ON public.website_page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_website_page_views_visitor_id ON public.website_page_views (visitor_id);

-- Enable RLS
ALTER TABLE public.website_page_views ENABLE ROW LEVEL SECURITY;

-- Service Role full access (API uses service role to insert)
CREATE POLICY "Service Role Full Access on website_page_views"
ON public.website_page_views
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admin full access
CREATE POLICY "Admin Full Access on website_page_views"
ON public.website_page_views
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow Marketing role read access too since they run ads
CREATE POLICY "Marketing Read Access on website_page_views"
ON public.website_page_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'marketing'
  )
);

-- RPC Function for Dashboard Summary
CREATE OR REPLACE FUNCTION get_analytics_summary(start_date timestamptz, end_date timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_views integer;
    unique_visitors integer;
    total_sessions integer;
    top_pages jsonb;
    top_referrers jsonb;
    device_breakdown jsonb;
    traffic_over_time jsonb;
    result jsonb;
BEGIN
    -- Check permissions (admin or marketing)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'marketing')) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Basic stats
    SELECT COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id)
    INTO total_views, unique_visitors, total_sessions
    FROM public.website_page_views
    WHERE created_at >= start_date AND created_at <= end_date;

    -- Top Pages
    SELECT jsonb_agg(row_to_json(t))
    INTO top_pages
    FROM (
        SELECT pathname as path, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY pathname
        ORDER BY views DESC
        LIMIT 10
    ) t;

    -- Top Referrers
    SELECT jsonb_agg(row_to_json(t))
    INTO top_referrers
    FROM (
        SELECT COALESCE(NULLIF(referrer, ''), 'Direct') as source, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct')
        ORDER BY views DESC
        LIMIT 10
    ) t;

    -- Device Breakdown
    SELECT jsonb_agg(row_to_json(t))
    INTO device_breakdown
    FROM (
        SELECT COALESCE(NULLIF(device_type, ''), 'unknown') as device, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY COALESCE(NULLIF(device_type, ''), 'unknown')
        ORDER BY views DESC
    ) t;

    -- Traffic Over Time (grouped by day)
    SELECT jsonb_agg(row_to_json(t))
    INTO traffic_over_time
    FROM (
        SELECT date_trunc('day', created_at) as date, COUNT(*) as views
        FROM public.website_page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
    ) t;

    -- Build final result
    result := jsonb_build_object(
        'totalViews', COALESCE(total_views, 0),
        'uniqueVisitors', COALESCE(unique_visitors, 0),
        'totalSessions', COALESCE(total_sessions, 0),
        'topPages', COALESCE(top_pages, '[]'::jsonb),
        'topReferrers', COALESCE(top_referrers, '[]'::jsonb),
        'deviceBreakdown', COALESCE(device_breakdown, '[]'::jsonb),
        'trafficOverTime', COALESCE(traffic_over_time, '[]'::jsonb)
    );

    RETURN result;
END;
$$;
