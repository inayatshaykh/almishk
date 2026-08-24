import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MessageCircle, Package, Eye } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type Product = Tables<'products'>;

interface SlideshowItem {
  id: string;
  product_id: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  product?: Product;
}

interface HeroSlideshowProps {
  onWhatsAppOrder?: (product: Product, quantity?: number) => void;
}

const HeroSlideshow = ({ onWhatsAppOrder }: HeroSlideshowProps) => {
  const [items, setItems] = useState<SlideshowItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlideshow = async () => {
      const { data: slideshowData } = await supabase
        .from('slideshow_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (slideshowData && slideshowData.length > 0) {
        const productIds = slideshowData.map((s) => s.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        const itemsWithProducts = slideshowData.map((item) => ({
          ...item,
          product: products?.find((p) => p.id === item.product_id),
        }));

        setItems(itemsWithProducts);
      }
      setIsLoading(false);
    };

    fetchSlideshow();
  }, []);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (isLoading) {
    return (
      <section className="hero-luxury py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="h-72 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  // Fallback hero if no slideshow items
  if (items.length === 0) {
    return (
      <section className="hero-luxury py-16 md:py-24 text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <Badge className="badge-gold mb-6 text-sm px-4 py-2">
            10% Off on Prepaid Orders
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif mb-6 text-foreground leading-tight">
            Discover Your <span className="text-gradient-gold">Signature Scent</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the art of luxury fragrance with our handcrafted collection of premium attars and perfumes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/#products">
              <Button className="btn-luxury">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentItem = items[currentIndex];
  const product = currentItem?.product;

  return (
    <section className="hero-luxury py-12 md:py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <div className="relative">
          {/* Slides */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* Product Image */}
            <div className="w-full md:w-2/5 flex-shrink-0">
              <Link to={product ? `/product/${product.id}` : '#'}>
                <div className="aspect-square rounded-3xl overflow-hidden bg-card border border-primary/20 shadow-hover hover-lift group">
                  {product?.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                      <Package className="h-20 w-20 text-primary/30" />
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Product Info */}
            <div className="flex-1 text-center md:text-left">
              <Badge className="badge-gold mb-4 text-sm px-4 py-1.5">
                10% Off on Prepaid
              </Badge>
              <h2 className="text-3xl md:text-5xl font-serif mb-4 text-foreground leading-tight">
                {currentItem.title || product?.name || 'Featured Product'}
              </h2>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed line-clamp-3">
                {currentItem.subtitle || product?.description}
              </p>
              {product && (
                <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                  {hasDiscount(product) ? (
                    <>
                      <span className="text-4xl font-serif text-primary">₹{getDiscountedPrice(product)}</span>
                      <span className="text-xl text-muted-foreground line-through">₹{product.price}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 text-sm">{product.discount_percentage}% OFF</Badge>
                    </>
                  ) : (
                    <span className="text-4xl font-serif text-primary">₹{product.price}</span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Link to={product ? `/product/${product.id}` : '#'}>
                  <Button className="btn-outline-luxury flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </Link>
                {product && onWhatsAppOrder && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 shadow-lg hover:shadow-xl transition-all"
                    onClick={() => onWhatsAppOrder(product, 1)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Order via WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 bg-card border border-primary/20 rounded-full p-3 shadow-soft hover:shadow-hover hover:border-primary/40 transition-all"
              >
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 bg-card border border-primary/20 rounded-full p-3 shadow-soft hover:shadow-hover hover:border-primary/40 transition-all"
              >
                <ChevronRight className="h-6 w-6 text-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-3 mt-10">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-primary w-8' : 'bg-primary/30 w-2.5 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlideshow;
