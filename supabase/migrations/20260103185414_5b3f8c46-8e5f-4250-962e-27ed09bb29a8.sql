-- Create product_imports table to track import history
CREATE TABLE public.product_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  source_name TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  scraped_data JSONB DEFAULT '{}'::jsonb,
  import_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_imports ENABLE ROW LEVEL SECURITY;

-- Only admins can access product imports
CREATE POLICY "Admins can view product imports"
  ON public.product_imports FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert product imports"
  ON public.product_imports FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update product imports"
  ON public.product_imports FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete product imports"
  ON public.product_imports FOR DELETE
  USING (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_product_imports_updated_at
  BEFORE UPDATE ON public.product_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();