-- Migration: Create RPC function for safer CRM updates
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_crm_columns(new_columns jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges (bypassing table RLS)
AS $$
BEGIN
  -- 1. Security Check: Only Admin can execute logic
  -- Note: We check against the profiles table for the 'admin' role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: You are not an admin';
  END IF;

  -- 2. Update logic: Update the single settings row, or create if missing
  IF EXISTS (SELECT 1 FROM app_settings LIMIT 1) THEN
    UPDATE app_settings 
    SET crm_columns = new_columns, 
        updated_at = now();
  ELSE
    INSERT INTO app_settings (crm_columns) VALUES (new_columns);
  END IF;
END;
$$;
