-- Thêm danh mục Demo
INSERT INTO public.blog_categories (name, slug, sort_order)
VALUES 
    ('Kinh nghiệm Mở Quán', 'kinh-nghiem-mo-quan', 1),
    ('Nguồn hàng sỉ', 'nguon-hang-si', 2),
    ('Xu hướng Ăn vặt', 'xu-huong-an-vat', 3)
ON CONFLICT (slug) DO NOTHING;

-- Thêm bài viết Demo (sử dụng category_id từ danh mục vừa thêm)
DO $$
DECLARE
    cat1_id uuid;
    cat2_id uuid;
    cat3_id uuid;
BEGIN
    SELECT id INTO cat1_id FROM public.blog_categories WHERE slug = 'kinh-nghiem-mo-quan';
    SELECT id INTO cat2_id FROM public.blog_categories WHERE slug = 'nguon-hang-si';
    SELECT id INTO cat3_id FROM public.blog_categories WHERE slug = 'xu-huong-an-vat';

    INSERT INTO public.blog_posts (title, slug, category_id, content, ai_summary, thumbnail_url, status, published_at)
    VALUES 
    (
        'Kinh Nghiệm Mở Siêu Thị Mini Ở Vùng Quê Vốn Nhỏ Lãi Cao',
        'kinh-nghiem-mo-sieu-thi-mini-vung-que',
        cat1_id,
        '<h2>Mở siêu thị mini ở quê có tiềm năng không?</h2><p>Ở các vùng nông thôn hiện nay, đời sống người dân đang ngày càng nâng cao. Nhu cầu mua sắm tại các cửa hàng tạp hóa hiện đại, siêu thị mini sáng sủa sạch sẽ đang tăng mạnh.</p><p>Bài viết này hướng dẫn chi tiết cách chọn mặt bằng, nhập hàng và quản lý doanh thu hiệu quả.</p>',
        'Hướng dẫn chi tiết từ A-Z cách setup một siêu thị mini ở vùng nông thôn, từ việc chọn địa điểm đến quản lý nguồn vốn.',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1600&auto=format&fit=crop',
        'published',
        now()
    ),
    (
        'Top 5 Mặt Hàng Kẹo Dẻo Thái Lan Hot Nhất Giới Trẻ',
        'top-5-mat-hang-keo-deo-thai-lan',
        cat3_id,
        '<h2>Kẹo dẻo siêu chua Thái Lan đang lên ngôi</h2><p>Thời gian gần đây, kẹo dẻo chua Thái Lan đang gây sốt rần rần trên TikTok. Các tạp hóa và siêu thị mini nếu không cập nhật sớm sẽ mất đi lượng lớn khách hàng trẻ em và học sinh.</p>',
        'Tổng hợp 5 loại kẹo dẻo Thái Lan nhập sỉ bán chạy nhất, giúp chủ tạp hóa tăng mạnh doanh thu mảng bánh kẹo nhập khẩu.',
        'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=1600&auto=format&fit=crop',
        'published',
        now()
    ),
    (
        'Cách Tìm Nguồn Hàng Bánh Tráng Giá Sỉ Tận Xưởng',
        'cach-tim-nguon-hang-banh-trang-gia-si',
        cat2_id,
        '<h2>Tại sao nên bán bánh tráng?</h2><p>Bánh tráng trộn, bánh tráng nướng là món ăn vặt quốc dân. Nhập sỉ bánh tráng tận xưởng giúp bạn có biên độ lợi nhuận lên đến 40%.</p>',
        'Kinh nghiệm đàm phán và tìm nguồn sỉ bánh tráng trực tiếp từ xưởng Tây Ninh, tránh qua trung gian.',
        'https://images.unsplash.com/photo-1606112219348-204d7d8b94ee?q=80&w=1600&auto=format&fit=crop',
        'published',
        now()
    ),
    (
        'Bí Quyết Bày Trí Cửa Hàng Tạp Hóa Thu Hút Khách',
        'bi-quyet-bay-tri-cua-hang-tap-hoa',
        cat1_id,
        '<h2>Nguyên tắc trưng bày hàng hóa</h2><p>Một cửa hàng sạch sẽ, gọn gàng với cách bày trí logic sẽ kích thích khách hàng mua thêm những món đồ họ không định mua từ trước. Quy tắc cơ bản là: Hàng thiết yếu để phía trong, hàng ăn vặt và đồ chơi để phía ngoài, vừa tầm mắt trẻ em.</p>',
        'Áp dụng tâm lý học hành vi vào việc sắp xếp quầy kệ tạp hóa để tăng giá trị đơn hàng trung bình của khách.',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop',
        'published',
        now()
    )
    ON CONFLICT (slug) DO NOTHING;
END $$;
