-- Fix: Cập nhật SĐT cho Nguyễn Thị Thu (0813063096) — AI đã nhận nhưng không lưu vào DB
UPDATE social_conversations
SET customer_phone = '0813063096',
    needs_followup = false
WHERE customer_name ILIKE '%Nguyễn Thị Thu%'
  AND customer_phone IS NULL;

-- Verify
SELECT id, customer_name, customer_phone, needs_followup
FROM social_conversations
WHERE customer_name ILIKE '%Nguyễn Thị Thu%';
