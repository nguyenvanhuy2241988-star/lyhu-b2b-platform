-- Add income_policies JSONB column to app_settings
-- Stores income policies per department: { "telesales": {...}, "admin": {...}, ... }
ALTER TABLE public.app_settings
    ADD COLUMN IF NOT EXISTS income_policies JSONB DEFAULT '{}'::jsonb;

-- Seed default telesales policy
UPDATE public.app_settings
SET income_policies = jsonb_build_object(
    'telesales', jsonb_build_object(
        'baseSalary', 2500000,
        'paymentDay', 5,
        'hoursPerDay', 4.5,
        'maxUnexcusedAbsences', 3,
        'allowances', jsonb_build_array(
            jsonb_build_object('name', 'Gửi xe', 'amount', '100.000đ'),
            jsonb_build_object('name', 'Trang phục', 'amount', 'Cấp theo quý')
        ),
        'bonuses', jsonb_build_array(
            jsonb_build_object('title', 'Mở mới Siêu thị', 'amount', '+100.000đ', 'desc', 'Mỗi khách hàng kênh Siêu thị mới'),
            jsonb_build_object('title', 'Mở mới Đại lý', 'amount', '+300.000đ', 'desc', 'Mỗi đơn hàng đầu tiên của Đại lý mới'),
            jsonb_build_object('title', 'Sáng kiến', 'amount', '+50 - 200k', 'desc', 'Mỗi ý kiến cải tiến quy trình hiệu quả')
        ),
        'penalties', jsonb_build_array(
            jsonb_build_object('name', 'Đi muộn / Về sớm', 'desc', 'Không có lý do chính đáng & chưa báo Admin', 'fine', '50.000đ'),
            jsonb_build_object('name', 'Sai lệch Trang phục', 'desc', 'Quên mặc đồng phục khi có sự kiện', 'fine', '50.000đ')
        ),
        'penaltyNote', 'Mọi khoản phí phạt đều được gom vào quỹ Bonding để dùng cho các hoạt động ngoại khóa, liên hoan của tập thể Telesales.',
        'commissionNote', 'Hoa hồng tính trên phần doanh số VƯỢT target. Ví dụ: Doanh số 100tr, Target 50tr, Hoa hồng 3% → 50tr × 3% = 1.5tr.',
        'version', 'v3.2'
    )
)
WHERE income_policies IS NULL OR income_policies = '{}'::jsonb;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
