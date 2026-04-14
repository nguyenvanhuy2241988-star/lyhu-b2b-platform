-- Fix RLS. Add marketing role to telesales_fb_groups policies
DROP POLICY IF EXISTS "Cho phép xem telesales_fb_groups" ON telesales_fb_groups;
DROP POLICY IF EXISTS "Cho phép thêm telesales_fb_groups" ON telesales_fb_groups;
DROP POLICY IF EXISTS "Cho phép sửa telesales_fb_groups" ON telesales_fb_groups;
DROP POLICY IF EXISTS "Cho phép xóa telesales_fb_groups" ON telesales_fb_groups;

-- SELECT
CREATE POLICY "Cho phép xem telesales_fb_groups" ON telesales_fb_groups
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('telesales', 'sale_admin', 'marketing', 'admin')
        )
    );

-- INSERT
CREATE POLICY "Cho phép thêm telesales_fb_groups" ON telesales_fb_groups
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('telesales', 'sale_admin', 'marketing', 'admin')
        )
    );

-- UPDATE
CREATE POLICY "Cho phép sửa telesales_fb_groups" ON telesales_fb_groups
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('telesales', 'sale_admin', 'marketing', 'admin')
        )
    );

-- DELETE
CREATE POLICY "Cho phép xóa telesales_fb_groups" ON telesales_fb_groups
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('telesales', 'sale_admin', 'marketing', 'admin')
        )
    );
