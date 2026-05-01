-- Xóa bài viết cũ (có tiêu đề cũ và nội dung chưa chuẩn) 
-- để hệ thống tự động sinh lại với prompt và tiêu đề mới khi gọi lại API
DELETE FROM public.blog_posts
WHERE slug = 'top-5-mat-hang-an-vat-ban-chay-nhat-cho-tap-hoa-gan-truong-hoc';
