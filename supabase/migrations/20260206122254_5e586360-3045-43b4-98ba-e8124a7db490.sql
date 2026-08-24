
-- Add GST fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS hsn_code TEXT,
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 18;

-- Add GST fields to order_items table
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS hsn_code TEXT,
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC,
ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount NUMERIC DEFAULT 0;

-- Add payment and GST fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS cgst_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_charges NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS is_intrastate BOOLEAN DEFAULT true;

-- Add customer details to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_city TEXT,
ADD COLUMN IF NOT EXISTS billing_state TEXT,
ADD COLUMN IF NOT EXISTS billing_pincode TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_state TEXT,
ADD COLUMN IF NOT EXISTS shipping_pincode TEXT;

-- Create seller_settings table for invoice generation
CREATE TABLE IF NOT EXISTS public.seller_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  gstin TEXT NOT NULL,
  pan TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on seller_settings
ALTER TABLE public.seller_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage seller settings
CREATE POLICY "Admins can manage seller settings" ON public.seller_settings
FOR ALL USING (is_admin(auth.uid()));

-- Anyone can view seller settings (for invoices)
CREATE POLICY "Anyone can view seller settings" ON public.seller_settings
FOR SELECT USING (true);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON public.invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = invoices.order_id 
    AND (orders.user_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Admins can manage invoices
CREATE POLICY "Admins can manage invoices" ON public.invoices
FOR ALL USING (is_admin(auth.uid()));

-- Create function to generate invoice number (fiscal year format)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_fiscal_year TEXT;
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Determine fiscal year (April to March)
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
    current_fiscal_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT;
  ELSE
    current_fiscal_year := (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  END IF;
  
  -- Get next invoice number for this fiscal year
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(invoice_number, '/', 3) AS INTEGER)
  ), 0) + 1 INTO next_number
  FROM invoices
  WHERE invoice_number LIKE 'INV/' || current_fiscal_year || '/%';
  
  -- Format: INV/2024-2025/000001
  invoice_num := 'INV/' || current_fiscal_year || '/' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$$;

-- Create trigger for updated_at on seller_settings
CREATE TRIGGER update_seller_settings_updated_at
BEFORE UPDATE ON public.seller_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
