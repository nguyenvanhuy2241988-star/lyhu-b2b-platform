-- Migration: Add Tracking Code to Candidates for Lead Attribution
-- Purpose: Link a candidate application to a specific Recruiter's Tracking Link

BEGIN;

-- 1. Add Column (Safe if exists)
ALTER TABLE public.recruitment_candidates
ADD COLUMN IF NOT EXISTS tracking_code text REFERENCES public.tracking_shortlinks(code) ON DELETE SET NULL;

-- 2. Drop OLD Function to avoid ambiguity (Overload conflict)
-- Old signature had 6 arguments
DROP FUNCTION IF EXISTS public.submit_application(uuid, text, text, text, text, text);

-- 3. Update RPC (Create New Function with 7 arguments)
CREATE OR REPLACE FUNCTION public.submit_application(
    p_job_id uuid,
    p_full_name text,
    p_email text,
    p_phone text,
    p_cv_url text DEFAULT NULL,
    p_source text DEFAULT 'Direct',
    p_tracking_code text DEFAULT NULL -- New Parameter
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_id uuid;
BEGIN
    -- Validation
    IF p_full_name IS NULL OR p_phone IS NULL THEN
        RAISE EXCEPTION 'Name and Phone are required';
    END IF;

    INSERT INTO public.recruitment_candidates (
        job_id,
        full_name,
        email,
        phone,
        cv_url,
        source, 
        tracking_code, -- Store the code
        status,
        created_at
    ) VALUES (
        p_job_id,
        p_full_name,
        p_email,
        p_phone,
        p_cv_url,
        p_source,
        p_tracking_code,
        'new',
        now()
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- 4. Grant Permissions (Specific Signature to prevent "not unique" error)
GRANT EXECUTE ON FUNCTION public.submit_application(uuid, text, text, text, text, text, text) TO anon, authenticated, service_role;

COMMIT;
