-- Add new columns for enhanced product configuration
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_unit TEXT DEFAULT 'inches';
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_custom_size BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS preset_sizes JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_options JSONB DEFAULT '[]';