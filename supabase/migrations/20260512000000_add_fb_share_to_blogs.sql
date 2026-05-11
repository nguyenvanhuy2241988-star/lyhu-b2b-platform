-- Add columns to track Facebook sharing status
ALTER TABLE blog_posts ADD COLUMN is_fb_shared BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN fb_post_id TEXT;

-- Create index for faster querying by the cron job
CREATE INDEX IF NOT EXISTS idx_blog_posts_fb_shared ON blog_posts(status, is_fb_shared);
