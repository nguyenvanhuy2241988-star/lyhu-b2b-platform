-- ==============================================================================
-- Module: Factory Setup AI Chat History
-- ==============================================================================

CREATE TABLE IF NOT EXISTS factory_setup_ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE factory_setup_ai_chats ENABLE ROW LEVEL SECURITY;

-- Policies: Cho phép Admin/Telesales đọc và ghi lịch sử chat của chính họ, 
-- hoặc cho phép tất cả Admin dùng chung 1 luồng chat (Thiết kế hệ thống: lưu theo account)
CREATE POLICY "Admin access own factory chat" ON factory_setup_ai_chats FOR ALL
USING (get_my_claim_role() IN ('admin', 'accountant') AND user_id = auth.uid())
WITH CHECK (get_my_claim_role() IN ('admin', 'accountant') AND user_id = auth.uid());
