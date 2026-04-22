-- Migration: B2B Sales Kits / Catalogs Management
-- Description: Creates tables to store product catalogs and sales kits for Telesales/B2B to use.

CREATE TABLE IF NOT EXISTS public.b2b_sales_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    target_audience TEXT, -- e.g., 'Chuỗi Siêu Thị (MT)', 'Tạp Hóa (GT)'
    file_url TEXT, -- Path in Supabase Storage
    cover_image_url TEXT,
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.b2b_sales_kits ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Admins can manage b2b_sales_kits" ON public.b2b_sales_kits;
DROP POLICY IF EXISTS "Telesales can view active b2b_sales_kits" ON public.b2b_sales_kits;

-- Policy: Admin can manage all
CREATE POLICY "Admins can manage b2b_sales_kits" ON public.b2b_sales_kits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Telesales can view active sales kits
CREATE POLICY "Telesales can view active b2b_sales_kits" ON public.b2b_sales_kits
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'telesales')
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check before creating trigger
DROP TRIGGER IF EXISTS b2b_sales_kits_updated_at ON public.b2b_sales_kits;
CREATE TRIGGER b2b_sales_kits_updated_at
    BEFORE UPDATE ON public.b2b_sales_kits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add to Storage Buckets (If not exists, create a 'documents' bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'documents' bucket
-- Drop old generic names if they were created by mistake in previous run
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- Drop specific names
DROP POLICY IF EXISTS "Documents Bucket Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Documents Bucket Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Documents Bucket Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Documents Bucket Admin Delete" ON storage.objects;

CREATE POLICY "Documents Bucket Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'documents' );

CREATE POLICY "Documents Bucket Admin Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'documents' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Documents Bucket Admin Update" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'documents' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Documents Bucket Admin Delete" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'documents' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
