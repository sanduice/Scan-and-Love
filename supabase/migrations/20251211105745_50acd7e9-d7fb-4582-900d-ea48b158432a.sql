-- Add RLS policies for admin category management

CREATE POLICY "Admins can insert categories"
ON public.product_categories
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
ON public.product_categories
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete categories"
ON public.product_categories
FOR DELETE
USING (is_admin());