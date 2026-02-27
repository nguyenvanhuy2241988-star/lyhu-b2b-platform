-- Run this script in your Supabase SQL Editor to fix the schema cache and ensure columns exist

DO $$
BEGIN
    -- Check and add missing columns securely to telesales_kpi_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'calls_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN calls_target INTEGER DEFAULT 50;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'self_sourced_data_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN self_sourced_data_target INTEGER DEFAULT 10;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'fb_group_posts_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN fb_group_posts_target INTEGER DEFAULT 20;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'fb_comments_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN fb_comments_target INTEGER DEFAULT 50;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'fb_friends_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN fb_friends_target INTEGER DEFAULT 10;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'fb_personal_posts_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN fb_personal_posts_target INTEGER DEFAULT 5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_kpi_settings' AND column_name = 'zalo_posts_target') THEN
        ALTER TABLE public.telesales_kpi_settings ADD COLUMN zalo_posts_target INTEGER DEFAULT 5;
    END IF;
    
    -- Ensure columns have default values properly applied in case they were added previously without defaults
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN calls_target SET DEFAULT 50;
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN self_sourced_data_target SET DEFAULT 10;
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN fb_group_posts_target SET DEFAULT 20;
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN fb_comments_target SET DEFAULT 50;
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN fb_friends_target SET DEFAULT 10;
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN fb_personal_posts_target SET DEFAULT 5;
    ALTER TABLE public.telesales_kpi_settings ALTER COLUMN zalo_posts_target SET DEFAULT 5;

END $$;

-- Reload the PostgREST schema cache to make sure the API recognizes the columns
NOTIFY pgrst, 'reload schema';
