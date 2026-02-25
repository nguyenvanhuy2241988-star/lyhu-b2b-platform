-- Migration: Add MISA Employee Code to Profiles
-- Purpose: Map App Users to MISA Employees for correct sales attribution
-- Created: 2026-02-08

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'misa_employee_code'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN misa_employee_code text;
        
        COMMENT ON COLUMN public.profiles.misa_employee_code IS 'Mã nhân viên tương ứng trên MISA (Ví dụ: NV001)';
    END IF;
END $$;

COMMIT;
