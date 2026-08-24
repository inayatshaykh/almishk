import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, ArrowLeft, Package, Minus, Plus, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ImageGallery from '@/components/product/ImageGallery';
import ProductReviews from '@/components/product/ProductReviews';
import RelatedProducts from '@/components/product/RelatedProducts';
import WishlistButton from '@/components/shop/WishlistButton';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ id: string; image_url: string; is_primary: boolean }[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  useEffect(() => {
    // Scroll to top whenever the product id changes
    window.scrollTo({ top: 0, behavior: 'instant' });
    setProduct(null);
    setCategory(null);
    setGalleryImages([]);
    setQuantity(1);
    setIsLoading(true);

    const fetchProduct = async () => {
      if (!id) return;

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (productError || !productData) {
        toast.error('Product not found');
        navigate('/');
        return;
      }

      setProduct(productData);

      // Fetch category
      if (productData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', productData.category_id)
          .maybeSingle();
        setCategory(categoryData);
      }

      // Fetch gallery images
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('sort_order');
      setGalleryImages(imagesData || []);

      setIsLoading(false);
    };

    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }

    if (!product) return;

    setIsAddingToCart(true);

    // Get or create cart
    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error: cartError } = await supabase
        .from('carts')
        .insert({ user_id: user.id })
        .select('id')
        .single();

      if (cartError) {
        toast.error('Failed to create cart');
        setIsAddingToCart(false);
        return;
      }
      cart = newCart;
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', product.id)
      .maybeSingle();

    if (existingItem) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (error) {
        toast.error('Failed to update cart');
      } else {
        toast.success('Cart updated!');
      }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: product.id,
          quantity,
        });

      if (error) {
        toast.error('Failed to add to cart');
      } else {
        toast.success('Added to cart!');
      }
    }

    setIsAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!product) return;
    setIsBuyingNow(true);

    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
    if (!cart) {
      const { data: newCart, error } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      if (error) { toast.error('Failed to create cart'); setIsBuyingNow(false); return; }
      cart = newCart;
    }

    const { data: existingItem } = await supabase
      .from('cart_items').select('id, quantity')
      .eq('cart_id', cart.id).eq('product_id', product.id).maybeSingle();

    if (existingItem) {
      await supabase.from('cart_items').update({ quantity: existingItem.quantity + quantity }).eq('id', existingItem.id);
    } else {
      await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: product.id, quantity });
    }

    setIsBuyingNow(false);
    navigate('/checkout');
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="badge-success">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="badge-warning">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="badge-danger">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Product not found</p>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif text-gradient-gold">Al Mishk</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/cart">
              <Button variant="outline" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <ImageGallery
            images={galleryImages}
            productName={product.name}
            mainImageUrl={product.image_url}
          />

          {/* Product Info */}
          <div className="space-y-6">
            {category && (
              <Link
                to={`/?category=${category.id}`}
                className="text-sm text-primary hover:underline"
              >
                {category.name}
              </Link>
            )}

            <h1 className="text-4xl font-serif text-gradient-gold">{product.name}</h1>

            <div className="flex items-center gap-4 flex-wrap">
              {hasDiscount(product) ? (
                <>
                  <span className="text-lg line-through text-muted-foreground">₹{product.price}</span>
                  <span className="text-3xl font-serif text-primary">
                    ₹{getDiscountedPrice(product)}
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-600">{product.discount_percentage}% OFF</Badge>
                </>
              ) : (
                <span className="text-3xl font-serif text-primary">₹{product.price}</span>
              )}
              {getStockBadge(product.stock_status)}
            </div>

            {(product.concentration || product.size) && (
              <div className="flex gap-4 text-muted-foreground">
                {product.concentration && (
                  <span className="px-3 py-1 bg-muted rounded-sm text-sm">
                    {product.concentration}
                  </span>
                )}
                {product.size && (
                  <span className="px-3 py-1 bg-muted rounded-sm text-sm">
                    {product.size}
                  </span>
                )}
              </div>
            )}

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart & Wishlist */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock_status === 'out_of_stock' || isAddingToCart}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground btn-glow py-6 text-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              <WishlistButton
                productId={product.id}
                size="lg"
                variant="outline"
                className="py-6"
              />
            </div>

            {/* Buy Now */}
            <Button
              onClick={handleBuyNow}
              disabled={product.stock_status === 'out_of_stock' || isBuyingNow}
              variant="outline"
              className="w-full py-6 text-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Zap className="h-5 w-5 mr-2" />
              {isBuyingNow ? 'Processing...' : 'Buy Now'}
            </Button>

            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <p className="text-primary text-sm text-center">
                Only {product.stock_quantity} left in stock!
              </p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-16">
          <ProductReviews productId={product.id} />
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentProductId={product.id}
          categoryId={product.category_id}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Al Mishk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;
