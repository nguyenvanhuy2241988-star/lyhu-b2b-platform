-- 1. Create the new customer offers table
CREATE TABLE IF NOT EXISTS public.wholesale_new_customer_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL DEFAULT 'Ưu đãi đặc biệt cho khách hàng mới',
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    discount_price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add RLS Policies
ALTER TABLE public.wholesale_new_customer_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active new customer offers" 
ON public.wholesale_new_customer_offers 
FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access new customer offers" 
ON public.wholesale_new_customer_offers 
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'sale_admin'))
);

-- 3. Enable realtime
alter publication supabase_realtime add table public.wholesale_new_customer_offers;

-- 4. Insert Demo Data
-- First, find a product to use for the demo. We'll pick one if it exists.
DO $$
DECLARE
    demo_product_id UUID;
    demo_product_price NUMERIC;
BEGIN
    SELECT id, price INTO demo_product_id, demo_product_price FROM public.products WHERE is_active = true LIMIT 1;
    
    IF demo_product_id IS NOT NULL THEN
        INSERT INTO public.wholesale_new_customer_offers (title, product_id, discount_price, is_active)
        VALUES (
            'Ưu đãi đặc biệt cho khách hàng mới', 
            demo_product_id, 
            demo_product_price * 0.65 -- 35% discount for demo
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
