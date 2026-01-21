-- Migration: Add Tracking Shortlinks System
-- Purpose: Create short links for recruitment tracking (Traffic KPI)

BEGIN;

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.tracking_shortlinks (
    code text PRIMARY KEY, -- The short code, e.g. "xYz123"
    original_url text NOT NULL, -- The destination URL
    creator_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
    campaign_source text, -- e.g. "FacebookGroup", "TikTok"
    clicks_count bigint DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.tracking_shortlinks ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Policy: Authenticated users can create links (for themselves)
CREATE POLICY "Users can create tracking links"
    ON public.tracking_shortlinks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

-- Policy: Users can see their own links
CREATE POLICY "Users can view own tracking links"
    ON public.tracking_shortlinks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = creator_id);

-- Policy: Admins/Recruiters/Marketing can see ALL links (for Reporting)
CREATE POLICY "Staff can view all tracking links"
    ON public.tracking_shortlinks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'recruiter', 'marketing', 'sale_admin')
        )
    );

-- 4. Function: Track Click & Get URL (Security Definer)
-- This function allows PUBLIC access (via API) to increment the counter
-- without giving public UPDATE permission to the table.
CREATE OR REPLACE FUNCTION public.track_click_and_get_url(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
DECLARE
    v_url text;
BEGIN
    -- Get URL
    SELECT original_url INTO v_url
    FROM public.tracking_shortlinks
    WHERE code = p_code;

    -- If found, increment click count
    IF v_url IS NOT NULL THEN
        UPDATE public.tracking_shortlinks
        SET clicks_count = clicks_count + 1
        WHERE code = p_code;
    END IF;

    RETURN v_url;
END;
$$;

-- Grant execute to everyone (anon included) so the Redirect API can call it
GRANT EXECUTE ON FUNCTION public.track_click_and_get_url TO anon;
GRANT EXECUTE ON FUNCTION public.track_click_and_get_url TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_click_and_get_url TO service_role;

COMMIT;
