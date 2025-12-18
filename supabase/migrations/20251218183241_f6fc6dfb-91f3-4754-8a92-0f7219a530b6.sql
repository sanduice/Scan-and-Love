-- Allow admins to view all templates (including inactive)
CREATE POLICY "Admins can view all templates"
ON public.design_templates
FOR SELECT
USING (is_admin());