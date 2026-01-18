-- Add new columns to recruitment_candidates if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment_candidates' AND column_name = 'source') THEN
        ALTER TABLE recruitment_candidates ADD COLUMN source TEXT DEFAULT 'Direct';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment_candidates' AND column_name = 'cv_url') THEN
        ALTER TABLE recruitment_candidates ADD COLUMN cv_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruitment_candidates' AND column_name = 'notes') THEN
        ALTER TABLE recruitment_candidates ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Create recruitment_interviews table
CREATE TABLE IF NOT EXISTS recruitment_interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES recruitment_candidates(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    type TEXT CHECK (type IN ('online', 'offline', 'phone')) DEFAULT 'online',
    meeting_link TEXT,
    location TEXT,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE recruitment_interviews ENABLE ROW LEVEL SECURITY;

-- Policies for recruitment_interviews
-- Allow authenticated users (recruiters/admins) to view all interviews for now
CREATE POLICY "Enable read access for authenticated users" ON recruitment_interviews
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON recruitment_interviews
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON recruitment_interviews
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON recruitment_interviews
    FOR DELETE
    USING (auth.role() = 'authenticated');
