-- Xóa các bài viết mẫu (nếu đã tạo trước đó) để hệ thống sinh lại từ đầu
DELETE FROM public.blog_posts
WHERE slug IN (
    'tap-hoa-gan-truong-hoc-nen-nhap-gi-5-nhom-hang-co-vong-quay-tot',
    'phan-tich-xu-huong-tieu-dung-fmcg-2026-tap-hoa-truyen-thong-dang-chuyen-minh-ra-sao',
    'bao-cao-tai-cau-truc-chuoi-cung-ung-keo-deo-va-banh-trang-tai-thi-truong-viet-nam'
);
