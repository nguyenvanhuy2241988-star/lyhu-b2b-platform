-- Cho phép BOT (dùng Anon Key) được quyền ĐỌC file trong thư viện Media để lấy ảnh đăng bài
CREATE POLICY "Cho phép Bot ẩn danh đọc file từ Media Library" 
ON public.documents_files 
FOR SELECT 
USING (is_deleted = false);

CREATE POLICY "Cho phép Bot đọc thư mục Media" 
ON public.documents_folders 
FOR SELECT 
USING (is_deleted = false);
