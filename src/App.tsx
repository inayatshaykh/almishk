import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect } from "react";

// Eagerly load critical public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

// Lazy load user pages
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));

// Lazy load all admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCombos = lazy(() => import("./pages/admin/AdminCombos"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetails = lazy(() => import("./pages/admin/AdminOrderDetails"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminSlideshow = lazy(() => import("./pages/admin/AdminSlideshow"));
const AdminSellerSettings = lazy(() => import("./pages/admin/AdminSellerSettings"));
const AdminFeaturedProducts = lazy(() => import("./pages/admin/AdminFeaturedProducts"));
const AdminHomepageReviews = lazy(() => import("./pages/admin/AdminHomepageReviews"));
const AdminStoreSettings = lazy(() => import("./pages/admin/AdminStoreSettings"));
const AdminDiscoverySettings = lazy(() => import("./pages/admin/AdminDiscoverySettings"));

const queryClient = new QueryClient();

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/combos" element={<ProtectedRoute requireAdmin><AdminCombos /></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><AdminInventory /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/orders/:orderId" element={<ProtectedRoute requireAdmin><AdminOrderDetails /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
              <Route path="/admin/slideshow" element={<ProtectedRoute requireAdmin><AdminSlideshow /></ProtectedRoute>} />
              <Route path="/admin/featured" element={<ProtectedRoute requireAdmin><AdminFeaturedProducts /></ProtectedRoute>} />
              <Route path="/admin/homepage-reviews" element={<ProtectedRoute requireAdmin><AdminHomepageReviews /></ProtectedRoute>} />
              <Route path="/admin/store-settings" element={<ProtectedRoute requireAdmin><AdminStoreSettings /></ProtectedRoute>} />
              <Route path="/admin/seller-settings" element={<ProtectedRoute requireAdmin><AdminSellerSettings /></ProtectedRoute>} />
              <Route path="/admin/discovery-settings" element={<ProtectedRoute requireAdmin><AdminDiscoverySettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
