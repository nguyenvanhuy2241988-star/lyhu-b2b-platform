-- =============================================
-- Migration: Add created_by to retail_chains for telesales role
-- Created: 2026-04-11
-- =============================================

-- 1. Add created_by column defaulting to the current user
ALTER TABLE retail_chains ADD COLUMN created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id);

-- 2. Add permissive policies for telesales users to manage their own created chains
CREATE POLICY "retail_chains_telesales_insert" ON retail_chains
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'telesales') AND
        created_by = auth.uid()
    );

CREATE POLICY "retail_chains_telesales_update" ON retail_chains
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'telesales') AND
        created_by = auth.uid()
    );

CREATE POLICY "retail_chains_telesales_delete" ON retail_chains
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'telesales') AND
        created_by = auth.uid()
    );
