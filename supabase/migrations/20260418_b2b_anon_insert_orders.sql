-- Allow anonymous / guest B2B users to submit orders via the storefront directly from the frontend
-- This bypasses the need for Service Role keys on Vercel deployment.

-- Drop if exists to ensure idempotency
DROP POLICY IF EXISTS "b2b_guest_orders_insert" ON public.orders;
DROP POLICY IF EXISTS "b2b_guest_order_items_insert" ON public.order_items;

CREATE POLICY "b2b_guest_orders_insert" 
ON public.orders 
FOR INSERT 
WITH CHECK (source = 'B2B_WEB');

CREATE POLICY "b2b_guest_order_items_insert" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);
