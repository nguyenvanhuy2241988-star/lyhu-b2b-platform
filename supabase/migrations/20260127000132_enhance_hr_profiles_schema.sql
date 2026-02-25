-- Migration: Enhance HR Profiles Schema
-- Purpose: Add detailed information fields for Employee Profiles (Hometown, Education, Interests, etc.)

BEGIN;

-- Add new columns to 'profiles' table safely
DO $$
BEGIN
    -- 1. Personal Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'place_of_origin') THEN
        ALTER TABLE public.profiles ADD COLUMN place_of_origin text; -- Quê quán
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'identity_card') THEN
        ALTER TABLE public.profiles ADD COLUMN identity_card text; -- CMND/CCCD
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text; -- Số điện thoại (Ensure it exists)
    END IF;

    -- 2. Education
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'education_school') THEN
        ALTER TABLE public.profiles ADD COLUMN education_school text; -- Trường học
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'education_major') THEN
        ALTER TABLE public.profiles ADD COLUMN education_major text; -- Chuyên ngành
    END IF;

    -- 3. Social & Interests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
        ALTER TABLE public.profiles ADD COLUMN interests text; -- Sở thích
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'social_facebook') THEN
        ALTER TABLE public.profiles ADD COLUMN social_facebook text; -- Link Facebook
    END IF;

END $$;

COMMIT;
