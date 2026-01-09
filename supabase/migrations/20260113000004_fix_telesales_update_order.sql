-- 1. Allow Telesales to UPDATE their own pending orders
DROP POLICY IF EXISTS "Telesales can update their own pending orders" ON "public"."orders";
CREATE POLICY "Telesales can update their own pending orders"
ON "public"."orders"
FOR UPDATE
TO authenticated
USING (
  (telesales_user_id = auth.uid()) AND (status = 'pending')
)
WITH CHECK (
  (telesales_user_id = auth.uid()) AND (status = 'pending')
);

-- 2. Allow Telesales to DELETE items from their pending orders (required for update logic)
DROP POLICY IF EXISTS "Telesales can delete items from their own pending orders" ON "public"."order_items";
CREATE POLICY "Telesales can delete items from their own pending orders"
ON "public"."order_items"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.telesales_user_id = auth.uid()
    AND orders.status = 'pending'
  )
);
