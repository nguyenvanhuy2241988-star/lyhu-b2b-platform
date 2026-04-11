-- Sửa lỗi hiển thị dữ liệu Kanban: Thay đổi RLS Policy sử dụng hàm kiểm tra role chuẩn của hệ thống LYHU (get_my_claim_role) thay vì JWT

-- 1. Xóa các policy cũ bị sai logic
DROP POLICY IF EXISTS "Cho phép Admin đọc ghi" ON factory_setup_vendors;
DROP POLICY IF EXISTS "Cho phép Admin đọc ghi task" ON factory_setup_tasks;
DROP POLICY IF EXISTS "Cho phép Admin đọc ghi expenses" ON factory_setup_expenses;

-- 2. Cấp lại quyền dựa trên get_my_claim_role()
CREATE POLICY "Sửa quyền Admin cho Vendors" ON factory_setup_vendors FOR ALL
USING (get_my_claim_role() IN ('admin', 'accountant'))
WITH CHECK (get_my_claim_role() IN ('admin', 'accountant'));

CREATE POLICY "Sửa quyền Admin cho Tasks" ON factory_setup_tasks FOR ALL
USING (get_my_claim_role() = 'admin')
WITH CHECK (get_my_claim_role() = 'admin');

CREATE POLICY "Sửa quyền Admin cho Expenses" ON factory_setup_expenses FOR ALL
USING (get_my_claim_role() IN ('admin', 'accountant'))
WITH CHECK (get_my_claim_role() IN ('admin', 'accountant'));
