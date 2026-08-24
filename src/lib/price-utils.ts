import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

/**
 * Single source of truth for calculating the final selling price of a product.
 * Uses the admin-defined discount_percentage from the database.
 */
export const getDiscountedPrice = (product: Product): number => {
  const mrp = Number(product.price);
  const discountPct = Number(product.discount_percentage) || 0;
  if (discountPct > 0) {
    return Math.round(mrp * (1 - discountPct / 100));
  }
  return mrp;
};

/**
 * Returns true if the product has an active discount.
 */
export const hasDiscount = (product: Product): boolean => {
  return (Number(product.discount_percentage) || 0) > 0;
};
