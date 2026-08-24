-- Create table for featured products (best sellers, new arrivals)
CREATE TABLE public.featured_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('best_seller', 'new_arrival')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, feature_type)
);

-- Create table for homepage reviews (separate from product reviews)
CREATE TABLE public.homepage_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_location TEXT,
  review_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for product videos
CREATE TABLE public.product_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('upload', 'youtube', 'external')),
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for store settings (footer info, contact, etc.)
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default store settings
INSERT INTO public.store_settings (setting_key, setting_value) VALUES
  ('brand_name', 'Al Mishk'),
  ('tagline', 'Premium Attar & Fragrances'),
  ('store_address', 'Shop No. 123, Perfume Market, Mumbai, Maharashtra 400001'),
  ('store_email', 'contact@almishk.com'),
  ('store_phone', '+91 92206 12315'),
  ('whatsapp_number', '+91 92206 12315'),
  ('instagram_url', 'https://instagram.com/almishk'),
  ('facebook_url', 'https://facebook.com/almishk'),
  ('about_text', 'Al Mishk offers premium quality attars and fragrances crafted with the finest ingredients. Our collection brings you the essence of luxury.');

-- Enable RLS
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for featured_products
CREATE POLICY "Anyone can view active featured products" ON public.featured_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage featured products" ON public.featured_products
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for homepage_reviews
CREATE POLICY "Anyone can view active reviews" ON public.homepage_reviews
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage homepage reviews" ON public.homepage_reviews
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for product_videos
CREATE POLICY "Anyone can view product videos" ON public.product_videos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage product videos" ON public.product_videos
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for store_settings
CREATE POLICY "Anyone can view store settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage store settings" ON public.store_settings
  FOR ALL USING (is_admin(auth.uid()));