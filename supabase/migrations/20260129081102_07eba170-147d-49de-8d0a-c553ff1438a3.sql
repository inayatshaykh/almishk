-- Create slideshow table for admin-managed product showcase
CREATE TABLE public.slideshow_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  title text,
  subtitle text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slideshow_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slideshow items
CREATE POLICY "Anyone can view active slideshow items"
ON public.slideshow_items
FOR SELECT
USING (is_active = true);

-- Admins can manage slideshow items
CREATE POLICY "Admins can manage slideshow items"
ON public.slideshow_items
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_slideshow_items_updated_at
BEFORE UPDATE ON public.slideshow_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();