# LYHU – Tồn đọng bảo mật (cập nhật 17/10/2026)
Supabase project: `wepxcpifgxghfvdgnkeh`

## Đã xử lý (để đối chiếu)
- `get_orders_v3`: lấy vai trò từ `profiles`, thu hồi quyền của `anon`; 4 hàm thống kê thu hồi `anon`.
- `app_secrets` (MISA, Facebook Ads), siết `app_settings`; token Facebook Ads đã đổi.
- `internal_messages`: bỏ policy cho đọc tất cả. `financial_transactions`: bỏ policy mở, thêm RPC cập nhật/xóa.
- `company_social_accounts`: chỉ admin. `/api/admin/npp-targets`: kiểm tra phiên + vai trò.
- Khách hàng / đơn / hoạt động CRM / sản phẩm trong cơ hội / KPI / điểm game / nhóm FB: giới hạn theo chủ sở hữu (17/10).
- `profiles`: khóa đọc `login_password`, `zalo_password`, `zalo_backup_password`, `identity_card` (admin/HR đọc qua `admin_get_profile_secrets`).
- `create_order_v2`: ép `telesales_user_id` = người đăng nhập và `status = pending` với nhân viên thường; khách vãng lai luôn `B2B_WEB`/`pending`. Thu hồi `anon` của `count_new_outlets`, `has_prior_orders`, `get_online_eligible_telesales`.

## Còn tồn đọng – ưu tiên CAO
1. **Đổi mật khẩu 25 tài khoản** có `login_password` (đã từng lộ cho mọi nhân viên). Về lâu dài không lưu mật khẩu dạng chữ thường trong `profiles`; bỏ cột hoặc chuyển sang bảng riêng chỉ admin.
2. **MISA**: đổi mã truy cập MISA (chủ sở hữu chưa đổi), lưu lại qua `app_secrets`.
3. **Chat Fanpage / bot**: chuyển node server sang service key rồi đóng RLS các bảng chat + bot (hiện còn mở).
4. **`create_order_v2` còn tin giá**: giá, tổng tiền, chiết khấu do client gửi. Nên tính lại từ bảng `products` + `order_items` phía server; chặn số lượng/giá âm.
5. **Đơn khách vãng lai B2B**: policy `b2b_guest_orders_select` / `b2b_guest_order_items_select` cho người chưa đăng nhập đọc **mọi đơn B2B_WEB** (tên, SĐT, địa chỉ). Chuyển sang tra cứu theo mã đơn riêng (token) thay vì mở toàn bộ.
6. **Tài khoản tồn kho**: 21 tài khoản telesales/sale_admin tên "-" hoặc trống, tháng này không hoạt động; khóa hoặc xóa (cần danh sách của chủ sở hữu). Ảnh hưởng thêm: chỉ tiêu team trên web (`TelesalesKpiDashboard`) đang cộng cả tài khoản này. Mobile đã loại ra.
7. **Khách của tài khoản "-" (3.428 khách)** chỉ admin/sale_admin/director/manager thấy; cần giao lại cho telesales.

## Còn tồn đọng – ưu tiên TRUNG BÌNH
8. ~25 hàm `SECURITY DEFINER` có tham số nullable/không kiểm tra `auth.uid()` + `get_revenue_by_date`; rà từng hàm (advisor: 32 hàm cho `anon` chạy, 116 cho `authenticated`).
9. **Storage**: các bucket public (`task_attachments`, ...) – ai biết đường dẫn đều tải được; chuyển sang private + signed URL cho tài liệu nội bộ.
10. `telesales_fb_groups`: policy "Bot" cho `public` ALL (người chưa đăng nhập đọc/ghi/xóa). Chuyển bot sang service key.
11. `profiles`: mọi nhân viên đọc được email, SĐT, ngày sinh, quê quán, Facebook của đồng nghiệp; cân nhắc giới hạn theo nhu cầu. Người dùng tự sửa được `status`, `can_use_bot_center`, `department_id`, `employee_code` của chính mình (chỉ `role` được trigger chặn).
12. `shift_registrations`, `game_scores`, `kpi_metric_definitions`, `work_shifts`: policy đọc `public` (người chưa đăng nhập đọc được).
13. Mật khẩu `company_social_accounts` còn ở dạng chữ thường (đã giới hạn admin); nên mã hóa.
14. Trang `/debug-role` (tự đổi vai trò) nên xóa khỏi bản production; DB đã chặn đổi vai trò bằng trigger `prevent_role_change`.
15. Advisor khác: 26 hàm thiếu `search_path` cố định, extension nằm trong schema `public`, 8 bảng bật RLS nhưng chưa có policy.
16. Bật 2FA cho admin / kế toán; kiểm tra bản deploy Vercel của thay đổi menu web.
17. Web: `checkDuplicatePhone` (không còn dùng) – nếu dùng lại phải gọi RPC `check_customer_phone`.
