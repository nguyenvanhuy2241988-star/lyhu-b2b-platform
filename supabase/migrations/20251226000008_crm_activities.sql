-- CRM Activities Table - Lịch sử hoạt động
-- Chạy trong Supabase SQL Editor

-- =====================================================
-- 1. TẠO BẢNG CRM_ACTIVITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Loại hoạt động
    type text NOT NULL DEFAULT 'call',  -- call, note, email, meeting, task
    
    -- Nội dung
    subject text,                        -- Tiêu đề ngắn
    description text,                    -- Mô tả chi tiết
    
    -- Thông tin cuộc gọi
    call_duration_seconds int,           -- Thời lượng (giây)
    call_result text,                    -- Kết quả: answered, no_answer, busy, voicemail
    
    -- Meta
    user_id uuid NOT NULL,               -- Ai thực hiện
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. TẠO INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_activities_deal ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON crm_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON crm_activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON crm_activities(created_at DESC);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả (testing)
DROP POLICY IF EXISTS crm_activities_allow_all ON crm_activities;
CREATE POLICY crm_activities_allow_all ON crm_activities
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 4. VERIFY
-- =====================================================

SELECT 'CRM Activities table created successfully!' as message;
