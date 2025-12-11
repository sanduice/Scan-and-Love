-- Add RLS policies for admin product management
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
USING (is_admin());