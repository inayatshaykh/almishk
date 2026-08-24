import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, MapPin, Loader2, CheckCircle, MessageCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import type { Tables } from '@/integrations/supabase/types';
import { getDiscountedPrice, hasDiscount } from '@/lib/price-utils';
import { INDIAN_PHONE_REGEX } from '@/lib/constants';

type CartItem = Tables<'cart_items'> & { products: Tables<'products'> };

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [isPrepaid, setIsPrepaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'prepaid'>('cod');

  // Shipping form state
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '+91 ',
  });

  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cart) {
        const { data } = await supabase
          .from('cart_items')
          .select('*, products(*)')
          .eq('cart_id', cart.id);

        setItems((data as CartItem[]) || []);
      }
      setIsLoading(false);
    };

    fetchCart();
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (data?.full_name) {
        setShippingAddress((prev) => ({ ...prev, fullName: data.full_name || '' }));
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { fullName, address, city, state, zipCode, phone } = shippingAddress;

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (fullName.trim().length > 100) {
      toast.error('Name must be less than 100 characters');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Please enter your mobile number');
      return false;
    }
    if (!INDIAN_PHONE_REGEX.test(phone.trim())) {
      toast.error('Please enter a valid Indian mobile number (e.g. 9876543210)');
      return false;
    }
    if (!address.trim()) {
      toast.error('Please enter your address');
      return false;
    }
    if (address.trim().length > 500) {
      toast.error('Address must be less than 500 characters');
      return false;
    }
    if (!city.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!state.trim()) {
      toast.error('Please enter your state');
      return false;
    }
    if (!zipCode.trim()) {
      toast.error('Please enter your pincode');
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const subtotalAmount = items.reduce((sum, item) => sum + getDiscountedPrice(item.products) * item.quantity, 0);
      const discount = paymentMethod === 'prepaid' ? subtotalAmount * 0.1 : 0;
      const total = subtotalAmount - discount;

      const formattedAddress = `${shippingAddress.fullName}
${shippingAddress.address}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}
Phone: ${shippingAddress.phone}
Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (WhatsApp)'}`.trim();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: formattedAddress,
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order');
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: getDiscountedPrice(item.products),
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        throw new Error('Failed to create order items');
      }

      // Clear cart
      const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
      if (cart) {
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: { orderId: order.id, newStatus: 'pending' },
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      setCompletedOrderId(order.id);
      setOrderComplete(true);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + getDiscountedPrice(item.products) * item.quantity, 0);
  const prepaidDiscount = paymentMethod === 'prepaid' ? subtotal * 0.1 : 0;
  const finalTotal = subtotal - prepaidDiscount;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="card-luxury p-8 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Please sign in to checkout</p>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo size="sm" />
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="card-luxury p-12">
            <CheckCircle className="h-20 w-20 mx-auto text-emerald-500 mb-6" />
            <h1 className="text-headline text-3xl text-gradient-gold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. We've sent a confirmation email with your order details.
            </p>
            {completedOrderId && (
              <p className="text-sm text-muted-foreground mb-8">
                Order ID: <span className="font-mono">{completedOrderId.slice(0, 8)}...</span>
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Link to="/orders">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground btn-glow">
                  View Orders
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
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
        <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>

        <h1 className="text-headline text-3xl text-gradient-gold mb-8">Checkout</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="card-luxury p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link to="/">
              <Button className="bg-primary text-primary-foreground">Continue Shopping</Button>
            </Link>
          </Card>
        ) : (
          <form onSubmit={handleSubmitOrder}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Shipping Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="card-luxury">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number * (WhatsApp preferred)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        required
                        maxLength={15}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address *</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={shippingAddress.address}
                        onChange={handleInputChange}
                        required
                        maxLength={500}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={shippingAddress.city}
                          onChange={handleInputChange}
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={shippingAddress.state}
                          onChange={handleInputChange}
                          required
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Pincode *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={handleInputChange}
                        required
                        maxLength={10}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="card-luxury sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-64 overflow-auto scrollbar-luxury">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="h-16 w-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {item.products.image_url ? (
                              <img
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.products.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            <p className="text-sm text-primary">
                              ₹{(getDiscountedPrice(item.products) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-emerald-500">Free</span>
                      </div>
                      {paymentMethod === 'prepaid' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-500">Prepaid Discount (10%)</span>
                          <span className="text-emerald-500">-₹{prepaidDiscount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Payment Method</p>

                      {/* COD */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          paymentMethod === 'cod'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Cash on Delivery (COD)</p>
                          <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                        </div>
                      </button>

                      {/* Prepaid */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('prepaid')}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          paymentMethod === 'prepaid'
                            ? 'border-emerald-500 bg-emerald-500/5'
                            : 'border-border hover:border-emerald-500/40'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          paymentMethod === 'prepaid' ? 'border-emerald-500' : 'border-muted-foreground'
                        }`}>
                          {paymentMethod === 'prepaid' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Pay via WhatsApp (Prepaid)
                          </p>
                          <p className="text-xs text-emerald-600 font-medium">Save 10% — ₹{(subtotal * 0.1).toFixed(0)} off</p>
                        </div>
                      </button>
                    </div>

                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-glow"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        `Place Order • ₹${finalTotal.toFixed(2)}`
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By placing your order, you agree to our terms and conditions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Checkout;
