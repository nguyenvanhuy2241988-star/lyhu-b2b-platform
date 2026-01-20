-- Create RPC for deleting orders with permission checks
CREATE OR REPLACE FUNCTION public.delete_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_role text;
    v_uid uuid;
    v_order_owner uuid;
    v_status text;
BEGIN
    v_uid := auth.uid();
    
    -- Get User Role
    SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
    v_role := LOWER(COALESCE(v_role, 'customer'));

    -- Check order existence and ownership
    SELECT telesales_user_id, status INTO v_order_owner, v_status 
    FROM public.orders 
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- PERMISSION LOGIC
    IF v_role IN ('admin', 'accountant') THEN
        -- Admin and Accountant can delete ANY order
        NULL; 
    ELSIF v_order_owner = v_uid THEN
        -- Owner can delete their own order
        -- Optional: Restrict deletion if order is already delivered? 
        -- For now, allowing deletion as per user request "User có quyền xóa đơn của mình"
        NULL;
    ELSE
        RAISE EXCEPTION 'Permission denied: You can only delete your own orders';
    END IF;

    -- Perform Deletion (Cascade manually to be safe)
    DELETE FROM public.order_messages WHERE order_id = p_order_id;
    DELETE FROM public.order_items WHERE order_id = p_order_id;
    DELETE FROM public.orders WHERE id = p_order_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_order TO service_role;
