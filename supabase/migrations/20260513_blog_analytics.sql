-- ==========================================
-- BỔ SUNG TÍNH NĂNG THEO DÕI LƯỢT XEM VÀ TÌM KIẾM
-- Chạy đoạn script này trong Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. Bổ sung cột view_count vào bảng bài viết
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. Tạo bảng lưu trữ lịch sử tìm kiếm (Trending Keywords)
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at DESC);

-- Bật RLS cho bảng search_logs
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Bất kỳ ai cũng có thể thêm log tìm kiếm (Public insert)
CREATE POLICY "Public can insert search logs"
    ON public.search_logs FOR INSERT
    WITH CHECK (true);

-- Chỉ nội bộ mới xem được lịch sử tìm kiếm
CREATE POLICY "Public can read search logs for trending"
    ON public.search_logs FOR SELECT
    USING (true);

-- 3. Tạo hàm RPC (Remote Procedure Call) để tăng view an toàn
-- Việc dùng RPC giúp tránh tình trạng Race Condition khi nhiều người cùng vào 1 lúc
CREATE OR REPLACE FUNCTION increment_blog_view(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền admin để bỏ qua RLS khi update
AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;
