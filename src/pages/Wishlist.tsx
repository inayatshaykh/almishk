import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Package, ShoppingCart, Trash2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type WishlistItem = { id: string; product_id: string; products: Product };

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('wishlists')
      .select('id, product_id, products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
    } else {
      setWishlistItems((data || []) as WishlistItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const removeFromWishlist = async (wishlistId: string) => {
    const { error } = await supabase.from('wishlists').delete().eq('id', wishlistId);
    if (error) {
      toast.error('Failed to remove from wishlist');
    } else {
      toast.success('Removed from wishlist');
      setWishlistItems((prev) => prev.filter((item) => item.id !== wishlistId));
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
      toast.success('Added to cart');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
            <h1 className="text-headline text-3xl text-gradient-gold">My Wishlist</h1>
          </div>
          <p className="text-muted-foreground mb-8">Products you've saved for later</p>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Loading wishlist...</p>
          ) : wishlistItems.length === 0 ? (
            <Card className="card-luxury">
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Browse Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => {
                const product = item.products;
                return (
                  <Card key={item.id} className="card-luxury overflow-hidden group">
                    <Link to={`/product/${product.id}`}>
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Package className="h-16 w-16 text-muted-foreground/30" />
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-serif text-lg hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <Badge
                          className={
                            product.stock_status === 'in_stock'
                              ? 'badge-success'
                              : product.stock_status === 'low_stock'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }
                        >
                          {product.stock_status === 'in_stock'
                            ? 'In Stock'
                            : product.stock_status === 'low_stock'
                            ? 'Low Stock'
                            : 'Out of Stock'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.concentration} • {product.size}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-serif text-primary">₹{product.price}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock_status === 'out_of_stock'}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wishlist;
