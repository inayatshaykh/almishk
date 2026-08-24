import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type Product = Tables<'products'>;

interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string | null;
}

const RelatedProducts = ({ currentProductId, categoryId }: RelatedProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setIsLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .neq('id', currentProductId)
        .eq('is_combo', false)
        .limit(4);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching related products:', error);
        setIsLoading(false);
        return;
      }

      // Fill up to 4 from other categories if needed
      if (data && data.length < 4 && categoryId) {
        const { data: moreData } = await supabase
          .from('products')
          .select('*')
          .neq('id', currentProductId)
          .neq('category_id', categoryId)
          .eq('is_combo', false)
          .limit(4 - data.length);

        setProducts([...data, ...(moreData || [])]);
      } else {
        setProducts(data || []);
      }
      setIsLoading(false);
    };

    fetchRelated();
  }, [currentProductId, categoryId]);

  if (isLoading || products.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-gradient-gold">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
          >
            <Card className="card-luxury group overflow-hidden h-full hover:border-primary/30 transition-all">
              <div className="aspect-square bg-muted overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-1">
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                {hasDiscount(product) ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-primary font-serif text-lg">₹{getDiscountedPrice(product)}</span>
                    <span className="text-xs line-through text-muted-foreground">₹{product.price}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 text-xs px-1.5">{product.discount_percentage}% OFF</Badge>
                  </div>
                ) : (
                  <span className="text-primary font-serif text-lg">₹{product.price}</span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
