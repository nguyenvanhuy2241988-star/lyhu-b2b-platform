-- Add captions column to documents_files table
-- This stores an array of text captions (content variations) for the file
ALTER TABLE documents_files 
ADD COLUMN IF NOT EXISTS captions JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN documents_files.captions IS 'List of content variations (status/caption) for this file. Used by Marketing Bot.';
