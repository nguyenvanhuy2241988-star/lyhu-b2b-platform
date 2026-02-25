-- Migration: 20260103_fix_role_trigger.sql
-- Description: Super Robust Fix for Admin Role Updates.
-- Handles service_role, null auth context (server-side), and admin bypass.

-- 1. Xóa hẳn trigger cũ để đảm bảo không bị chồng chéo
DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;

-- 2. Cập nhật Function với logic linh hoạt và logging lỗi nếu cần
CREATE OR REPLACE FUNCTION public.prevent_role_change() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    -- BỎ QUA CHO SERVICE_ROLE (API SERVER) HOẶC KHI KHÔNG CÓ USER ID (JWT TỪ SERVER)
    -- Điều này cực kỳ quan trọng để API phía Server (Admin Dashboard) có thể hoạt động.
    IF (auth.role() = 'service_role' OR auth.uid() IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Kiểm tra nếu có sự thay đổi Role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Chỉ cho phép nếu người đang thực hiện thực sự là Admin (kiểm tra trong bảng profiles)
        IF EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RETURN NEW;
        END IF;

        -- Nếu không phải Admin thì báo lỗi chi tiết
        RAISE EXCEPTION 'Bạn không có quyền thay đổi vai trò. (Role: %, UID: %)', auth.role(), auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Tạo lại trigger để áp dụng logic mới
CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- 4. Reload PostgREST (tùy chọn)
NOTIFY pgrst, 'reload config';
