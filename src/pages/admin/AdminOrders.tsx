import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, Loader2, Eye, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';
import { formatINR } from '@/lib/gst-utils';

interface OrderWithCustomer {
  id: string;
  total_amount: number;
  status: Enums<'order_status'>;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  processing: { icon: Package, color: 'text-sky-400', bgColor: 'bg-sky-500/20 border-sky-500/30' },
  shipped: { icon: Truck, color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
  delivered: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
  cancelled: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    // Single query with join — eliminates N+1 problem
    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, user_id, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
      setIsLoading(false);
      return;
    }

    setOrders((data || []) as OrderWithCustomer[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: Enums<'order_status'>) => {
    setUpdatingOrderId(orderId);
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    
    if (error) {
      toast.error('Failed to update');
    } else {
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: { orderId, newStatus: status },
        });
        toast.success('Status updated & notification sent');
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        toast.success('Status updated (notification failed)');
      }
      fetchOrders();
    }
    setUpdatingOrderId(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-headline text-3xl text-gradient-gold">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders</p>
        </div>
        <Card className="card-luxury overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No orders yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    
                    return (
                      <TableRow key={order.id} className="border-border">
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.profiles?.full_name || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.profiles?.email || ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatINR(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={order.status} 
                              onValueChange={(v) => updateStatus(order.id, v as Enums<'order_status'>)} 
                              disabled={updatingOrderId === order.id}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                  <SelectItem key={s} value={s}>
                                    <div className="flex items-center gap-2">
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingOrderId === order.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
