-- ============================================
-- Follow-up Multi-tier + Historical Data Backfill
-- ============================================

-- 1. Add followup_count column to social_conversations
ALTER TABLE social_conversations ADD COLUMN IF NOT EXISTS followup_count int DEFAULT 0;

-- 2. Add 'historical' status to marketing_leads
ALTER TABLE marketing_leads DROP CONSTRAINT IF EXISTS marketing_leads_status_check;
ALTER TABLE marketing_leads ADD CONSTRAINT marketing_leads_status_check 
    CHECK (status IN ('pending', 'assigned', 'rejected', 'historical'));

-- 3. Backfill historical data (before 15:25 today) — for statistics only, NOT distributed
INSERT INTO marketing_leads (conversation_id, customer_name, customer_phone, customer_avatar, region, source, page_id, status, created_at)
SELECT sc.id, sc.customer_name, sc.customer_phone, sc.customer_avatar, sc.customer_region,
       'facebook_messenger', sc.page_id, 'historical', sc.last_message_at
FROM social_conversations sc
WHERE sc.customer_phone IS NOT NULL
  AND sc.last_message_at < '2026-03-07 15:25:00+07'
  AND NOT EXISTS (SELECT 1 FROM marketing_leads ml WHERE ml.conversation_id = sc.id);
