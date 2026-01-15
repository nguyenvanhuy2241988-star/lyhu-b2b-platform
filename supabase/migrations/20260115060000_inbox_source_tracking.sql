-- Add Attribution Fields to Social Conversations
ALTER TABLE social_conversations 
ADD COLUMN IF NOT EXISTS referral_source TEXT, -- 'ads', 'post', 'ref_param'
ADD COLUMN IF NOT EXISTS ad_id TEXT,
ADD COLUMN IF NOT EXISTS ad_title TEXT, -- Campaign Name or Ad Title
ADD COLUMN IF NOT EXISTS ref_parameter TEXT;

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_social_conversations_referral ON social_conversations(referral_source);

-- Function to get Inbox Counts per Page
-- Usage: SELECT * FROM get_inbox_counts();
CREATE OR REPLACE FUNCTION get_inbox_counts()
RETURNS TABLE (
    page_id UUID,
    page_name TEXT,
    unread_conversations BIGINT,
    total_conversations BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.page_id,
        fp.name as page_name,
        COUNT(*) FILTER (WHERE sc.unread_count > 0) as unread_conversations,
        COUNT(*) as total_conversations
    FROM social_conversations sc
    JOIN facebook_pages fp ON sc.page_id = fp.id
    WHERE 
        -- Permission check: User must be admin/marketing/sale_admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin', 'marketing', 'telesales', 'sales'))
    GROUP BY sc.page_id, fp.name;
END;
$$;
