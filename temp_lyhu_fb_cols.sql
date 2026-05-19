ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS is_lyhu_fb_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lyhu_fb_post_id TEXT;
