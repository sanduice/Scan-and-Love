import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus, Edit, Loader2, CreditCard, Download, ChevronDown, ChevronUp, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getSessionId, getUserOrSession } from '@/components/SessionManager';
import ImageWithFallback from '@/components/ImageWithFallback';
import { calculateNameBadgePrice } from '@/components/namebadge/utils';

// Badge Names List Component with inline editing
function BadgeNamesList({ item, expanded, onToggle, queryClient }) {
  const [editingEntry, setEditingEntry] = useState(null);
  const [localEntries, setLocalEntries] = useState([]);

  useEffect(() => {
    if (item.names_data_json) {
      setLocalEntries(JSON.parse(item.names_data_json));
    }
  }, [item.names_data_json]);

  const updateBadgeOrder = async (newEntries) => {
    // Recalculate totals
    const totalQty = newEntries.reduce((sum, e) => {
      return sum + (e.quantity || 1);
    }, 0);

    // Recalculate pricing based on new quantity
    const { unitPrice, totalPrice } = calculateNameBadgePrice({
        sizeShape: item.size_shape,
        background: item.background, // Now available in entity
        border: item.border,
        fastener: item.fastener,
        dome: item.dome,
        quantity: totalQty
    });

    await base44.entities.NameBadgeOrder.update(item.id, {
      names_data_json: JSON.stringify(newEntries),
      quantity: totalQty,
      unit_price: unitPrice,
      total_price: totalPrice,
    });
    queryClient.invalidateQueries({ queryKey: ['cart-badge-orders'] });
    queryClient.invalidateQueries({ queryKey: ['cart-count'] });
  };

  const updateEntryQuantity = async (entryId, newQty) => {
    if (newQty < 1) return;
    const newEntries = localEntries.map(e => 
      e.id === entryId ? { ...e, quantity: newQty } : e
    );
    setLocalEntries(newEntries);
    await updateBadgeOrder(newEntries);
    toast.success('Quantity updated');
  };

  const removeEntry = async (entryId) => {
    const newEntries = localEntries.filter(e => e.id !== entryId);
    if (newEntries.length === 0) {
      toast.error('Cannot remove last badge. Use Remove button to delete entire order.');
      return;
    }
    setLocalEntries(newEntries);
    await updateBadgeOrder(newEntries);
    toast.success('Badge removed from cart (saved for reorder)');
  };

  const blankCount = localEntries.filter(e => e.isBlank).reduce((sum, e) => sum + (e.quantity || 1), 0);
  const namedCount = localEntries.filter(e => !e.isBlank).reduce((sum, e) => sum + (e.quantity || 1), 0);

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>View & edit {item.quantity} badges</span>
          {blankCount > 0 && <span className="text-amber-600">({blankCount} blank)</span>}
          {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {localEntries.map((entry, i) => (
              <div 
                key={entry.id || i} 
                className={`text-sm flex items-center gap-2 py-2 px-2 rounded ${entry.isBlank ? 'bg-amber-50' : 'bg-white'} border`}
              >
                <span className="text-gray-400 w-5 text-xs">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  {entry.isBlank ? (
                    <span className="text-amber-700 font-medium">Blank (Logo Only)</span>
                  ) : (
                    <>
                      <span className="font-medium truncate">{entry.fields[0] || '(empty)'}</span>
                      {entry.fields[1] && <span className="text-gray-500 ml-1">- {entry.fields[1]}</span>}
                    </>
                  )}
                </div>
                {/* Quantity controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded px-1">
                  <button 
                    onClick={() => updateEntryQuantity(entry.id, (entry.quantity || 1) - 1)}
                    disabled={(entry.quantity || 1) <= 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">{entry.quantity || 1}</span>
                  <button 
                    onClick={() => updateEntryQuantity(entry.id, (entry.quantity || 1) + 1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  title="Remove from cart (saved for reorder)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            {item.names_csv_url && (
              <a 
                href={item.names_csv_url} 
                download="badge_names.csv"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Download className="w-3 h-3" />
                Download CSV
              </a>
            )}
            <Link 
              to={`${createPageUrl('NameBadgeNames')}?designId=${item.design_id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              Full edit mode →
            </Link>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Cart() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedBadges, setExpandedBadges] = useState({});
  const [ownerInfo, setOwnerInfo] = useState(null);

  // Get user/session info
  useEffect(() => {
    getUserOrSession().then(setOwnerInfo);
  }, []);

  const sessionId = getSessionId();

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

  // Include owner loading state - queries are disabled when ownerInfo is null
  const isOwnerLoading = !ownerInfo;
  const isLoading = isOwnerLoading || loadingSavedDesigns || loadingBadgeOrders;

  // Combine cart items
  const cartItems = [
    ...savedDesigns.map(item => ({ ...item, itemType: 'design' })),
    ...badgeOrders.map(item => ({ ...item, itemType: 'badge' })),
  ];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedDesign.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['cart-items'] });
      const previousItems = queryClient.getQueryData(['cart-items']);
      queryClient.setQueryData(['cart-items'], (old) => 
        old?.map(item => item.id === id ? { ...item, ...data } : item)
      );
      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['cart-items'], context.previousItems);
      }
      toast.error('Failed to update quantity');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedDesign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Item removed from cart');
    },
  });

  const updateQuantity = (item, newQty) => {
    if (newQty < 1) return;
    updateMutation.mutate({
      id: item.id,
      data: { quantity: newQty },
    });
  };

  const removeItem = (item) => {
    if (item.itemType === 'badge') {
      deleteBadgeMutation.mutate(item.id);
    } else {
      deleteMutation.mutate(item.id);
    }
  };

  const deleteBadgeMutation = useMutation({
    mutationFn: (id) => base44.entities.NameBadgeOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-badge-orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Item removed from cart');
    },
  });

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      if (item.itemType === 'badge') {
        return sum + (item.total_price || 0);
      }
      return sum + (item.unit_price || 0) * (item.quantity || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal >= 99 ? 0 : 12.95;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet.
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <Link to={createPageUrl('Products')} className="flex items-center gap-2 text-[#2196F3] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.itemType}-${item.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex gap-4">
                  {/* Preview Image */}
                  <div className="w-24 flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border">
                      {item.thumbnail_url ? (
                        <ImageWithFallback
                          src={item.thumbnail_url}
                          alt={item.name || 'Design'}
                          className="w-full h-full object-contain"
                          fallbackText={item.itemType === 'badge' ? 'Badge' : `${item.width}"×${item.height}"`}
                        />
                      ) : (
                        <span className="text-xs text-gray-400 text-center px-1 block">
                          {item.itemType === 'badge' ? 'Badge' : `${item.width}"×${item.height}"`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row: Title + Price */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {item.itemType === 'badge' ? `${item.badge_type === 'executive' ? 'Executive' : item.badge_type === 'premium' ? 'Premium' : 'Custom'} Name Badges` : (item.name || 'Custom Design')}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {item.itemType === 'badge' 
                            ? `${item.size_shape?.replace(/-/g, ' ')} • ${item.fastener?.replace('-', ' ')}`
                            : `${(item.product_type || 'vinyl-banner').replace('-', ' ')} • ${item.width}" × ${item.height}"`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <div className="font-bold text-lg text-gray-900">
                          ${item.itemType === 'badge' 
                            ? (item.total_price || 0).toFixed(2)
                            : ((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${(item.unit_price || 0).toFixed(2)} each
                        </div>
                      </div>
                    </div>

                    {/* Product Options & Details */}
                    <div className="text-sm text-gray-600 mb-3">
                      {item.itemType === 'badge' ? (
                        <span>{item.quantity} badge{item.quantity !== 1 ? 's' : ''}{item.border && item.border !== 'none' ? ` • ${item.border} border` : ''}</span>
                      ) : (
                        <div className="space-y-1">
                          {/* Parse and display selected options with prices */}
                          {(() => {
                            try {
                              const options = typeof item.options_json === 'string' 
                                ? JSON.parse(item.options_json) 
                                : (item.options_json || {});
                              
                              // Get options that are objects with title and price
                              const selectedOptions = Object.entries(options)
                                .filter(([key, val]) => 
                                  val && typeof val === 'object' && val.title && val.price > 0
                                )
                                .map(([key, val]) => val);
                              
                              if (selectedOptions.length > 0) {
                                return (
                                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                                    {selectedOptions.map((opt, idx) => (
                                      <span key={idx} className="inline-flex items-center">
                                        <span className="text-gray-700">{opt.title}</span>
                                        <span className="text-green-600 ml-1">+${Number(opt.price).toFixed(2)}</span>
                                        {idx < selectedOptions.length - 1 && <span className="ml-2 text-gray-300">•</span>}
                                      </span>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Badge Names Expander - Own Row */}
                    {item.itemType === 'badge' && item.names_data_json && (
                      <div className="mb-3">
                        <BadgeNamesList 
                          item={item} 
                          expanded={expandedBadges[item.id]}
                          onToggle={() => setExpandedBadges(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          queryClient={queryClient}
                        />
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {item.itemType !== 'badge' ? (
                          <div className="flex items-center gap-1 border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item, (item.quantity || 1) - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-lg"
                              disabled={updateMutation.isPending}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-medium">{item.quantity || 1}</span>
                            <button
                              onClick={() => updateQuantity(item, (item.quantity || 1) + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-lg"
                              disabled={updateMutation.isPending}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">{item.quantity} badge{item.quantity !== 1 ? 's' : ''}</span>
                        )}
                        
                        <Link 
                          to={item.itemType === 'badge' 
                            ? `${createPageUrl('NameBadgeDesigner')}?designId=${item.design_id}`
                            : `${createPageUrl('DesignTool')}?product=${item.product_type}&width=${item.width}&height=${item.height}&designId=${item.id}`
                          }
                        >
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit Design
                          </Button>
                        </Link>
                        
                        {item.itemType === 'badge' && (
                          <Link to={`${createPageUrl('NameBadgeNames')}?designId=${item.design_id}`}>
                            <Button variant="outline" size="sm" className="h-8">
                              Edit Names
                            </Button>
                          </Link>
                        )}
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                        onClick={() => removeItem(item)}
                        disabled={deleteMutation.isPending || deleteBadgeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    Add ${(99 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
              </div>

              <div className="flex justify-between py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">${total.toFixed(2)}</span>
              </div>

              <Button 
                className="w-full mt-6 bg-[#8BC34A] hover:bg-[#7CB342] text-white h-12 text-lg"
                onClick={() => navigate(createPageUrl('Checkout'))}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>

              <Link to={createPageUrl('RequestQuote')} className="block mt-3">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Request a Quote Instead
                </Button>
              </Link>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Next-day production available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>100% satisfaction guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}