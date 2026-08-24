import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, ArrowRight, Percent } from 'lucide-react';
import ComboBuilder from './ComboBuilder';
import DiscoverySetBuilder from './DiscoverySetBuilder';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const CombosBanner = () => {
  const [combos, setCombos] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCombos = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_combo', true)
        .limit(3);
      
      setCombos(data || []);
      setIsLoading(false);
    };
    fetchCombos();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full mb-6 shadow-gold">
              <Gift className="h-5 w-5" />
              <span className="font-medium">Special Offers</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
              Exclusive <span className="text-gradient-gold">Combo Deals</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Save more with our curated fragrance collections. Perfect for gifting or expanding your collection.
            </p>
          </div>

          {/* Pre-made Combos */}
          {combos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {combos.map((combo) => (
                <Link 
                  key={combo.id} 
                  to={`/product/${combo.id}`}
                  className="group"
                >
                  <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 hover:border-primary/50 hover:shadow-hover transition-all duration-300 hover-lift">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-secondary/30">
                      {combo.image_url ? (
                        <img
                          src={combo.image_url}
                          alt={combo.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="h-12 w-12 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <Badge className="badge-gold mb-2">
                      <Percent className="h-3 w-3 mr-1" />
                      Combo Deal
                    </Badge>
                    <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {combo.name}
                    </h3>
                    {Number(combo.discount_percentage) > 0 ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm line-through text-muted-foreground">₹{combo.price}</span>
                        <span className="text-2xl font-serif text-primary">
                          ₹{(Number(combo.price) * (1 - Number(combo.discount_percentage) / 100)).toFixed(0)}
                        </span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">{combo.discount_percentage}% OFF</Badge>
                      </div>
                    ) : (
                      <p className="text-2xl font-serif text-primary mt-2">₹{combo.price}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Custom Combo Builder — Coming Soon */}
          <div className="mb-12 bg-card/50 border border-primary/10 rounded-3xl p-6 md:p-10 relative overflow-hidden">
            {/* Coming Soon overlay */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-3xl z-10 flex flex-col items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full shadow-gold">
                <Gift className="h-4 w-4" />
                <span className="font-semibold tracking-wide text-sm">Coming Soon</span>
              </div>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                Build your own custom combo — launching very soon!
              </p>
            </div>
            <ComboBuilder />
          </div>

          {/* Discovery Set Builder */}
          <div className="bg-card/50 border border-primary/10 rounded-3xl p-6 md:p-10">
            <DiscoverySetBuilder />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CombosBanner;
