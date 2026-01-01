-- Add missing columns to profiles table for Admin User Management

-- Add full_name column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Add status column (if not exists) with default 'active'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- Add index for performance on status column
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Add index for performance on role column (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add index for performance on email column (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.status IS 'User account status: active, inactive';
COMMENT ON COLUMN public.profiles.full_name IS 'Full name of the user';
