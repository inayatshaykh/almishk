import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'> & { products: Tables<'products'> };

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  processing: { icon: Package, color: 'text-sky-400', bgColor: 'bg-sky-500/20 border-sky-500/30' },
  shipped: { icon: Truck, color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
  delivered: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
  cancelled: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setIsLoading(false);
        return;
      }

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*, products(*)')
            .eq('order_id', order.id);
          return { ...order, items: (items || []) as OrderItem[] };
        })
      );

      setOrders(ordersWithItems);
      setIsLoading(false);
    };

    fetchOrders();
  }, [user]);

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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-headline text-3xl text-gradient-gold mb-2">My Orders</h1>
          <p className="text-muted-foreground mb-8">Track your order history and status</p>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Loading orders...</p>
          ) : orders.length === 0 ? (
            <Card className="card-luxury">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Start Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <Card
                    key={order.id}
                    className="card-luxury overflow-hidden cursor-pointer transition-all hover:border-primary/30"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-serif">
                            Order #{order.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge className={`${config.bgColor} border ${config.color} flex items-center gap-1.5`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-xl font-serif text-primary">₹{order.total_amount}</span>
                      </div>

                      {/* Status Timeline */}
                      <div className="flex items-center justify-between mb-4 px-2">
                        {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                          const stepConfig = statusConfig[status];
                          const StepIcon = stepConfig.icon;
                          const currentIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                          const isActive = index <= currentIndex && order.status !== 'cancelled';
                          const isCurrent = status === order.status;

                          return (
                            <div key={status} className="flex flex-col items-center flex-1">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isActive
                                    ? `${stepConfig.bgColor} ${stepConfig.color} border-current`
                                    : 'bg-muted/50 text-muted-foreground border-muted'
                                } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-background ring-primary/50' : ''}`}
                              >
                                <StepIcon className="h-5 w-5" />
                              </div>
                              <span
                                className={`text-xs mt-2 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Items (expandable) */}
                      {isExpanded && order.items.length > 0 && (
                        <div className="border-t border-border pt-4 mt-4 space-y-3 animate-fade-in">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                {item.products?.image_url ? (
                                  <img
                                    src={item.products.image_url}
                                    alt={item.products.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground/50" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.products?.name || 'Product'}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <span className="text-sm text-primary">₹{item.price_at_purchase}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {order.shipping_address && isExpanded && (
                        <div className="border-t border-border pt-4 mt-4 animate-fade-in">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Shipping Address</p>
                          <p className="text-sm">{order.shipping_address}</p>
                        </div>
                      )}
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

export default Orders;
