-- Enhance design_templates table with new columns
ALTER TABLE public.design_templates 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sizes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS source_file_url text,
ADD COLUMN IF NOT EXISTS preview_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'raster',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for templates bucket
CREATE POLICY "Anyone can view templates" ON storage.objects
FOR SELECT USING (bucket_id = 'templates');

CREATE POLICY "Admins can upload templates" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'templates' AND is_admin());

CREATE POLICY "Admins can update templates" ON storage.objects
FOR UPDATE USING (bucket_id = 'templates' AND is_admin());

CREATE POLICY "Admins can delete templates" ON storage.objects
FOR DELETE USING (bucket_id = 'templates' AND is_admin());

-- Add admin policies for design_templates table
CREATE POLICY "Admins can insert templates" ON public.design_templates
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update templates" ON public.design_templates
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete templates" ON public.design_templates
FOR DELETE USING (is_admin());