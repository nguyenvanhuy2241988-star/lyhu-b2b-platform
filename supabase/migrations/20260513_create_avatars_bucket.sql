-- Tạo bucket 'avatars' nếu chưa có
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bật RLS cho storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có (để tránh lỗi khi chạy lại)
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;

-- Cho phép ai cũng xem được ảnh avatar
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Cho phép user tự upload avatar của mình
CREATE POLICY "Users can upload their own avatar." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Cho phép user tự cập nhật avatar
CREATE POLICY "Users can update their own avatar." 
ON storage.objects FOR UPDATE 
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Cho phép user tự xóa avatar
CREATE POLICY "Users can delete their own avatar." 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
