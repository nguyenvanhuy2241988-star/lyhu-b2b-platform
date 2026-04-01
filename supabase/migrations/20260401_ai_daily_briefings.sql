-- =============================================
-- AI Daily Briefing Cache Table
-- =============================================
-- Stores AI-generated daily briefings per user
-- to avoid calling Gemini on every page refresh
-- =============================================

CREATE TABLE IF NOT EXISTS ai_daily_briefings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL, -- The AI-generated briefing text
    data_snapshot JSONB DEFAULT '{}', -- Raw data used to generate the briefing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, briefing_date)
);

-- RLS Policies: Users can only see their own briefings
ALTER TABLE ai_daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefings"
    ON ai_daily_briefings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefings"
    ON ai_daily_briefings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefings"
    ON ai_daily_briefings FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role bypass for API
CREATE POLICY "Service role full access"
    ON ai_daily_briefings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ai_briefings_user_date 
    ON ai_daily_briefings(user_id, briefing_date DESC);
