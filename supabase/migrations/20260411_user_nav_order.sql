-- =============================================
-- Feature: User Sidebar Nav Order Preferences
-- Created: 2026-04-11
-- =============================================

-- Lưu thứ tự sidebar navigation cho mỗi user
CREATE TABLE IF NOT EXISTS user_nav_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    -- nav_order: array các href theo thứ tự user muốn
    nav_order TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Mỗi user chỉ có 1 bản ghi cho mỗi role
    UNIQUE(user_id, role)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_nav_order_user_role ON user_nav_order(user_id, role);

-- RLS
ALTER TABLE user_nav_order ENABLE ROW LEVEL SECURITY;

-- User chỉ đọc/sửa thứ tự của chính mình
CREATE POLICY "user_nav_order_select_own" ON user_nav_order
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_nav_order_insert_own" ON user_nav_order
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_nav_order_update_own" ON user_nav_order
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_nav_order_delete_own" ON user_nav_order
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());
