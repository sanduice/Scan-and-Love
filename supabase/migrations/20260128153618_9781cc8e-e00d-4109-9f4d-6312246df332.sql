-- Add missing columns to name_badge_orders table for cart/checkout functionality
ALTER TABLE name_badge_orders 
ADD COLUMN IF NOT EXISTS is_in_cart boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS names_csv_url text,
ADD COLUMN IF NOT EXISTS names_data_json text,
ADD COLUMN IF NOT EXISTS badge_type text DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS size_shape text,
ADD COLUMN IF NOT EXISTS fastener text,
ADD COLUMN IF NOT EXISTS border text,
ADD COLUMN IF NOT EXISTS dome text,
ADD COLUMN IF NOT EXISTS background text;

-- Add UPDATE policy so cart items can be updated (e.g., is_in_cart = false after checkout)
CREATE POLICY "Users can update their name badge orders"
ON name_badge_orders
FOR UPDATE
USING (
  ((auth.uid() IS NOT NULL) AND (user_id = auth.uid())) 
  OR ((auth.uid() IS NULL) AND (session_id IS NOT NULL))
);