import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, User, Package, CreditCard, FileText, 
  Download, Loader2, MapPin, Phone, Mail, Building2,
  Clock, CheckCircle, Truck, XCircle
} from 'lucide-react';
import { formatINR, isIntrastate, getStateFromGSTIN } from '@/lib/gst-utils';
import type { Enums } from '@/integrations/supabase/types';

interface OrderDetails {
  id: string;
  created_at: string;
  updated_at: string;
  status: Enums<'order_status'>;
  total_amount: number;
  shipping_address: string | null;
  user_id: string;
  payment_status: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  cgst_total: number | null;
  sgst_total: number | null;
  igst_total: number | null;
  shipping_charges: number | null;
  discount_amount: number | null;
  subtotal: number | null;
  is_intrastate: boolean | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  hsn_code: string | null;
  gst_percentage: number | null;
  taxable_amount: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  products: {
    name: string;
    image_url: string | null;
    hsn_code: string | null;
    gst_percentage: number | null;
  };
}

interface CustomerProfile {
  id: string;
  full_name: string | null;
  email: string;
  mobile: string | null;
  gstin: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_pincode: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  pdf_url: string | null;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
  processing: { icon: Package, color: 'text-sky-400', bgColor: 'bg-sky-500/20 border-sky-500/30' },
  shipped: { icon: Truck, color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
  delivered: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
  cancelled: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
};

const AdminOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setIsLoading(true);

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        toast.error('Order not found');
        navigate('/admin/orders');
        return;
      }
      setOrder(orderData as OrderDetails);

      // Fetch order items with products
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name, image_url, hsn_code, gst_percentage)')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setItems((itemsData || []) as OrderItem[]);

      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', orderData.user_id)
        .maybeSingle();

      if (!profileError && profileData) {
        setCustomer(profileData as CustomerProfile);
      }

      // Check for existing invoice
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (invoiceData) {
        setInvoice(invoiceData as Invoice);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: Enums<'order_status'>) => {
    if (!order) return;
    setUpdatingStatus(true);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      // Send notification
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: { orderId: order.id, newStatus: status },
        });
      } catch (e) {
        console.error('Notification failed:', e);
      }
      
      toast.success('Status updated');
      setOrder({ ...order, status });

      // Auto-generate invoice for delivered orders
      if (status === 'delivered' && !invoice) {
        generateInvoice();
      }
    }
    setUpdatingStatus(false);
  };

  const generateInvoice = async () => {
    if (!order || invoice) return;
    setGeneratingInvoice(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId: order.id },
      });

      if (error) throw error;

      toast.success('Invoice generated successfully');
      fetchOrderDetails(); // Refresh to get invoice
    } catch (error) {
      console.error('Invoice generation failed:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Calculate GST summary from items
  const calculateSummary = () => {
    const subtotal = items.reduce((sum, item) => {
      const taxable = item.taxable_amount || item.price_at_purchase * item.quantity;
      return sum + taxable;
    }, 0);

    const cgstTotal = items.reduce((sum, item) => sum + (item.cgst_amount || 0), 0);
    const sgstTotal = items.reduce((sum, item) => sum + (item.sgst_amount || 0), 0);
    const igstTotal = items.reduce((sum, item) => sum + (item.igst_amount || 0), 0);
    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const shipping = order?.shipping_charges || 0;
    const discount = order?.discount_amount || 0;
    const grandTotal = subtotal + totalTax + shipping - discount;

    return { subtotal, cgstTotal, sgstTotal, igstTotal, totalTax, shipping, discount, grandTotal };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </AdminLayout>
    );
  }

  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const summary = calculateSummary();
  const isIntrastate = order.is_intrastate ?? true;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-headline text-2xl text-gradient-gold">
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground text-sm">
                {new Date(order.created_at).toLocaleString('en-IN', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${config.bgColor} border ${config.color} flex items-center gap-1.5 px-3 py-1`}>
              <StatusIcon className="h-4 w-4" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            {order.status === 'delivered' && invoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => invoice.pdf_url && window.open(invoice.pdf_url, '_blank')}
                disabled={!invoice.pdf_url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            )}
            {order.status === 'delivered' && !invoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateInvoice}
                disabled={generatingInvoice}
              >
                {generatingInvoice ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Invoice
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card className="card-luxury">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{customer?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer?.mobile || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer?.email || 'N/A'}</span>
                    </div>
                    {customer?.gstin && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>GSTIN: {customer.gstin}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Billing Address</p>
                      <p className="text-sm">
                        {customer?.billing_address || order.shipping_address || 'N/A'}
                        {customer?.billing_city && `, ${customer.billing_city}`}
                        {customer?.billing_state && `, ${customer.billing_state}`}
                        {customer?.billing_pincode && ` - ${customer.billing_pincode}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                      <p className="text-sm">
                        {customer?.shipping_address || order.shipping_address || 'N/A'}
                        {customer?.shipping_city && `, ${customer.shipping_city}`}
                        {customer?.shipping_state && `, ${customer.shipping_state}`}
                        {customer?.shipping_pincode && ` - ${customer.shipping_pincode}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card className="card-luxury">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date & Time</p>
                    <p className="text-sm">
                      {new Date(order.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Status</p>
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus(v as Enums<'order_status'>)}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-full h-8 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge 
                      variant="outline" 
                      className={order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}
                    >
                      {order.payment_status || 'Pending'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="text-sm">{order.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm">{order.transaction_id || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details Table */}
            <Card className="card-luxury overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Product Details (GST Breakup)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>Product</TableHead>
                        <TableHead>HSN/SAC</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Taxable</TableHead>
                        <TableHead className="text-right">GST %</TableHead>
                        {isIntrastate ? (
                          <>
                            <TableHead className="text-right">CGST</TableHead>
                            <TableHead className="text-right">SGST</TableHead>
                          </>
                        ) : (
                          <TableHead className="text-right">IGST</TableHead>
                        )}
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const gstPct = item.gst_percentage || item.products.gst_percentage || 18;
                        const taxable = item.taxable_amount || item.price_at_purchase * item.quantity;
                        const totalTax = (item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0);
                        const lineTotal = taxable + totalTax;

                        return (
                          <TableRow key={item.id} className="border-border">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.products.image_url && (
                                  <img
                                    src={item.products.image_url}
                                    alt={item.products.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <span className="font-medium">{item.products.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.hsn_code || item.products.hsn_code || '-'}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatINR(item.price_at_purchase)}</TableCell>
                            <TableCell className="text-right">{formatINR(taxable)}</TableCell>
                            <TableCell className="text-right">{gstPct}%</TableCell>
                            {isIntrastate ? (
                              <>
                                <TableCell className="text-right">{formatINR(item.cgst_amount || 0)}</TableCell>
                                <TableCell className="text-right">{formatINR(item.sgst_amount || 0)}</TableCell>
                              </>
                            ) : (
                              <TableCell className="text-right">{formatINR(item.igst_amount || 0)}</TableCell>
                            )}
                            <TableCell className="text-right font-medium">{formatINR(lineTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Amount Summary */}
            <Card className="card-luxury">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Amount Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(summary.subtotal)}</span>
                </div>
                <Separator className="bg-border/50" />
                {isIntrastate ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST</span>
                      <span>{formatINR(summary.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST</span>
                      <span>{formatINR(summary.sgstTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span>{formatINR(summary.igstTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Total Tax</span>
                  <span>{formatINR(summary.totalTax)}</span>
                </div>
                <Separator className="bg-border/50" />
                {summary.shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatINR(summary.shipping)}</span>
                  </div>
                )}
                {summary.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatINR(summary.discount)}</span>
                  </div>
                )}
                <Separator className="bg-border/50" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatINR(summary.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Card */}
            {invoice && (
              <Card className="card-luxury">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice No.</span>
                    <span className="font-mono">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice Date</span>
                    <span>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  {invoice.pdf_url && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => window.open(invoice.pdf_url!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tax Type Indicator */}
            <Card className="card-luxury">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tax Type</span>
                  <Badge variant="outline" className={isIntrastate ? 'badge-info' : 'badge-warning'}>
                    {isIntrastate ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetails;
