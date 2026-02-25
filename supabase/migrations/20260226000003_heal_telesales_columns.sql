-- Safely add missing columns to telesales_daily_activities 
-- Handles cases where the table was created previously without these specific KPI columns

DO $$ 
BEGIN
    -- Add report_date if it doesn't exist (and date does exist)
    -- BUT wait! The user ALREADY has report_date (as established previously), so we'll just ensure it's there
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'report_date') THEN
        -- If report_date doesn't exist, try renaming 'date' to 'report_date'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'date') THEN
            ALTER TABLE public.telesales_daily_activities RENAME COLUMN date TO report_date;
        ELSE
            ALTER TABLE public.telesales_daily_activities ADD COLUMN report_date DATE NOT NULL DEFAULT CURRENT_DATE;
        END IF;
    END IF;

    -- Add KPI columns securely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'calls_completed') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN calls_completed INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'fb_group_posts') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN fb_group_posts INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'fb_comments') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN fb_comments INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'fb_friends') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN fb_friends INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'fb_personal_posts') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN fb_personal_posts INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'zalo_posts') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN zalo_posts INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'self_sourced_data') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN self_sourced_data INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Add text columns securely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'issues') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN issues TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'request_support') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN request_support TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'other_tasks') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN other_tasks TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telesales_daily_activities' AND column_name = 'plan_next_day') THEN
        ALTER TABLE public.telesales_daily_activities ADD COLUMN plan_next_day TEXT;
    END IF;

END $$;
