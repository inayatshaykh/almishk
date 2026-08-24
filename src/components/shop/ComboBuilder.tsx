import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, X, ShoppingCart, Package, Flame, Percent } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface ComboBuilderProps {
  onAddToCart?: (products: Product[], discountedTotal: number) => void;
}

const ComboBuilder = ({ onAddToCart }: ComboBuilderProps) => {
  const { user } = useAuth();
  const [attars, setAttars] = useState<Product[]>([]);
  const [perfumes, setPerfumes] = useState<Product[]>([]);
  const [selectedAttar, setSelectedAttar] = useState<Product | null>(null);
  const [selectedPerfume, setSelectedPerfume] = useState<Product | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorType, setSelectorType] = useState<'attar' | 'perfume'>('attar');

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name');

      const attarCat = categories?.find(c => c.name.toLowerCase().includes('attar'));
      const perfumeCat = categories?.find(c => c.name.toLowerCase().includes('perfume'));

      if (attarCat) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', attarCat.id)
          .eq('is_combo', false)
          .neq('stock_status', 'out_of_stock')
          .order('name');
        setAttars(data || []);
      }

      if (perfumeCat) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', perfumeCat.id)
          .eq('is_combo', false)
          .neq('stock_status', 'out_of_stock')
          .order('name');
        setPerfumes(data || []);
      }
    };
    fetchProducts();
  }, []);

  const openSelector = (type: 'attar' | 'perfume') => {
    setSelectorType(type);
    setSelectorOpen(true);
  };

  const selectProduct = (product: Product) => {
    if (selectorType === 'attar') setSelectedAttar(product);
    else setSelectedPerfume(product);
    setSelectorOpen(false);
  };

  const originalTotal = (selectedAttar ? Number(selectedAttar.price) : 0) + (selectedPerfume ? Number(selectedPerfume.price) : 0);
  const discountedTotal = originalTotal * 0.9;
  const bothSelected = selectedAttar && selectedPerfume;

  const handleAddComboToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    if (!selectedAttar || !selectedPerfume) return;

    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      cart = newCart;
    }
    if (!cart) return;

    for (const product of [selectedAttar, selectedPerfume]) {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: product.id, quantity: 1 });
      }
    }
    toast.success('Combo added to cart! 10% discount applied at checkout.');
  };

  const selectorProducts = selectorType === 'attar' ? attars : perfumes;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-3">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">Build Your Own</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-2">
          Custom <span className="text-gradient-gold">Combo</span>
        </h3>
        <p className="text-muted-foreground text-sm">Select 1 Attar + 1 Perfume and get <strong>10% OFF</strong> automatically</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Attar Slot */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground text-center">Attar</p>
          {selectedAttar ? (
            <Card className="card-luxury relative overflow-hidden">
              <button onClick={() => setSelectedAttar(null)} className="absolute top-2 right-2 z-10 bg-card/90 rounded-full p-1 hover:bg-destructive/10">
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
              <div className="aspect-square bg-secondary/30 overflow-hidden">
                {selectedAttar.image_url ? (
                  <img src={selectedAttar.image_url} alt={selectedAttar.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-primary/20" /></div>
                )}
              </div>
              <CardContent className="p-3 text-center">
                <p className="font-serif text-sm line-clamp-1">{selectedAttar.name}</p>
                <p className="text-primary font-serif">₹{selectedAttar.price}</p>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => openSelector('attar')}
              className="w-full aspect-square border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              <Plus className="h-8 w-8 text-primary/40" />
              <span className="text-sm text-muted-foreground">Add Attar</span>
            </button>
          )}
        </div>

        {/* Perfume Slot */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground text-center">Perfume</p>
          {selectedPerfume ? (
            <Card className="card-luxury relative overflow-hidden">
              <button onClick={() => setSelectedPerfume(null)} className="absolute top-2 right-2 z-10 bg-card/90 rounded-full p-1 hover:bg-destructive/10">
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
              <div className="aspect-square bg-secondary/30 overflow-hidden">
                {selectedPerfume.image_url ? (
                  <img src={selectedPerfume.image_url} alt={selectedPerfume.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-primary/20" /></div>
                )}
              </div>
              <CardContent className="p-3 text-center">
                <p className="font-serif text-sm line-clamp-1">{selectedPerfume.name}</p>
                <p className="text-primary font-serif">₹{selectedPerfume.price}</p>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => openSelector('perfume')}
              className="w-full aspect-square border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              <Plus className="h-8 w-8 text-primary/40" />
              <span className="text-sm text-muted-foreground">Add Perfume</span>
            </button>
          )}
        </div>
      </div>

      {/* Price Summary */}
      {(selectedAttar || selectedPerfume) && (
        <div className="max-w-md mx-auto bg-card border border-primary/20 rounded-2xl p-5 space-y-3">
          {selectedAttar && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{selectedAttar.name}</span>
              <span>₹{selectedAttar.price}</span>
            </div>
          )}
          {selectedPerfume && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{selectedPerfume.name}</span>
              <span>₹{selectedPerfume.price}</span>
            </div>
          )}
          {bothSelected && (
            <>
              <div className="border-t border-primary/10 pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Original Total</span>
                <span className="line-through text-muted-foreground">₹{originalTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  <Percent className="h-3.5 w-3.5" /> 10% Combo Discount
                </span>
                <span className="text-emerald-600">-₹{(originalTotal * 0.1).toFixed(0)}</span>
              </div>
              <div className="border-t border-primary/10 pt-2 flex justify-between font-medium">
                <span>Final Price</span>
                <span className="text-primary text-xl font-serif">₹{discountedTotal.toFixed(0)}</span>
              </div>
            </>
          )}
          {bothSelected && (
            <Button onClick={handleAddComboToCart} className="w-full btn-luxury">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add Combo to Cart
            </Button>
          )}
        </div>
      )}

      {/* Product Selector Modal */}
      <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Select {selectorType === 'attar' ? 'an Attar' : 'a Perfume'}
            </DialogTitle>
          </DialogHeader>
          {selectorProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 text-primary/20" />
              <p>No {selectorType === 'attar' ? 'attars' : 'perfumes'} available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {selectorProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  className="text-left border border-primary/10 rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-soft transition-all group"
                >
                  <div className="aspect-square bg-secondary/30 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-primary/20" /></div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-serif text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.size}</p>
                    <p className="text-primary font-serif mt-1">₹{product.price}</p>
                    <Badge className="mt-1 text-[10px] badge-success">In Stock</Badge>
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

export default ComboBuilder;
