-- Add pricing_type and price_per_sqft columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'custom';

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_per_sqft numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN products.pricing_type IS 'Pricing mode: custom (manual per-size) or per_sqft (auto-calculated)';
COMMENT ON COLUMN products.price_per_sqft IS 'Price per square foot for auto-calculation when pricing_type is per_sqft';