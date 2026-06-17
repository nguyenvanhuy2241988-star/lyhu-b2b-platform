CREATE TABLE IF NOT EXISTS ai_optimization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_filter TEXT NOT NULL,
    objective_filter TEXT NOT NULL,
    ad_sets_analyzed INTEGER NOT NULL,
    recommendations JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE ai_optimization_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own optimization logs"
ON ai_optimization_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own logs
CREATE POLICY "Users can view their own optimization logs"
ON ai_optimization_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);
