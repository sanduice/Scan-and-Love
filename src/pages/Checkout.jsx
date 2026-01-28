import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, CreditCard, ShoppingCart, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { getSessionId, getUserOrSession } from '@/components/SessionManager';
import ImageWithFallback from '@/components/ImageWithFallback';
import { calculateNameBadgePrice } from '@/components/namebadge/utils';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from '@/components/checkout/CheckoutForm';
import ManualPaymentForm from '@/components/checkout/ManualPaymentForm';

export default function Checkout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Address states
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  
  const [sameAsShipping, setSameAsShipping] = useState(true);
  
  // Tax and payment states
  const [tax, setTax] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxSource, setTaxSource] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentMode, setPaymentMode] = useState("stripe");
  const [checkoutError, setCheckoutError] = useState("");

  const sessionId = getSessionId();

  // Get user/session info
  useEffect(() => {
    getUserOrSession().then(setOwnerInfo);
  }, []);

  // Fetch cart items
  const { data: savedDesigns = [], isLoading: loadingSavedDesigns } = useQuery({
    queryKey: ['cart-items', ownerInfo?.userId, sessionId],
    queryFn: async () => {
      if (ownerInfo?.type === 'user') {
        return base44.entities.SavedDesign.filter({ is_in_cart: true, user_id: ownerInfo.userId });
      }
      return base44.entities.SavedDesign.filter({ is_in_cart: true, session_id: sessionId });
    },
    enabled: !!ownerInfo,
  });

  const { data: badgeOrders = [], isLoading: loadingBadgeOrders } = useQuery({
    queryKey: ['cart-badge-orders', ownerInfo?.userId, sessionId],
    queryFn: async () => {
      if (ownerInfo?.type === 'user') {
        return base44.entities.NameBadgeOrder.filter({ is_in_cart: true, user_id: ownerInfo.userId });
      }
      return base44.entities.NameBadgeOrder.filter({ is_in_cart: true, session_id: sessionId });
    },
    enabled: !!ownerInfo,
  });

  const isLoading = loadingSavedDesigns || loadingBadgeOrders;

  // Combine cart items
  const cartItems = [
    ...savedDesigns.map(item => ({ ...item, itemType: 'design' })),
    ...badgeOrders.map(item => ({ ...item, itemType: 'badge' })),
  ];

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    if (item.itemType === 'badge') {
      return sum + (item.total_price || 0);
    }
    return sum + (item.unit_price || 0) * (item.quantity || 1);
  }, 0);
  
  const shipping = subtotal >= 99 ? 0 : 12.95;
  const total = subtotal + shipping + tax;

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const { data } = await base44.functions.invoke('get_stripe_config');
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      } catch (e) {
        console.error("Failed to load stripe config", e);
      }
    };
    initStripe();
  }, []);

  // Calculate Tax Effect
  useEffect(() => {
    const fetchTax = async () => {
      if (!shippingAddress.state || !shippingAddress.zip) {
        setTax(0);
        return;
      }
      
      setTaxLoading(true);
      try {
        let customer_email = ownerInfo?.email;
        const { data } = await base44.functions.invoke('calculateTax', {
          subtotal,
          shipping,
          address: shippingAddress,
          customer_email
        });

        setTax(data.tax_amount || 0);
        setTaxSource(data.tax_source);
      } catch (error) {
        console.error("Tax calculation failed", error);
      } finally {
        setTaxLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchTax, 800);
    return () => clearTimeout(timeoutId);
  }, [shippingAddress.state, shippingAddress.zip, subtotal, shipping, ownerInfo]);

  // Sync billing address when sameAsShipping is true
  useEffect(() => {
    if (sameAsShipping) {
      setBillingAddress({ ...shippingAddress });
    }
  }, [sameAsShipping, shippingAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      navigate(createPageUrl('Cart'));
    }
  }, [isLoading, cartItems.length, navigate]);

  const validateAddresses = () => {
    if (!shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      setCheckoutError('Please fill in all shipping information');
      toast.error('Please fill in all shipping information');
      return false;
    }
    
    if (!sameAsShipping) {
      if (!billingAddress.name || !billingAddress.street || !billingAddress.city || !billingAddress.state || !billingAddress.zip) {
        setCheckoutError('Please fill in all billing information');
        toast.error('Please fill in all billing information');
        return false;
      }
    }
    
    return true;
  };

  const handleProceedToPayment = async () => {
    setCheckoutError("");
    
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      toast.info('Please sign in to complete your order');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!validateAddresses()) return;

    setIsProcessing(true);
    
    if (!stripePromise) {
      console.log('Stripe not available, using bypass payment mode');
      setPaymentMode("bypass");
      setIsProcessing(false);
      return;
    }

    try {
      const { data } = await base44.functions.create_payment_intent({
        amount: total,
        currency: 'usd',
        metadata: {
          customer_email: ownerInfo?.email,
          items_count: cartItems.length,
          shipping_name: shippingAddress.name,
          shipping_city: shippingAddress.city,
          shipping_state: shippingAddress.state,
        }
      });

      if (data.error) throw new Error(data.error);
      
      setPaymentMode("stripe");
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment setup failed, falling back to bypass mode:', err);
      setPaymentMode("bypass");
      toast.info('Using test payment mode');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = async () => {
    setCheckoutError("");
    
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      toast.info('Please sign in to complete your order');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!validateAddresses()) return;

    setIsProcessing(true);
    
    try {
      const orderItems = buildOrderItems();
      const orderNumber = 'TEST-' + Date.now().toString(36).toUpperCase();
      const finalBillingAddress = sameAsShipping ? shippingAddress : billingAddress;

      await base44.entities.Order.create({
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'test_skip',
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        shipping_address: {
          ...shippingAddress,
          email: ownerInfo?.email || '',
          shipping_method: shipping === 0 ? 'Free Shipping' : 'Standard Shipping'
        },
        billing_address: finalBillingAddress,
        payment_intent_id: `test_skip_${Date.now()}`,
        notes: 'TEST ORDER - Payment skipped for testing purposes'
      });

      toast.success('Test order created successfully!');
      
      // Clear cart items
      try {
        for (const item of cartItems) {
          if (item.itemType === 'badge') {
            await base44.entities.NameBadgeOrder.update(item.id, { is_in_cart: false });
          } else {
            await base44.entities.SavedDesign.update(item.id, { is_in_cart: false });
          }
        }
      } catch (cleanupError) {
        console.warn('Cart cleanup warning:', cleanupError);
      }

      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['saved-designs'] });
      navigate(createPageUrl('Account'));
    } catch (err) {
      console.error('Test order creation failed:', err);
      toast.error('Failed to create test order: ' + err.message);
      setCheckoutError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const buildOrderItems = () => {
    return cartItems.map(item => {
      if (item.itemType === 'badge') {
        return {
          item_type: 'badge',
          badge_order_id: item.id,
          design_id: item.design_id,
          product_name: 'Custom Name Badges',
          size_shape: item.size_shape,
          fastener: item.fastener,
          border: item.border,
          dome: item.dome,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          line_total: item.total_price || 0,
          thumbnail_url: item.thumbnail_url || '',
          names_csv_url: item.names_csv_url || '',
          names_data_json: item.names_data_json || '',
        };
      }
      return {
        item_type: 'design',
        saved_design_id: item.id,
        product_type: item.product_type,
        product_name: item.name || item.product_type?.replace('-', ' '),
        width: item.width,
        height: item.height,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        line_total: (item.unit_price || 0) * (item.quantity || 1),
        thumbnail_url: item.thumbnail_url || '',
        artwork_url: item.artwork_url || '',
        elements_json: item.elements_json || '',
        options_json: item.options_json || '',
        material: item.material || '',
        finish: item.finish || '',
        snapshot_json: JSON.stringify({
          elements: item.elements_json,
          options: item.options_json,
          artwork: item.artwork_url
        })
      };
    });
  };

  const handlePaymentSuccess = async (paymentResult) => {
    setIsProcessing(true);
    const isBypass = paymentMode === "bypass";
    
    try {
      const orderItems = buildOrderItems();
      const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();
      const orderStatus = isBypass ? 'pending_payment' : 'paid';
      const paymentStatus = isBypass ? 'unpaid' : 'paid';
      const finalBillingAddress = sameAsShipping ? shippingAddress : billingAddress;

      await base44.entities.Order.create({
        order_number: orderNumber,
        status: orderStatus,
        payment_status: paymentStatus,
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        shipping_address: {
          ...shippingAddress,
          email: ownerInfo?.email || '',
          shipping_method: shipping === 0 ? 'Free Shipping' : 'Standard Shipping'
        },
        billing_address: finalBillingAddress,
        payment_intent_id: paymentResult.paymentIntentId || paymentResult.id
      });

      toast.success(isBypass ? 'Test order placed successfully!' : 'Order placed successfully!');
      setClientSecret("");
      setPaymentMode("stripe");
      setCheckoutError("");
      
      // Cleanup cart
      try {
        for (const item of cartItems) {
          if (item.itemType === 'badge') {
            await base44.entities.NameBadgeOrder.update(item.id, { is_in_cart: false });
          } else {
            await base44.entities.SavedDesign.update(item.id, { is_in_cart: false });
          }
        }
      } catch (cleanupError) {
        console.warn('Cart cleanup warning:', cleanupError);
      }

      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['saved-designs'] });
      navigate(createPageUrl('Account'));
    } catch (err) {
      console.error('Order creation failed:', err);
      toast.error('Payment successful but order creation failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some products to your cart before checking out.
          </p>
          <Link to={createPageUrl('Products')}>
            <Button className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-8">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <Link to={createPageUrl('Cart')} className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {cartItems.map((item) => (
                  <div key={`${item.itemType}-${item.id}`} className="flex gap-3 pb-3 border-b border-border last:border-0">
                    <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.thumbnail_url ? (
                        <ImageWithFallback
                          src={item.thumbnail_url}
                          alt={item.name || 'Design'}
                          className="w-full h-full object-contain"
                          fallbackText={item.itemType === 'badge' ? 'Badge' : `${item.width}"×${item.height}"`}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground text-center px-1">
                          {item.itemType === 'badge' ? 'Badge' : `${item.width}"×${item.height}"`}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {item.itemType === 'badge' ? 'Custom Name Badges' : (item.name || 'Custom Design')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity || 1}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-card-foreground">
                      ${item.itemType === 'badge' 
                        ? (item.total_price || 0).toFixed(2)
                        : ((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-card-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-card-foreground">
                    {shipping === 0 ? <span className="text-green-600">FREE</span> : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax {taxLoading && <Loader2 className="inline w-3 h-3 animate-spin" />}
                  </span>
                  <span className="font-medium text-card-foreground">${tax.toFixed(2)}</span>
                </div>
                {taxSource === 'exempt' && (
                  <div className="text-xs text-green-600">Tax Exempt Applied</div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                  <span className="text-card-foreground">Total</span>
                  <span className="text-[#8BC34A]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Forms + Payment - Right Column */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            {/* Address Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Shipping Address</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="ship-name">Full Name *</Label>
                      <Input 
                        id="ship-name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ship-street">Street Address *</Label>
                      <Input 
                        id="ship-street"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="ship-city">City *</Label>
                        <Input 
                          id="ship-city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ship-state">State *</Label>
                        <Input 
                          id="ship-state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="ship-zip">ZIP Code *</Label>
                        <Input 
                          id="ship-zip"
                          value={shippingAddress.zip}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ship-phone">Phone</Label>
                        <Input 
                          id="ship-phone"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-card-foreground">Billing Address</h3>
                  </div>
                  
                  {/* Same as Shipping Checkbox */}
                  <div className="flex items-center space-x-2 mb-4 p-3 bg-muted rounded-lg">
                    <Checkbox 
                      id="same-as-shipping" 
                      checked={sameAsShipping}
                      onCheckedChange={(checked) => setSameAsShipping(checked)}
                    />
                    <Label 
                      htmlFor="same-as-shipping" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Same as shipping address
                    </Label>
                  </div>

                  <div className={`space-y-3 transition-opacity ${sameAsShipping ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <Label htmlFor="bill-name">Full Name *</Label>
                      <Input 
                        id="bill-name"
                        value={billingAddress.name}
                        onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                        placeholder="John Doe"
                        disabled={sameAsShipping}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bill-street">Street Address *</Label>
                      <Input 
                        id="bill-street"
                        value={billingAddress.street}
                        onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                        placeholder="123 Main St"
                        disabled={sameAsShipping}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="bill-city">City *</Label>
                        <Input 
                          id="bill-city"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                          placeholder="New York"
                          disabled={sameAsShipping}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bill-state">State *</Label>
                        <Input 
                          id="bill-state"
                          value={billingAddress.state}
                          onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                          placeholder="NY"
                          disabled={sameAsShipping}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="bill-zip">ZIP Code *</Label>
                        <Input 
                          id="bill-zip"
                          value={billingAddress.zip}
                          onChange={(e) => setBillingAddress({ ...billingAddress, zip: e.target.value })}
                          placeholder="10001"
                          disabled={sameAsShipping}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bill-phone">Phone</Label>
                        <Input 
                          id="bill-phone"
                          value={billingAddress.phone}
                          onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          disabled={sameAsShipping}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Payment</h3>
              
              {checkoutError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-4">
                  {checkoutError}
                </div>
              )}

              {/* Payment UI */}
              {paymentMode === "bypass" ? (
                <ManualPaymentForm 
                  amount={total}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => {
                    setPaymentMode("stripe");
                    setClientSecret("");
                  }}
                />
              ) : clientSecret ? (
                <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                  <CheckoutForm 
                    amount={total} 
                    onSuccess={handlePaymentSuccess} 
                    onCancel={() => setClientSecret("")}
                  />
                </Elements>
              ) : (
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-[#8BC34A] hover:bg-[#7CB342] text-white h-12 text-lg"
                    onClick={handleProceedToPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ${total.toFixed(2)}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full border-orange-400 text-orange-600 hover:bg-orange-50"
                    onClick={handleSkipPayment}
                    disabled={isProcessing}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Skip Payment (Test Mode)
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                    <Lock className="w-3 h-3" />
                    <span>Secure checkout powered by Stripe</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
