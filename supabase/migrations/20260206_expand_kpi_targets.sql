-- Add new KPI target columns to recruitment_kpi_settings
ALTER TABLE public.recruitment_kpi_settings
ADD COLUMN IF NOT EXISTS fb_personal_posts_target INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS threads_posts_target INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS threads_comments_target INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS zalo_posts_target INTEGER DEFAULT 5;

-- Update the realtime publication to include these changes (if not already covered by table-wide)
-- Since we added the table to publication, schema changes should be fine, but good to be aware.
