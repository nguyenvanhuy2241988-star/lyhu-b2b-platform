-- Mở khóa quyền lấy File Ảnh từ Storage cho Bot
DROP POLICY IF EXISTS "Bot doc media bucket" ON storage.objects;
CREATE POLICY "Bot doc media bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lyhu-docs');
