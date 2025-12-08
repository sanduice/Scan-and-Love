import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, Send, Loader2, CheckCircle, Package, 
  User, Mail, Phone, Building, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { getSessionId, getUserOrSession } from '@/components/SessionManager';

export default function RequestQuote() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
          setFormData(prev => ({
            ...prev,
            name: userData.full_name || '',
            email: userData.email || '',
          }));
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  const sessionId = getSessionId();

  // Get cart items for the quote
  const { data: cartDesigns = [] } = useQuery({
    queryKey: ['quote-cart-designs', user?.email, sessionId],
    queryFn: async () => {
      if (user) {
        return base44.entities.SavedDesign.filter({ is_in_cart: true, created_by: user.email });
      }
      return base44.entities.SavedDesign.filter({ is_in_cart: true, session_id: sessionId });
    },
  });

  const { data: cartBadges = [] } = useQuery({
    queryKey: ['quote-cart-badges', user?.email, sessionId],
    queryFn: async () => {
      if (user) {
        return base44.entities.NameBadgeOrder.filter({ is_in_cart: true, created_by: user.email });
      }
      return base44.entities.NameBadgeOrder.filter({ is_in_cart: true, session_id: sessionId });
    },
  });

  const cartItems = [
    ...cartDesigns.map(d => ({ ...d, itemType: 'design' })),
    ...cartBadges.map(b => ({ ...b, itemType: 'badge' })),
  ];

  const subtotal = cartItems.reduce((sum, item) => {
    if (item.itemType === 'badge') {
      return sum + (item.total_price || 0);
    }
    return sum + (item.unit_price || 0) * (item.quantity || 1);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Please fill in your name and email');
      return;
    }

    setIsSubmitting(true);
    try {
      const quoteNumber = 'QT-' + Date.now().toString(36).toUpperCase();
      
      const quoteItems = cartItems.map(item => {
        if (item.itemType === 'badge') {
          return {
            type: 'badge',
            name: 'Custom Name Badges',
            size_shape: item.size_shape,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total_price,
            thumbnail_url: item.thumbnail_url,
          };
        }
        return {
          type: 'design',
          name: item.name || item.product_type,
          product_type: item.product_type,
          width: item.width,
          height: item.height,
          quantity: item.quantity || 1,
          unit_price: item.unit_price,
          total: (item.unit_price || 0) * (item.quantity || 1),
          thumbnail_url: item.thumbnail_url,
        };
      });

      await base44.entities.Quote.create({
        quote_number: quoteNumber,
        status: 'pending',
        customer_email: formData.email,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_company: formData.company,
        items_json: JSON.stringify(quoteItems),
        subtotal: subtotal,
        total: subtotal,
        notes: formData.notes,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        session_id: sessionId,
      });

      // Send notification email to admin
      await base44.integrations.Core.SendEmail({
        to: 'admin@netraveprint.com', // Replace with actual admin email
        subject: `New Quote Request: ${quoteNumber}`,
        body: `
          <h2>New Quote Request</h2>
          <p><strong>Quote #:</strong> ${quoteNumber}</p>
          <p><strong>Customer:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
          <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
          <p><strong>Items:</strong> ${cartItems.length}</p>
          <p><strong>Estimated Total:</strong> $${subtotal.toFixed(2)}</p>
          <p><strong>Notes:</strong> ${formData.notes || 'None'}</p>
        `,
      });

      // Send confirmation to customer
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: `Quote Request Received - ${quoteNumber}`,
        body: `
          <h2>Thank You for Your Quote Request!</h2>
          <p>Hi ${formData.name},</p>
          <p>We've received your quote request and will review it shortly.</p>
          <p><strong>Quote Number:</strong> ${quoteNumber}</p>
          <p><strong>Items:</strong> ${cartItems.length}</p>
          <p><strong>Estimated Total:</strong> $${subtotal.toFixed(2)}</p>
          <p>Our team will review your requirements and send you a detailed quote within 1-2 business days.</p>
          <p>Thank you for choosing NetravePrint!</p>
        `,
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit quote request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h1>
          <p className="text-gray-600 mb-6">
            We've received your request and will send you a detailed quote within 1-2 business days.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            A confirmation email has been sent to {formData.email}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to={createPageUrl('Home')}>
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link to={createPageUrl('Products')}>
              <Button className="bg-[#8BC34A] hover:bg-[#7CB342]">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to={createPageUrl('Cart')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ChevronLeft className="w-5 h-5" />
          Back to Cart
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Request a Quote</h1>
            <p className="text-gray-600 mb-6">
              Need a custom quote for your order? Fill out the form below and we'll get back to you within 1-2 business days.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Name
                </Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Additional Notes
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tell us about your project, timeline, special requirements..."
                  className="mt-1 h-32"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#8BC34A] hover:bg-[#7CB342] h-12 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                Submit Quote Request
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items for Quote ({cartItems.length})
              </h2>

              {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items in cart. Add items before requesting a quote.
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                    {cartItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-white rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.itemType === 'badge' ? 'Name Badges' : (item.name || item.product_type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.itemType === 'badge' 
                              ? `${item.quantity} badges`
                              : `${item.width}" × ${item.height}" × ${item.quantity || 1}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${item.itemType === 'badge' 
                              ? (item.total_price || 0).toFixed(2)
                              : ((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Estimated Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-500">TBD</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-[#8BC34A]">${subtotal.toFixed(2)}+</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Final pricing will be provided in your quote based on quantity and specifications.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}