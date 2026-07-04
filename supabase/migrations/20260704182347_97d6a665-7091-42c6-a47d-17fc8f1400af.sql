
-- Strengthen current_session_id: require non-empty, reasonable length token
CREATE OR REPLACE FUNCTION public.current_session_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN length(COALESCE(NULLIF(current_setting('request.session_id', true), ''), '')) >= 16
    THEN NULLIF(current_setting('request.session_id', true), '')
    ELSE NULL
  END
$$;

-- Helper predicate for owner match (auth user OR verified session)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid, _session_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    (auth.uid() IS NOT NULL AND _user_id = auth.uid())
    OR
    (auth.uid() IS NULL
     AND _session_id IS NOT NULL
     AND public.current_session_id() IS NOT NULL
     AND _session_id = public.current_session_id())
$$;

-- cart_items
DROP POLICY IF EXISTS cart_items_select ON public.cart_items;
DROP POLICY IF EXISTS cart_items_insert ON public.cart_items;
DROP POLICY IF EXISTS cart_items_update ON public.cart_items;
DROP POLICY IF EXISTS cart_items_delete ON public.cart_items;
CREATE POLICY cart_items_select ON public.cart_items FOR SELECT USING (public.is_owner(user_id, session_id));
CREATE POLICY cart_items_insert ON public.cart_items FOR INSERT WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY cart_items_update ON public.cart_items FOR UPDATE USING (public.is_owner(user_id, session_id)) WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY cart_items_delete ON public.cart_items FOR DELETE USING (public.is_owner(user_id, session_id));

-- name_badge_designs
DROP POLICY IF EXISTS name_badge_designs_select ON public.name_badge_designs;
DROP POLICY IF EXISTS name_badge_designs_insert ON public.name_badge_designs;
DROP POLICY IF EXISTS name_badge_designs_update ON public.name_badge_designs;
DROP POLICY IF EXISTS name_badge_designs_delete ON public.name_badge_designs;
CREATE POLICY name_badge_designs_select ON public.name_badge_designs FOR SELECT USING (public.is_owner(user_id, session_id));
CREATE POLICY name_badge_designs_insert ON public.name_badge_designs FOR INSERT WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY name_badge_designs_update ON public.name_badge_designs FOR UPDATE USING (public.is_owner(user_id, session_id)) WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY name_badge_designs_delete ON public.name_badge_designs FOR DELETE USING (public.is_owner(user_id, session_id));

-- name_badge_orders
DROP POLICY IF EXISTS name_badge_orders_select ON public.name_badge_orders;
DROP POLICY IF EXISTS name_badge_orders_insert ON public.name_badge_orders;
DROP POLICY IF EXISTS name_badge_orders_update ON public.name_badge_orders;
CREATE POLICY name_badge_orders_select ON public.name_badge_orders FOR SELECT USING (public.is_owner(user_id, session_id));
CREATE POLICY name_badge_orders_insert ON public.name_badge_orders FOR INSERT WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY name_badge_orders_update ON public.name_badge_orders FOR UPDATE USING (public.is_owner(user_id, session_id)) WITH CHECK (public.is_owner(user_id, session_id));

-- orders
DROP POLICY IF EXISTS orders_select ON public.orders;
DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_select ON public.orders FOR SELECT USING (public.is_owner(user_id, session_id));
CREATE POLICY orders_insert ON public.orders FOR INSERT WITH CHECK (public.is_owner(user_id, session_id));

-- saved_designs
DROP POLICY IF EXISTS saved_designs_select ON public.saved_designs;
DROP POLICY IF EXISTS saved_designs_insert ON public.saved_designs;
DROP POLICY IF EXISTS saved_designs_update ON public.saved_designs;
DROP POLICY IF EXISTS saved_designs_delete ON public.saved_designs;
CREATE POLICY saved_designs_select ON public.saved_designs FOR SELECT USING (public.is_owner(user_id, session_id));
CREATE POLICY saved_designs_insert ON public.saved_designs FOR INSERT WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY saved_designs_update ON public.saved_designs FOR UPDATE USING (public.is_owner(user_id, session_id)) WITH CHECK (public.is_owner(user_id, session_id));
CREATE POLICY saved_designs_delete ON public.saved_designs FOR DELETE USING (public.is_owner(user_id, session_id));

-- sticker_orders
DROP POLICY IF EXISTS sticker_orders_select ON public.sticker_orders;
DROP POLICY IF EXISTS sticker_orders_insert ON public.sticker_orders;
CREATE POLICY sticker_orders_select ON public.sticker_orders FOR SELECT USING (public.is_owner(user_id, session_id));
CREATE POLICY sticker_orders_insert ON public.sticker_orders FOR INSERT WITH CHECK (public.is_owner(user_id, session_id));

-- analytics_events: prevent user_id spoofing
DROP POLICY IF EXISTS analytics_events_insert ON public.analytics_events;
CREATE POLICY analytics_events_insert ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    event_type IS NOT NULL
    AND length(event_type) BETWEEN 1 AND 100
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Storage: prevent listing of public buckets while keeping public URL fetches functional via CDN
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view templates" ON storage.objects;
CREATE POLICY "Authenticated can list product images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'products');
CREATE POLICY "Authenticated can list templates" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'templates');
