-- Migration: Add MISA Branch Code to Profiles
-- Purpose: Allow each employee to have a specific Organization Unit (e.g., BĐH, KD, NB) for MISA Sync
-- Created: 2026-02-09

BEGIN;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'misa_branch_code'
    ) THEN 
        ALTER TABLE "public"."profiles" 
        ADD COLUMN "misa_branch_code" TEXT;
        
        COMMENT ON COLUMN "public"."profiles"."misa_branch_code" IS 'MISA Organization Unit Code (e.g. NB, BĐH, KD)';
    END IF;
END $$;

COMMIT;
