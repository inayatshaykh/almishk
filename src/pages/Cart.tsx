import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type CartItem = Tables<'cart_items'> & { products: Tables<'products'> };

const Cart = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) return;
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (cart) {
      const { data } = await supabase.from('cart_items').select('*, products(*)').eq('cart_id', cart.id);
      setItems((data as CartItem[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchCart(); }, [user]);

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    } else {
      await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
    }
    fetchCart();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    toast.success('Item removed');
    fetchCart();
  };

  const total = items.reduce((sum, item) => sum + getDiscountedPrice(item.products) * item.quantity, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="card-luxury p-8 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Please sign in to view your cart</p>
          <Link to="/auth"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>

        <h1 className="text-headline text-3xl text-gradient-gold mb-8">Your Cart</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <Card className="card-luxury p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="card-luxury p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded bg-muted flex items-center justify-center">
                      {item.products.image_url ? (
                        <img src={item.products.image_url} alt={item.products.name} className="h-full w-full object-cover rounded" />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.products.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.products.size}</p>
                      {hasDiscount(item.products) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs line-through text-muted-foreground">₹{item.products.price}</span>
                          <span className="text-primary font-medium">₹{getDiscountedPrice(item.products)}</span>
                        </div>
                      ) : (
                        <p className="text-primary font-medium">₹{item.products.price}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="card-luxury p-6 h-fit">
              <h3 className="font-serif text-xl mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{total.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>Free</span></div>
              </div>
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-lg font-medium"><span>Total</span><span className="text-primary">₹{total.toFixed(2)}</span></div>
              </div>
              <Link to="/checkout">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-glow">
                  Proceed to Checkout
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
