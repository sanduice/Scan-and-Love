-- Add rating and review_count columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;