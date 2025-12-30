-- Add is_double_sided column to products table
ALTER TABLE public.products 
ADD COLUMN is_double_sided boolean DEFAULT false;