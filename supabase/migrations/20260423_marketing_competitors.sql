CREATE TABLE IF NOT EXISTS public.marketing_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    profile_url VARCHAR(1000) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketing_competitors ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write for now
CREATE POLICY "Enable read access for authenticated users" 
ON public.marketing_competitors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON public.marketing_competitors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
ON public.marketing_competitors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
ON public.marketing_competitors FOR DELETE TO authenticated USING (true);
