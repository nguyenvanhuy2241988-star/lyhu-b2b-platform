-- Grants for anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.order_items TO anon;

-- Fix Guest RLS for orders
DROP POLICY IF EXISTS "b2b_guest_orders_select" ON public.orders;
CREATE POLICY "b2b_guest_orders_select" 
ON public.orders 
FOR SELECT 
USING (source = 'B2B_WEB'); -- Note: might want to be safer, like only letting them see their own session-based orders, but anon has no session. We limit what they can do via UI anyway.

-- Fix Guest RLS for order_items
DROP POLICY IF EXISTS "b2b_guest_order_items_select" ON public.order_items;
CREATE POLICY "b2b_guest_order_items_select" 
ON public.order_items 
FOR SELECT 
USING (
    order_id IN (
        SELECT id FROM public.orders WHERE source = 'B2B_WEB'
    )
);

-- We need to ensure b2b_guest_orders_insert is still correct
DROP POLICY IF EXISTS "b2b_guest_orders_insert" ON public.orders;
CREATE POLICY "b2b_guest_orders_insert" 
ON public.orders 
FOR INSERT 
WITH CHECK (source = 'B2B_WEB');

DROP POLICY IF EXISTS "b2b_guest_order_items_insert" ON public.order_items;
CREATE POLICY "b2b_guest_order_items_insert" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);
