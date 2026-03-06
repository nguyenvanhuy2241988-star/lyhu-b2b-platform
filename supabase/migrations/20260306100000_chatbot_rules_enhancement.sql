-- Add new columns to chatbot_rules for enhanced automation
ALTER TABLE chatbot_rules 
ADD COLUMN IF NOT EXISTS reply_method text DEFAULT 'comment',
ADD COLUMN IF NOT EXISTS apply_to text DEFAULT 'comment',
ADD COLUMN IF NOT EXISTS auto_hide boolean DEFAULT false;

-- reply_method: 'comment' (public reply), 'inbox' (private message), 'both'
-- apply_to: 'comment', 'message', 'both'
-- auto_hide: automatically hide the comment after replying

COMMENT ON COLUMN chatbot_rules.reply_method IS 'How to reply: comment, inbox, or both';
COMMENT ON COLUMN chatbot_rules.apply_to IS 'Apply rule to: comment, message, or both';
COMMENT ON COLUMN chatbot_rules.auto_hide IS 'Auto-hide comment after replying';
