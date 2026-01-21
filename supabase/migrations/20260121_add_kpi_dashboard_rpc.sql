-- Migration: Recruitment KPI Reporting RPC (Fix 42804 Type Mismatch)
-- Purpose: Aggregate Traffic vs Results with Strict Type Casting

BEGIN;

-- 1. Drop old function if exists
DROP FUNCTION IF EXISTS public.get_recruitment_kpi_report(text, text);

-- 2. Create NEW Report Function (Strict Types)
CREATE OR REPLACE FUNCTION public.get_recruitment_kpi_report(
    p_start_date text DEFAULT NULL,
    p_end_date text DEFAULT NULL
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
DECLARE
    v_start timestamptz;
    v_end timestamptz;
BEGIN
    -- Safe Cast
    BEGIN
        v_start := p_start_date::timestamptz;
        v_end := p_end_date::timestamptz;
    EXCEPTION WHEN OTHERS THEN
        v_start := NULL;
        v_end := NULL;
    END;

    RETURN QUERY
    WITH link_stats AS (
        SELECT 
            t.creator_id,
            COUNT(t.code) as link_count,
            COALESCE(SUM(t.clicks_count), 0) as click_count
        FROM public.tracking_shortlinks t
        WHERE (v_start IS NULL OR t.created_at >= v_start)
          AND (v_end IS NULL OR t.created_at <= v_end)
        GROUP BY t.creator_id
    ),
    lead_stats AS (
        SELECT 
            t.creator_id,
            COUNT(c.id) as lead_count
        FROM public.recruitment_candidates c
        JOIN public.tracking_shortlinks t ON c.tracking_code = t.code
        WHERE (v_start IS NULL OR c.created_at >= v_start)
          AND (v_end IS NULL OR c.created_at <= v_end)
        GROUP BY t.creator_id
    )
    SELECT 
        p.id as recruiter_id,
        COALESCE(p.full_name, 'Unknown')::text as recruiter_name, -- Explicit Cast to text
        COALESCE(u.email, 'No Email')::text as recruiter_email,   -- Explicit Cast to text
        p.avatar_url::text as recruiter_avatar,                   -- Explicit Cast to text
        COALESCE(ls.link_count, 0) as total_links,
        COALESCE(ls.click_count, 0) as total_clicks,
        COALESCE(lds.lead_count, 0) as total_leads,
        CASE 
            WHEN COALESCE(ls.click_count, 0) = 0 THEN 0 
            ELSE ROUND((COALESCE(lds.lead_count, 0)::numeric / ls.click_count::numeric) * 100, 2)
        END as conversion_rate,
        'N/A'::text as top_source
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    LEFT JOIN link_stats ls ON p.id = ls.creator_id
    LEFT JOIN lead_stats lds ON p.id = lds.creator_id
    WHERE ls.creator_id IS NOT NULL OR lds.creator_id IS NOT NULL;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_recruitment_kpi_report(text, text) TO authenticated;

COMMIT;
