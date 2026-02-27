-- Create tags master table
CREATE TABLE IF NOT EXISTS documents_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT 'blue',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- File Tags Mapping
CREATE TABLE IF NOT EXISTS documents_file_tags (
    file_id UUID REFERENCES documents_files(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES documents_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (file_id, tag_id)
);

-- Folder Tags Mapping 
CREATE TABLE IF NOT EXISTS documents_folder_tags (
    folder_id UUID REFERENCES documents_folders(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES documents_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (folder_id, tag_id)
);

-- RLS
ALTER TABLE documents_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_folder_tags ENABLE ROW LEVEL SECURITY;

-- Note: In a production app you might want to scope read/write by roles
-- but here we allow authenticated profiles to query and assign tags freely within the module logic
CREATE POLICY "Allow authenticated users to read documents_tags"
ON documents_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert documents_tags"
ON documents_tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update documents_tags"
ON documents_tags FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete documents_tags"
ON documents_tags FOR DELETE TO authenticated USING (true);

-- Mapping Policies
CREATE POLICY "Allow authenticated users to read documents_file_tags"
ON documents_file_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify documents_file_tags"
ON documents_file_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read documents_folder_tags"
ON documents_folder_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify documents_folder_tags"
ON documents_folder_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
