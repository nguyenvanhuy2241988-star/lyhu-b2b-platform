-- Create Wholesale Banners Table
CREATE TABLE IF NOT EXISTS public.wholesale_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url text NOT NULL,
    link_url text, -- Optional promotion/product link
    position text NOT NULL DEFAULT 'main_slider', -- main_slider, side_top, side_bottom
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.wholesale_banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active banners
CREATE POLICY "Public read active banners" 
ON public.wholesale_banners 
FOR SELECT 
USING (is_active = true);

-- Allow admins to do everything
CREATE POLICY "Admins full access to wholesale_banners" 
ON public.wholesale_banners 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Also allow Sale Admins to modify banners
CREATE POLICY "Sale Admins full access to wholesale_banners" 
ON public.wholesale_banners 
FOR ALL 
USING (get_current_user_role() = 'sale_admin');
