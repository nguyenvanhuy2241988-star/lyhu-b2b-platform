-- Migration: 20251220004210_lock_profile_role.sql
-- Description: Prevent users from changing their own role or other users' roles unless they are an admin.

-- 1. Create function to prevent role changes
CREATE OR REPLACE FUNCTION public.prevent_role_change() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Get the role of the user performing the update
        SELECT role INTO current_user_role
        FROM public.profiles
        WHERE id = auth.uid();

        -- If the user performing the action is NOT an admin, raise an exception
        -- Using 'sales' or 'telesales' or other roles? Assuming 'admin' is the key role.
        -- We check if `current_user_role` is NOT 'admin'.
        -- (If current_user_role IS NULL, it means the user doesn't exist in profiles or is not logged in, so strictly block)
        IF current_user_role IS NULL OR current_user_role != 'admin' THEN
            RAISE EXCEPTION 'Not allowed to change role';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Create trigger to fire before update on profiles
DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;

CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();
