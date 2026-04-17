-- Create promotions schema
CREATE TABLE IF NOT EXISTS public.wholesale_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Types of condition:
-- 'min_cart_qty': require total items in cart to be >= required_value
-- 'min_unique_items': require X different product types
-- 'specific_item_qty': require a specific product (or products in array) to have qty >= required_value
DO $$ BEGIN
    CREATE TYPE promotion_condition_type AS ENUM ('min_cart_qty', 'min_unique_items', 'specific_item_qty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.wholesale_promotion_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID REFERENCES public.wholesale_promotions(id) ON DELETE CASCADE,
    condition_type promotion_condition_type NOT NULL,
    target_product_ids UUID[] DEFAULT '{}', -- Array of product IDs if specific_item_qty. Empty means any.
    required_value INTEGER NOT NULL, -- Quantity or count
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action types:
-- 'discount_percent': percentage discount (e.g. 15)
-- 'override_price': specific price for the items matched or whole cart
-- 'free_items': buy X get Y free (reward_value is Y, reward_product_id is the item)
DO $$ BEGIN
    CREATE TYPE promotion_action_type AS ENUM ('discount_percent', 'override_price', 'free_items');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.wholesale_promotion_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID REFERENCES public.wholesale_promotions(id) ON DELETE CASCADE,
    action_type promotion_action_type NOT NULL,
    reward_value NUMERIC NOT NULL, -- The percentage, price override, or qty of free items
    reward_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- for free_items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.wholesale_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_promotion_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_promotion_actions ENABLE ROW LEVEL SECURITY;

-- Read policies for everyone
CREATE POLICY "Everyone can view active promotions" ON public.wholesale_promotions FOR SELECT USING (true);
CREATE POLICY "Everyone can view conditions" ON public.wholesale_promotion_conditions FOR SELECT USING (true);
CREATE POLICY "Everyone can view actions" ON public.wholesale_promotion_actions FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admin full access wholesale_promotions" ON public.wholesale_promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'sale_admin'))
);
CREATE POLICY "Admin full access wholesale_promotion_conditions" ON public.wholesale_promotion_conditions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'sale_admin'))
);
CREATE POLICY "Admin full access wholesale_promotion_actions" ON public.wholesale_promotion_actions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'sale_admin'))
);

-- Realtime
alter publication supabase_realtime add table public.wholesale_promotions;
alter publication supabase_realtime add table public.wholesale_promotion_conditions;
alter publication supabase_realtime add table public.wholesale_promotion_actions;
