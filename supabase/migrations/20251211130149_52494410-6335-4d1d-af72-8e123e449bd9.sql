-- Add missing categories that are referenced in the sidebar but don't exist in DB

-- Get the parent category IDs first, then insert missing subcategories
-- For Stickers & Decals subcategories
INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Vehicle Graphics', 'vehicle-graphics', id, true, 4
FROM public.product_categories WHERE slug = 'stickers-decals'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Window Graphics', 'window-graphics', id, true, 5
FROM public.product_categories WHERE slug = 'stickers-decals'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Floor Graphics', 'floor-graphics', id, true, 6
FROM public.product_categories WHERE slug = 'stickers-decals'
ON CONFLICT (slug) DO NOTHING;

-- For Office & ID subcategories
INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Self Inking Stamps', 'self-inking-stamps', id, true, 3
FROM public.product_categories WHERE slug = 'office-id'
ON CONFLICT (slug) DO NOTHING;

-- For Events & Trade Show subcategories
INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Flags & Fabric', 'flags-fabric', id, true, 3
FROM public.product_categories WHERE slug = 'events-trade-show'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Event Passes', 'event-passes', id, true, 4
FROM public.product_categories WHERE slug = 'events-trade-show'
ON CONFLICT (slug) DO NOTHING;

-- Add Executive Metal Name Tags under Name Badges
INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
SELECT 'Executive Metal Name Tags', 'executive-metal-name-tags', id, true, 5
FROM public.product_categories WHERE slug = 'name-badges'
ON CONFLICT (slug) DO NOTHING;

-- Add Prints as a top-level category
INSERT INTO public.product_categories (name, slug, parent_id, is_active, "order")
VALUES ('Prints', 'prints', NULL, true, 6)
ON CONFLICT (slug) DO NOTHING;