-- Migration: Recruitment KPI Reporting RPC
-- Purpose: Aggregate Traffic (Clicks) vs Results (Leads) for Dashboard

BEGIN;

-- 1. Create Report Function
CREATE OR REPLACE FUNCTION public.get_recruitment_kpi_stats(
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
    recruiter_id uuid,
    recruiter_name text,
    recruiter_email text,
    recruiter_avatar text,
    total_links bigint,
    total_clicks bigint,
    total_leads bigint,
    conversion_rate numeric,
    top_source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    RETURN QUERY
    WITH link_stats AS (
        -- Aggregate stats per recruiter from tracking links
        SELECT 
            t.creator_id,
            COUNT(t.code) as link_count,
            COALESCE(SUM(t.clicks_count), 0) as click_count,
            -- Find most frequent source (simple mode)
            mode() WITHIN GROUP (ORDER BY t.campaign_source) as favored_source
        FROM public.tracking_shortlinks t
        WHERE (p_start_date IS NULL OR t.created_at >= p_start_date)
          AND (p_end_date IS NULL OR t.created_at <= p_end_date)
        GROUP BY t.creator_id
    ),
    lead_stats AS (
        -- Aggregate leads count per recruiter (via tracking code)
        SELECT 
            t.creator_id,
            COUNT(c.id) as lead_count
        FROM public.recruitment_candidates c
        JOIN public.tracking_shortlinks t ON c.tracking_code = t.code
        WHERE (p_start_date IS NULL OR c.created_at >= p_start_date)
          AND (p_end_date IS NULL OR c.created_at <= p_end_date)
        GROUP BY t.creator_id
    )
    SELECT 
        p.id as recruiter_id,
        COALESCE(p.full_name, 'Unknown') as recruiter_name,
        COALESCE(u.email, 'No Email') as recruiter_email,
        p.avatar_url as recruiter_avatar,
        COALESCE(ls.link_count, 0) as total_links,
        COALESCE(ls.click_count, 0) as total_clicks,
        COALESCE(lds.lead_count, 0) as total_leads,
        CASE 
            WHEN COALESCE(ls.click_count, 0) = 0 THEN 0 
            ELSE ROUND((COALESCE(lds.lead_count, 0)::numeric / ls.click_count::numeric) * 100, 2)
        END as conversion_rate,
        COALESCE(ls.favored_source, 'N/A') as top_source
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    LEFT JOIN link_stats ls ON p.id = ls.creator_id
    LEFT JOIN lead_stats lds ON p.id = lds.creator_id
    WHERE ls.creator_id IS NOT NULL OR lds.creator_id IS NOT NULL; -- Only show active users
END;
$$;

-- 2. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_recruitment_kpi_stats TO authenticated;

COMMIT;
