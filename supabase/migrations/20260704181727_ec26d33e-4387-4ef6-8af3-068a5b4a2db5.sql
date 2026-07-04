
CREATE OR REPLACE FUNCTION public.current_session_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('request.session_id', true), '')
$$;

GRANT EXECUTE ON FUNCTION public.current_session_id() TO anon, authenticated;

-- cart_items
DROP POLICY IF EXISTS "Users can view their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their cart items" ON public.cart_items;

CREATE POLICY "cart_items_select" ON public.cart_items FOR SELECT
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "cart_items_insert" ON public.cart_items FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "cart_items_update" ON public.cart_items FOR UPDATE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "cart_items_delete" ON public.cart_items FOR DELETE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));

-- orders
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));

-- sticker_orders
DROP POLICY IF EXISTS "Users can view their sticker orders" ON public.sticker_orders;
DROP POLICY IF EXISTS "Users can create sticker orders" ON public.sticker_orders;
CREATE POLICY "sticker_orders_select" ON public.sticker_orders FOR SELECT
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "sticker_orders_insert" ON public.sticker_orders FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));

-- name_badge_orders
DROP POLICY IF EXISTS "Users can view their name badge orders" ON public.name_badge_orders;
DROP POLICY IF EXISTS "Users can create name badge orders" ON public.name_badge_orders;
DROP POLICY IF EXISTS "Users can update their name badge orders" ON public.name_badge_orders;
CREATE POLICY "name_badge_orders_select" ON public.name_badge_orders FOR SELECT
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "name_badge_orders_insert" ON public.name_badge_orders FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "name_badge_orders_update" ON public.name_badge_orders FOR UPDATE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));

-- saved_designs
DROP POLICY IF EXISTS "Users can view their saved designs" ON public.saved_designs;
DROP POLICY IF EXISTS "Users can create saved designs" ON public.saved_designs;
DROP POLICY IF EXISTS "Users can update their saved designs" ON public.saved_designs;
DROP POLICY IF EXISTS "Users can delete their saved designs" ON public.saved_designs;
CREATE POLICY "saved_designs_select" ON public.saved_designs FOR SELECT
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "saved_designs_insert" ON public.saved_designs FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "saved_designs_update" ON public.saved_designs FOR UPDATE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "saved_designs_delete" ON public.saved_designs FOR DELETE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));

-- name_badge_designs
DROP POLICY IF EXISTS "Users can view their name badge designs" ON public.name_badge_designs;
DROP POLICY IF EXISTS "Users can create name badge designs" ON public.name_badge_designs;
DROP POLICY IF EXISTS "Users can update their name badge designs" ON public.name_badge_designs;
DROP POLICY IF EXISTS "Users can delete their name badge designs" ON public.name_badge_designs;
CREATE POLICY "name_badge_designs_select" ON public.name_badge_designs FOR SELECT
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "name_badge_designs_insert" ON public.name_badge_designs FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "name_badge_designs_update" ON public.name_badge_designs FOR UPDATE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));
CREATE POLICY "name_badge_designs_delete" ON public.name_badge_designs FOR DELETE
USING ((auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND session_id = public.current_session_id()));

-- Coupons: remove public listing, add validate-by-code RPC
DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;
REVOKE SELECT ON public.coupons FROM anon;

CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code text)
RETURNS TABLE (
  id uuid,
  code text,
  type text,
  value numeric,
  min_order numeric,
  max_discount numeric,
  valid_until timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.code, c.type, c.value, c.min_order, c.max_discount, c.valid_until
  FROM public.coupons c
  WHERE c.is_active = true
    AND upper(c.code) = upper(coupon_code)
    AND (c.valid_from IS NULL OR c.valid_from <= now())
    AND (c.valid_until IS NULL OR c.valid_until > now())
    AND (c.usage_limit IS NULL OR COALESCE(c.usage_count, 0) < c.usage_limit)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

-- analytics_events: tighten always-true INSERT policy
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "analytics_events_insert" ON public.analytics_events FOR INSERT
WITH CHECK (event_type IS NOT NULL AND length(event_type) BETWEEN 1 AND 100);
