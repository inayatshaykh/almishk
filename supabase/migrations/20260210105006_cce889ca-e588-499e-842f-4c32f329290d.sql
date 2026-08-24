
-- Add discount_percentage to products table for dual pricing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;

-- Add discovery set settings to store_settings
-- Admin can control: discovery_set_enabled, discovery_set_slots, discovery_set_price, discovery_set_discount
-- These will be stored as key-value pairs in store_settings table (already exists)

-- Add prepaid_discount_percentage to store_settings (admin controlled)
-- Will use existing store_settings table with keys like 'prepaid_discount_percentage', 'discovery_set_enabled', etc.
