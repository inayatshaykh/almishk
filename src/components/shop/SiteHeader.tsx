import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Search, User, Heart, ShoppingCart, LogOut, Menu,
  Home, ShoppingBag, Droplets, FlaskConical, Zap,
  Phone, ClipboardList, Shield, X, Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';

type Product = Tables<'products'>;

interface SiteHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const SiteHeader = ({ searchQuery = '', onSearchChange }: SiteHeaderProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [localQuery, setLocalQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch cart count whenever user changes
  useEffect(() => {
    if (!user) { setCartCount(0); return; }
    const fetchCartCount = async () => {
      const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
      if (!cart) { setCartCount(0); return; }
      const { data: items } = await supabase.from('cart_items').select('quantity').eq('cart_id', cart.id);
      setCartCount((items || []).reduce((sum, i) => sum + i.quantity, 0));
    };
    fetchCartCount();
    // Subscribe to cart_items changes
    const channel = supabase
      .channel('cart-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, fetchCartCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setIsSearching(false); return; }
    setIsSearching(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, price, discount_percentage, image_url, stock_status')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .eq('is_combo', false)
      .limit(5);
    setSuggestions((data as Product[]) || []);
    setIsSearching(false);
    setShowSuggestions(true);
  };

  const handleSearchInput = (value: string) => {
    setLocalQuery(value);
    onSearchChange?.(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    setShowSuggestions(false);
    setLocalQuery('');
    onSearchChange?.('');
    navigate(`/product/${product.id}`);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    scrollToSection('products');
  };

  // Works on both mobile and desktop — navigates home first if needed
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path.includes('#')) {
      const id = path.split('#')[1];
      scrollToSection(id);
    } else {
      navigate(path);
    }
  };

  const handleIconClick = (path: string) => {
    if (!user) navigate('/auth');
    else navigate(path);
  };

  const navLinks = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Shop All', icon: ShoppingBag, path: '/#products' },
    { label: 'All Perfumes', icon: FlaskConical, path: '/#products' },
    { label: 'Attars', icon: Droplets, path: '/#products' },
    { label: 'New Arrivals', icon: Zap, path: '/#products' },
    { label: 'Contact Us', icon: Phone, path: '/#footer' },
  ];

  const accountLinks = [
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'My Orders', icon: ClipboardList, path: '/orders' },
    { label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { label: 'Cart', icon: ShoppingCart, path: '/cart' },
  ];

  const SearchDropdown = ({ query }: { query: string }) => (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/20 rounded-2xl shadow-hover overflow-hidden z-50">
      {isSearching ? (
        <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
      ) : suggestions.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No results for "<span className="text-foreground">{query}</span>"
        </div>
      ) : (
        <>
          {suggestions.map((product) => (
            <button
              key={product.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left border-b border-border/50 last:border-0"
              onMouseDown={() => handleSuggestionClick(product)}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-primary font-serif">
                  ₹{hasDiscount(product) ? getDiscountedPrice(product) : product.price}
                  {hasDiscount(product) && (
                    <span className="ml-1 line-through text-muted-foreground text-xs">₹{product.price}</span>
                  )}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                product.stock_status === 'in_stock' ? 'bg-emerald-100 text-emerald-700' :
                product.stock_status === 'low_stock' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {product.stock_status === 'in_stock' ? 'In Stock' :
                 product.stock_status === 'low_stock' ? 'Low' : 'Out'}
              </span>
            </button>
          ))}
          <button
            className="w-full px-4 py-3 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            onMouseDown={handleSearchSubmit}
          >
            <Search className="h-3.5 w-3.5" />
            See all results for "{query}"
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/95 backdrop-blur-md shadow-soft">
        <div className="container mx-auto px-4">
          <div className="h-14 md:h-20 flex items-center justify-between gap-2 md:gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <img
                src="/logo.jpg"
                alt="Al Mishk"
                className="h-10 md:h-14 w-auto object-contain mix-blend-multiply"
              />
            </Link>

            {/* Desktop Search */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search attars, perfumes..."
                    value={localQuery || searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="pl-11 pr-10 py-6 bg-secondary/50 border-primary/20 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {(localQuery || searchQuery) && (
                    <button type="button" onClick={() => { setLocalQuery(''); onSearchChange?.(''); setSuggestions([]); setShowSuggestions(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
              {showSuggestions && (localQuery || searchQuery).trim().length >= 2 && (
                <SearchDropdown query={localQuery || searchQuery} />
              )}
            </div>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center gap-1">
              {isAdmin && user && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10 hover:border-primary text-foreground">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" title="Profile" onClick={() => handleIconClick('/profile')} className="hover:bg-primary/10 hover:text-primary transition-colors">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="My Orders" onClick={() => handleIconClick('/orders')} className="hover:bg-primary/10 hover:text-primary transition-colors">
                <ClipboardList className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Wishlist" onClick={() => handleIconClick('/wishlist')} className="hover:bg-primary/10 hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Cart" onClick={() => handleIconClick('/cart')} className="hover:bg-primary/10 hover:text-primary transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
              {user ? (
                <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign Out" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="h-5 w-5" />
                </Button>
              ) : (
                <Link to="/auth">
                  <Button className="btn-luxury text-sm px-4 py-2">Sign In</Button>
                </Link>
              )}
            </div>

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center gap-0.5">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 h-9 w-9" onClick={() => setMobileSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 h-9 w-9" onClick={() => handleIconClick('/wishlist')}>
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 h-9 w-9 relative" onClick={() => handleIconClick('/cart')}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm bg-background border-l border-primary/20 p-0 overflow-y-auto">
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-primary/10">
                      <button className="flex items-center w-full text-left" onClick={() => { setMobileMenuOpen(false); navigate('/'); }}>
                        <img
                          src="/logo.jpg"
                          alt="Al Mishk"
                          className="h-12 w-auto object-contain mix-blend-multiply"
                        />
                      </button>
                    </div>

                    <div className="flex-1 py-4 overflow-y-auto">
                      <div className="px-6 mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Navigation</span>
                      </div>
                      {navLinks.map((link) => (
                        <button
                          key={link.label}
                          className="w-full flex items-center gap-4 py-3.5 px-6 hover:bg-primary/5 hover:text-primary transition-all text-left active:bg-primary/10"
                          onClick={() => handleNavClick(link.path)}
                        >
                          <link.icon className="h-5 w-5 text-primary/70 flex-shrink-0" />
                          <span className="font-medium text-base">{link.label}</span>
                        </button>
                      ))}

                      <Separator className="my-4 bg-primary/10" />

                      <div className="px-6 mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</span>
                      </div>
                      {accountLinks.map((link) => (
                        <button
                          key={link.label}
                          className="w-full flex items-center gap-4 py-3.5 px-6 hover:bg-primary/5 hover:text-primary transition-all text-left active:bg-primary/10"
                          onClick={() => { setMobileMenuOpen(false); if (!user) navigate('/auth'); else navigate(link.path); }}
                        >
                          <link.icon className="h-5 w-5 text-primary/70 flex-shrink-0" />
                          <span className="font-medium text-base">{link.label}</span>
                        </button>
                      ))}

                      {isAdmin && user && (
                        <>
                          <Separator className="my-4 bg-primary/10" />
                          <button
                            className="w-full flex items-center gap-4 py-3.5 px-6 bg-primary/5 text-primary font-medium text-left active:bg-primary/10"
                            onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
                          >
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <span className="text-base">Admin Panel</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-5 border-t border-primary/10">
                      {user ? (
                        <Button variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 h-12 text-base" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                          <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </Button>
                      ) : (
                        <Button className="w-full btn-luxury h-12 text-base" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}>
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col md:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-primary/10 bg-background">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                type="text"
                placeholder="Search attars, perfumes..."
                value={localQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10 pr-4 rounded-xl border-primary/20 bg-secondary/50 h-11"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-11 w-11 flex-shrink-0" onClick={() => { setMobileSearchOpen(false); setLocalQuery(''); setSuggestions([]); }}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {localQuery.trim().length < 2 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Type at least 2 characters to search</p>
              </div>
            ) : isSearching ? (
              <div className="text-center py-16 text-muted-foreground">Searching...</div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No results for "<span className="text-foreground">{localQuery}</span>"
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-colors text-left border border-border/50"
                    onClick={() => { handleSuggestionClick(product); setMobileSearchOpen(false); }}
                  >
                    <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-base">{product.name}</p>
                      <p className="text-primary font-serif text-lg">
                        ₹{hasDiscount(product) ? getDiscountedPrice(product) : product.price}
                        {hasDiscount(product) && (
                          <span className="ml-2 line-through text-muted-foreground text-sm">₹{product.price}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  className="w-full py-4 text-primary flex items-center justify-center gap-2 text-base"
                  onClick={() => { onSearchChange?.(localQuery); setMobileSearchOpen(false); scrollToSection('products'); }}
                >
                  <Search className="h-4 w-4" />
                  See all results for "{localQuery}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SiteHeader;
