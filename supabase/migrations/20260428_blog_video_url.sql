-- Migration: Add video_url to blog_posts
-- Description: Adds a column to store Youtube/Tiktok/Drive video URLs for blog posts to support the new UI.

ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS video_url TEXT;
