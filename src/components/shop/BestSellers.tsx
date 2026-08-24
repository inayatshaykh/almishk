import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Package, MessageCircle, Award, ShoppingCart, Zap } from 'lucide-react';
import WishlistButton from '@/components/shop/WishlistButton';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

type Product = Tables<'products'>;

interface BestSellersProps {
  onWhatsAppOrder?: (product: Product, quantity: number) => void;
}

const BestSellers = ({ onWhatsAppOrder }: BestSellersProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      const { data: featured } = await supabase
        .from('featured_products')
        .select('product_id, sort_order')
        .eq('feature_type', 'best_seller')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (featured && featured.length > 0) {
        const productIds = featured.map((f) => f.product_id);
        const { data: prods } = await supabase.from('products').select('*').in('id', productIds);
        const sortedProducts = productIds
          .map((id) => prods?.find((p) => p.id === id))
          .filter(Boolean) as Product[];
        setProducts(sortedProducts);
      }
      setIsLoading(false);
    };
    fetchBestSellers();
  }, []);

  const buyNow = async (productId: string) => {
    if (!user) { navigate('/auth'); return; }
    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      cart = newCart;
    }
    if (cart) {
      const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cart.id).eq('product_id', productId).maybeSingle();
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: productId, quantity: 1 });
      }
      navigate('/checkout');
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      cart = newCart;
    }
    if (cart) {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', productId)
        .maybeSingle();
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: productId, quantity: 1 });
      }
      // Get total cart count
      const { data: allItems } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cart.id);
      const totalCount = (allItems || []).reduce((sum, i) => sum + i.quantity, 0);
      toast.success(`Added to cart — ${totalCount} item${totalCount !== 1 ? 's' : ''} in your cart`);
    }
  };

  if (isLoading || products.length === 0) return null;

  return (
    <section className="py-8 md:py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-6 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium">Most Loved</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-serif text-foreground mb-2">Best Sellers</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Our most loved fragrances, cherished by customers across India
          </p>
        </div>

        <Carousel
          opts={{ align: 'start', loop: true }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {products.map((product) => (
              <CarouselItem key={product.id} className="pl-3 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card className="card-luxury overflow-hidden group h-full">
                  <div className="relative">
                    <Link to={`/product/${product.id}`}>
                      <div className="aspect-[4/3] bg-secondary/30 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <Package className="h-16 w-16 text-primary/20" />
                        )}
                      </div>
                    </Link>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-gold">Best Seller</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <WishlistButton productId={product.id} className="bg-card/90 backdrop-blur-sm shadow-soft border border-primary/10" />
                    </div>
                  </div>
                  <CardContent className="p-2.5 md:p-4">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-serif text-base md:text-lg hover:text-primary transition-colors mb-0.5 line-clamp-1">{product.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{product.concentration} • {product.size}</p>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {hasDiscount(product) ? (
                        <>
                          <span className="text-xs line-through text-muted-foreground">₹{product.price}</span>
                          <span className="text-xl font-serif text-primary">
                            ₹{getDiscountedPrice(product)}
                          </span>
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">{product.discount_percentage}% OFF</Badge>
                        </>
                      ) : (
                        <span className="text-xl font-serif text-primary">₹{product.price}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addToCart(product.id)} disabled={product.stock_status === 'out_of_stock'} className="flex-1 btn-luxury text-xs h-8">
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                        {product.stock_status === 'out_of_stock' ? 'Sold Out' : 'Add to Cart'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => buyNow(product.id)} disabled={product.stock_status === 'out_of_stock'} className="flex-1 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground text-xs h-8">
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        Buy Now
                      </Button>
                    </div>
                    {onWhatsAppOrder && (
                      <Button size="sm" variant="outline" className="w-full mt-1.5 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 text-xs py-1.5" onClick={() => onWhatsAppOrder(product, 1)}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                        10% Off on Prepaid
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 border-primary/30 hover:bg-primary/10 hover:border-primary" />
          <CarouselNext className="hidden md:flex -right-12 border-primary/30 hover:bg-primary/10 hover:border-primary" />
        </Carousel>

        {/* Scroll hint for mobile */}
        <div className="flex justify-center mt-6 md:hidden">
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <span>Swipe to see more</span>
            <span className="animate-pulse">→</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
