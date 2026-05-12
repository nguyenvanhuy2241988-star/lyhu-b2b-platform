-- Thêm cột lưu mật khẩu gốc để Admin có thể xem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_password text;

-- Cập nhật mật khẩu cho 10 tài khoản telesales đã tạo
UPDATE public.profiles 
SET login_password = 'Telesales@2026' 
WHERE email LIKE 'telesales%@lyhu.vn';

-- Cập nhật RPC để trả về login_password
DROP FUNCTION IF EXISTS get_users_activity_stats(date);

CREATE OR REPLACE FUNCTION get_users_activity_stats(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text,
    misa_employee_code text,
    zalo_phone text,
    zalo_password text,
    zalo_backup_password text,
    login_password text,
    online_seconds int, 
    last_seen timestamptz,
    last_path text,
    device_info text,
    current_ip text,
    is_online boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email,
        p.full_name,
        p.role,
        p.misa_employee_code,
        p.zalo_phone::text,
        p.zalo_password::text,
        p.zalo_backup_password::text,
        p.login_password::text,
        COALESCE(uda.online_seconds, 0) as online_seconds,
        uda.last_seen,
        uda.last_path,
        uda.device_info,
        uda.current_ip,
        (uda.last_seen > (now() - interval '2 minutes')) as is_online
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_users_activity_stats(date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_activity_stats(date) TO service_role;
