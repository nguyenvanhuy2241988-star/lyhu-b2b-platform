-- 1. Add Source Column for Tracking
ALTER TABLE public.recruitment_candidates
ADD COLUMN IF NOT EXISTS source text DEFAULT 'Direct';

-- 2. Public RPC for Submitting Applications (Bypass RLS for Anon)
CREATE OR REPLACE FUNCTION public.submit_application(
    p_job_id uuid,
    p_full_name text,
    p_email text,
    p_phone text,
    p_cv_url text DEFAULT NULL,
    p_source text DEFAULT 'Direct'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to insert even if RLS blocks anon
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_id uuid;
BEGIN
    -- Validation (Optional)
    IF p_full_name IS NULL OR p_phone IS NULL THEN
        RAISE EXCEPTION 'Name and Phone are required';
    END IF;

    INSERT INTO public.recruitment_candidates (
        job_id,
        full_name,
        email,
        phone,
        cv_url,
        source, -- Track where they came from (Facebook, Referral, etc)
        status,
        created_at
    ) VALUES (
        p_job_id,
        p_full_name,
        p_email,
        p_phone,
        p_cv_url,
        p_source,
        'new',
        now()
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.submit_application TO anon, authenticated, service_role;

-- Ensure table permissions (though RPC bypasses RLS, grant is good hygiene for future changes)
-- GRANT INSERT ON TABLE public.recruitment_candidates TO anon; -- Not strictly needed if using Security Definer RPC

COMMIT;

NOTIFY pgrst, 'reload schema';
