import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, X, ShoppingCart, Package, Beaker, Percent, Zap } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type Product = Tables<'products'>;

// A product is an attar if its concentration or name contains "attar" (case-insensitive)
const isAttar = (p: Product) =>
  p.concentration?.toLowerCase().includes('attar') ||
  p.name?.toLowerCase().includes('attar');

const DiscoverySetBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [maxSlots, setMaxSlots] = useState(5);
  const [setPrice, setSetPrice] = useState<number | null>(null);
  const [setDiscount, setSetDiscount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: settings } = await supabase
        .from('store_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['discovery_set_enabled', 'discovery_set_slots', 'discovery_set_price', 'discovery_set_discount']);

      const map: Record<string, string> = {};
      (settings || []).forEach(s => { if (s.setting_value) map[s.setting_key] = s.setting_value; });

      setIsEnabled(map['discovery_set_enabled'] !== 'false');
      setMaxSlots(parseInt(map['discovery_set_slots'] || '5'));
      setSetPrice(map['discovery_set_price'] ? parseFloat(map['discovery_set_price']) : null);
      setSetDiscount(parseFloat(map['discovery_set_discount'] || '0'));

      // Only perfumes (no attars, no combos, in stock)
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('is_combo', false)
        .neq('stock_status', 'out_of_stock')
        .order('name');

      // Filter out attars client-side
      const perfumesOnly = (prods || []).filter(p => !isAttar(p));
      setProducts(perfumesOnly);
    };
    fetchData();
  }, []);

  if (!isEnabled) return null;

  const selectProduct = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast.error('Already selected! Choose a different fragrance.');
      return;
    }
    if (selectedProducts.length >= maxSlots) {
      toast.error(`Maximum ${maxSlots} fragrances allowed`);
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    setSelectorOpen(false);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const individualTotal = selectedProducts.reduce((sum, p) => sum + getDiscountedPrice(p), 0);
  const basePrice = setPrice || individualTotal;
  const discountAmt = setDiscount > 0 ? basePrice * (setDiscount / 100) : 0;
  const finalPrice = basePrice - discountAmt;
  const isComplete = selectedProducts.length === maxSlots;

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please sign in'); return; }
    if (!isComplete) return;

    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      cart = newCart;
    }
    if (!cart) return;

    for (const product of selectedProducts) {
      const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cart.id).eq('product_id', product.id).maybeSingle();
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: product.id, quantity: 1 });
      }
    }
    toast.success('Discovery Set added to cart!');
    setSelectedProducts([]);
  };

  const handleBuyNow = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!isComplete) return;

    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      cart = newCart;
    }
    if (!cart) return;

    for (const product of selectedProducts) {
      const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cart.id).eq('product_id', product.id).maybeSingle();
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: product.id, quantity: 1 });
      }
    }
    navigate('/checkout');
  };

  const availableProducts = products.filter(p => !selectedProducts.find(s => s.id === p.id));

  // Responsive grid: 3 cols on mobile, up to maxSlots on desktop
  const gridClass = maxSlots <= 3
    ? 'grid-cols-3'
    : maxSlots === 4
    ? 'grid-cols-2 sm:grid-cols-4'
    : 'grid-cols-3 sm:grid-cols-5';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-3">
          <Beaker className="h-4 w-4" />
          <span className="text-sm font-medium">Discovery Set</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-2">
          Build Your <span className="text-gradient-gold">Discovery Set</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          Pick any {maxSlots} perfumes — attars not included in discovery sets
        </p>
      </div>

      {/* Slots Grid */}
      <div className={`grid gap-2 md:gap-3 max-w-3xl mx-auto ${gridClass}`}>
        {Array.from({ length: maxSlots }).map((_, index) => {
          const product = selectedProducts[index];
          return (
            <div key={index} className="space-y-1">
              <p className="text-xs text-muted-foreground text-center">{index + 1}</p>
              {product ? (
                <Card className="card-luxury relative overflow-hidden">
                  <button
                    onClick={() => removeProduct(index)}
                    className="absolute top-1 right-1 z-10 bg-card/90 rounded-full p-0.5 hover:bg-destructive/10 touch-manipulation"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                  <div className="aspect-square bg-secondary/30 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary/20" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-1.5 text-center">
                    <p className="font-serif text-xs line-clamp-1">{product.name}</p>
                    <p className="text-primary font-serif text-xs">₹{getDiscountedPrice(product)}</p>
                  </CardContent>
                </Card>
              ) : (
                <button
                  onClick={() => setSelectorOpen(true)}
                  className="w-full aspect-square border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 transition-all touch-manipulation"
                >
                  <Plus className="h-5 w-5 text-primary/30" />
                  <span className="text-[10px] text-muted-foreground">Add</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Price Summary */}
      {selectedProducts.length > 0 && (
        <div className="max-w-sm mx-auto bg-card border border-primary/20 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{selectedProducts.length}/{maxSlots} selected</span>
            <span>₹{individualTotal.toFixed(0)}</span>
          </div>
          {setPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Set Price</span>
              <span>₹{setPrice.toFixed(0)}</span>
            </div>
          )}
          {setDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-emerald-600">
                <Percent className="h-3.5 w-3.5" /> {setDiscount}% off
              </span>
              <span className="text-emerald-600">-₹{discountAmt.toFixed(0)}</span>
            </div>
          )}
          <div className="border-t border-primary/10 pt-2 flex justify-between font-medium">
            <span>Total</span>
            <span className="text-primary text-xl font-serif">₹{finalPrice.toFixed(0)}</span>
          </div>
          {isComplete && (
            <div className="flex gap-2 pt-1">
              <Button onClick={handleAddToCart} variant="outline" className="flex-1 border-primary/40 text-primary">
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} className="flex-1 btn-luxury">
                <Zap className="h-4 w-4 mr-1.5" />
                Buy Now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Product Selector Modal */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Select a Perfume</DialogTitle>
            <p className="text-xs text-muted-foreground">Only perfumes shown — attars are not available in discovery sets</p>
          </DialogHeader>
          {availableProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 text-primary/20" />
              <p>No more perfumes available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  className="text-left border border-primary/10 rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-soft active:bg-primary/5 transition-all group touch-manipulation"
                >
                  <div className="aspect-square bg-secondary/30 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-serif text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{product.concentration} • {product.size}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <p className="text-primary font-serif">₹{getDiscountedPrice(product)}</p>
                      {hasDiscount(product) && (
                        <span className="text-xs line-through text-muted-foreground">₹{product.price}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscoverySetBuilder;
