-- RPC: Add Financial Transaction (Bypass Permissions)
-- Allows inserting bonus/transactions for users without triggering RLS on user table

CREATE OR REPLACE FUNCTION public.create_financial_transaction_v2(
    p_user_id uuid,
    p_type text,
    p_category text,
    p_amount numeric,
    p_status text,
    p_reference_id uuid DEFAULT NULL,
    p_note text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    INSERT INTO financial_transactions (
        user_id,
        type,
        category,
        amount,
        status,
        reference_id,
        note,
        metadata
    ) VALUES (
        p_user_id,
        p_type,
        p_category,
        p_amount,
        p_status,
        p_reference_id,
        p_note,
        p_metadata
    );
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating transaction: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.create_financial_transaction_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_financial_transaction_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.create_financial_transaction_v2 TO service_role;

NOTIFY pgrst, 'reload schema';
