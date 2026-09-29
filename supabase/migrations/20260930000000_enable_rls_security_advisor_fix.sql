-- Migration: Khắc phục 6 cảnh báo bảo mật Supabase Security Advisor
-- Bật Row-Level Security (RLS) cho 3 bảng: products, customers, profiles
-- Áp dụng phân quyền chặt chẽ theo role thực tế của LYHU

BEGIN;

-- 1. HÀM LẤY ROLE HIỆN TẠI (SECURITY DEFINER để không bị chặn bởi RLS)
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ==============================================================================
-- 2. BẢNG PRODUCTS (Sản phẩm)
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_read_policy" ON public.products;
DROP POLICY IF EXISTS "products_write_staff" ON public.products;

-- Khách vãng lai và mọi người đều xem được danh mục sản phẩm trên web
CREATE POLICY "products_select_public" 
ON public.products FOR SELECT 
USING (true);

-- CHỈ ADMIN VÀ KẾ TOÁN (accountant) mới được Thêm / Sửa / Xóa sản phẩm
CREATE POLICY "products_write_staff" 
ON public.products FOR ALL 
TO authenticated 
USING (public.get_current_role() IN ('admin', 'accountant')) 
WITH CHECK (public.get_current_role() IN ('admin', 'accountant'));


-- ==============================================================================
-- 3. BẢNG CUSTOMERS (Khách hàng B2B / Leads CRM)
-- ==============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_staff_select" ON public.customers;
DROP POLICY IF EXISTS "customers_read_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_staff_modify" ON public.customers;

-- Chỉ nhân sự nội bộ (loại trừ 'customer') mới được xem khách hàng
CREATE POLICY "customers_staff_select" 
ON public.customers FOR SELECT 
TO authenticated 
USING (public.get_current_role() NOT IN ('customer'));

-- Chỉ nhân viên nội bộ (loại trừ 'customer', 'ctv') mới được tạo/sửa thông tin khách hàng
CREATE POLICY "customers_staff_modify" 
ON public.customers FOR ALL 
TO authenticated 
USING (public.get_current_role() NOT IN ('customer', 'ctv')) 
WITH CHECK (public.get_current_role() NOT IN ('customer', 'ctv'));


-- ==============================================================================
-- 4. BẢNG PROFILES (Hồ sơ người dùng)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;

-- TỰ XEM HỒ SƠ CỦA MÌNH; hoặc NHÂN SỰ NỘI BỘ xem được nhau; CUSTOMER/CTV KHÔNG ĐƯỢC XEM NGƯỜI KHÁC
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  auth.uid() = id 
  OR public.get_current_role() NOT IN ('customer', 'ctv')
);

-- Tự tạo hồ sơ của chính mình khi đăng ký hoặc Admin tạo
CREATE POLICY "profiles_insert_authenticated" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id OR public.get_current_role() = 'admin');

-- Mỗi người chỉ sửa hồ sơ của mình; ADMIN có toàn quyền sửa hồ sơ bất kỳ ai
CREATE POLICY "profiles_update_authenticated" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id OR public.get_current_role() = 'admin') 
WITH CHECK (auth.uid() = id OR public.get_current_role() = 'admin');

COMMIT;
