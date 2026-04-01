-- =============================================
-- Migration: inventory_sync_log table
-- Purpose: Track MISA inventory sync history
-- =============================================

CREATE TABLE IF NOT EXISTS inventory_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type TEXT DEFAULT 'misa_pull',
    items_synced INTEGER DEFAULT 0,
    items_changed INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}',
    status TEXT DEFAULT 'success',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE inventory_sync_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "service_role_full_access" ON inventory_sync_log
    FOR ALL USING (true);

-- Allow authenticated users to read (for UI)
CREATE POLICY "authenticated_read" ON inventory_sync_log
    FOR SELECT TO authenticated USING (true);

-- Index for quick last-sync lookup
CREATE INDEX idx_inventory_sync_log_status_created
    ON inventory_sync_log (status, created_at DESC);

-- Verify
SELECT 'inventory_sync_log table created successfully' AS result;
