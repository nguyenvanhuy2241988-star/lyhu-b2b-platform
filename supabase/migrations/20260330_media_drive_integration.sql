-- Add Google Drive columns to media_assets
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS drive_file_id TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS drive_view_link TEXT;

-- Index for faster lookups by drive_file_id
CREATE INDEX IF NOT EXISTS idx_media_assets_drive_file_id ON media_assets(drive_file_id) WHERE drive_file_id IS NOT NULL;
