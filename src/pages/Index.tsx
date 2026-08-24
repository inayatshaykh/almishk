import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, MessageCircle, ShoppingCart, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '@/components/shop/SiteHeader';
import SiteFooter from '@/components/shop/SiteFooter';
import HeroSlideshow from '@/components/shop/HeroSlideshow';
import BestSellers from '@/components/shop/BestSellers';
import CategoriesSection from '@/components/shop/CategoriesSection';
import NewArrivals from '@/components/shop/NewArrivals';
import CombosBanner from '@/components/shop/CombosBanner';
import ReviewsCarousel from '@/components/shop/ReviewsCarousel';
import TrustBadges from '@/components/shop/TrustBadges';
import SearchFilters from '@/components/shop/SearchFilters';
import ProductSorting, { type SortOption } from '@/components/shop/ProductSorting';
import ProductPagination from '@/components/shop/ProductPagination';
import WishlistButton from '@/components/shop/WishlistButton';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

const PRODUCTS_PER_PAGE = 12;

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockStatus, setStockStatus] = useState<string | null>(null);

  // Sorting and pagination
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: cats }, { data: reviews }] = await Promise.all([
        supabase.from('products').select('*').eq('is_combo', false).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('reviews').select('product_id').eq('is_approved', true),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);

      // Count reviews per product
      const counts: Record<string, number> = {};
      (reviews || []).forEach((r) => {
        counts[r.product_id] = (counts[r.product_id] || 0) + 1;
      });
      setReviewCounts(counts);

      // Set max price based on products
      if (prods && prods.length > 0) {
        const maxProductPrice = Math.max(...prods.map((p) => Number(p.price)));
        setPriceRange([0, Math.ceil(maxProductPrice / 100) * 100]);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map((p) => Number(p.price))) / 100) * 100;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.concentration?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && product.category_id !== selectedCategory) return false;

      // Price filter
      const price = Number(product.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Stock status filter
      if (stockStatus && product.stock_status !== stockStatus) return false;

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'price_low':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_high':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'most_reviewed':
        result.sort((a, b) => (reviewCounts[b.id] || 0) - (reviewCounts[a.id] || 0));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, priceRange, stockStatus, sortBy, reviewCounts]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, stockStatus, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setPriceRange([0, maxPrice]);
    setStockStatus(null);
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

  const buyNow = async (productId: string) => {
    if (!user) { toast.error('Please sign in'); navigate('/auth'); return; }
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

  const handleWhatsAppOrder = (product: Product, quantity: number = 1) => {
    const mrp = Number(product.price) * quantity;
    const discountPct = Number(product.discount_percentage) || 0;
    const discountedPrice = discountPct > 0 ? mrp * (1 - discountPct / 100) : mrp;
    const prepaidDiscount = discountedPrice * 0.1;
    const finalPrice = discountedPrice - prepaidDiscount;
    
    const lines = [
      `🛒 *NEW PREPAID ORDER*\n`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 *Product Details:*`,
      `• Name: ${product.name}`,
      `• Size: ${product.size || 'N/A'}`,
      `• Concentration: ${product.concentration || 'N/A'}`,
      `• Quantity: ${quantity}\n`,
      `💰 *Price Breakdown:*`,
      `• MRP: ₹${mrp.toFixed(0)}`,
    ];
    if (discountPct > 0) {
      lines.push(`• Product Discount (${discountPct}%): -₹${(mrp - discountedPrice).toFixed(0)}`);
      lines.push(`• Discounted Price: ₹${discountedPrice.toFixed(0)}`);
    }
    lines.push(
      `• Prepaid Extra 10% Off: -₹${prepaidDiscount.toFixed(0)}`,
      `• *Final Amount: ₹${finalPrice.toFixed(0)}*\n`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 *Please share your delivery address:*`,
      `• Full Name:`,
      `• Phone Number:`,
      `• Address:`,
      `• City:`,
      `• Pincode:\n`,
      `I want to place this prepaid order. 💳`,
    );
    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/919220612315?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* 1. Hero Slideshow */}
      <HeroSlideshow onWhatsAppOrder={handleWhatsAppOrder} />

      {/* 2. Best Sellers */}
      <BestSellers onWhatsAppOrder={handleWhatsAppOrder} />

      {/* 3. Shop by Category */}
      <CategoriesSection selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />

      {/* 4. New Arrivals */}
      <NewArrivals onWhatsAppOrder={handleWhatsAppOrder} />

      {/* 5. All Products — filters sticky at top */}
      <section id="products" className="py-8 md:py-14 bg-background">
        <div className="container mx-auto px-4">

          {/* Section heading */}
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-1">All Products</h2>
            <p className="text-muted-foreground text-sm">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-14 md:top-20 z-30 bg-background/95 backdrop-blur-md border-b border-primary/10 py-3 mb-6 -mx-4 px-4">
            <SearchFilters
              categories={categories}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              priceRange={priceRange}
              stockStatus={stockStatus}
              maxPrice={maxPrice}
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              onPriceRangeChange={setPriceRange}
              onStockStatusChange={setStockStatus}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            <ProductSorting value={sortBy} onChange={setSortBy} />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-primary/10">
              <Package className="h-20 w-20 mx-auto text-primary/20 mb-6" />
              <p className="text-muted-foreground mb-6 text-lg">No products match your filters</p>
              <Button onClick={clearFilters} className="btn-luxury">Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className="card-luxury overflow-hidden group h-full flex flex-col">
                    <div className="relative">
                      <Link to={`/product/${product.id}`}>
                        <div className="aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <Package className="h-16 w-16 text-primary/20" />
                          )}
                        </div>
                      </Link>
                      {hasDiscount(product) && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-emerald-500 text-white text-xs px-1.5 py-0.5">{product.discount_percentage}% OFF</Badge>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <WishlistButton productId={product.id} className="bg-card/90 backdrop-blur-sm shadow-soft border border-primary/10" />
                      </div>
                    </div>
                    <CardContent className="p-3 md:p-4 flex flex-col flex-1">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-serif text-sm md:text-base hover:text-primary transition-colors line-clamp-1 mb-0.5">{product.name}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {product.concentration}{product.concentration && product.size ? ' • ' : ''}{product.size}
                      </p>
                      <div className="flex items-baseline gap-1.5 mb-3 mt-auto">
                        <span className="text-lg md:text-xl font-serif text-primary">
                          ₹{hasDiscount(product) ? getDiscountedPrice(product) : product.price}
                        </span>
                        {hasDiscount(product) && (
                          <span className="text-xs line-through text-muted-foreground">₹{product.price}</span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={(e) => { e.preventDefault(); addToCart(product.id); }} disabled={product.stock_status === 'out_of_stock'} className="flex-1 btn-luxury text-xs h-8">
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          {product.stock_status === 'out_of_stock' ? 'Sold Out' : 'Add to Cart'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); buyNow(product.id); }} disabled={product.stock_status === 'out_of_stock'} className="flex-1 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground text-xs h-8">
                          <Zap className="h-3.5 w-3.5 mr-1" />
                          Buy Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => { setCurrentPage(p); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
              />
            </>
          )}
        </div>
      </section>

      {/* 6. Combo Offers Banner */}
      <CombosBanner />

      {/* 7. Customer Reviews */}
      <ReviewsCarousel />

      {/* 8. Trust Badges */}
      <TrustBadges />

      {/* 9. Footer */}
      <SiteFooter />
    </div>
  );
};

export default Index;
