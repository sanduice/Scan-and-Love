import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Search, Eye, Send, CheckCircle, XCircle, Clock, Loader2,
  FileText, DollarSign, Percent, Mail, Package, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

export default function QuotesManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editedQuote, setEditedQuote] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Quote updated');
    },
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !searchQuery ||
      quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openEditDialog = (quote) => {
    setSelectedQuote(quote);
    setEditedQuote({
      ...quote,
      discount: quote.discount || 0,
      discount_reason: quote.discount_reason || '',
      shipping_estimate: quote.shipping_estimate || 0,
      admin_notes: quote.admin_notes || '',
    });
    setShowEditDialog(true);
  };

  const calculateTotal = () => {
    if (!editedQuote) return 0;
    return (editedQuote.subtotal || 0) - (editedQuote.discount || 0) + (editedQuote.shipping_estimate || 0);
  };

  const handleSave = () => {
    const total = calculateTotal();
    updateMutation.mutate({
      id: selectedQuote.id,
      data: {
        ...editedQuote,
        total,
      },
    });
    setShowEditDialog(false);
  };

  const handleSendQuote = async () => {
    setIsSending(true);
    try {
      const total = calculateTotal();
      
      // Update quote status
      await base44.entities.Quote.update(selectedQuote.id, {
        ...editedQuote,
        total,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Parse items for email
      const items = editedQuote.items_json ? JSON.parse(editedQuote.items_json) : [];
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || item.type}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.unit_price || 0).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.total || 0).toFixed(2)}</td>
        </tr>
      `).join('');

      // Send quote email to customer
      await base44.integrations.Core.SendEmail({
        to: editedQuote.customer_email,
        subject: `Your Quote from NetravePrint - ${editedQuote.quote_number}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your Quote is Ready!</h2>
            <p>Hi ${editedQuote.customer_name},</p>
            <p>Thank you for your interest in NetravePrint. Here's your customized quote:</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Quote #:</strong> ${editedQuote.quote_number}</p>
              <p><strong>Valid Until:</strong> ${moment(editedQuote.valid_until).format('MMMM D, YYYY')}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #333; color: white;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: left;">Qty</th>
                  <th style="padding: 10px; text-align: left;">Unit Price</th>
                  <th style="padding: 10px; text-align: left;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin: 20px 0;">
              <p><strong>Subtotal:</strong> $${(editedQuote.subtotal || 0).toFixed(2)}</p>
              ${editedQuote.discount > 0 ? `<p style="color: green;"><strong>Discount:</strong> -$${editedQuote.discount.toFixed(2)} ${editedQuote.discount_reason ? `(${editedQuote.discount_reason})` : ''}</p>` : ''}
              <p><strong>Shipping:</strong> $${(editedQuote.shipping_estimate || 0).toFixed(2)}</p>
              <p style="font-size: 1.2em;"><strong>Total:</strong> $${total.toFixed(2)}</p>
            </div>

            <p>To proceed with this order, simply reply to this email or call us at 1-888-222-4929.</p>
            
            <p>This quote is valid for 30 days. Don't hesitate to reach out if you have any questions!</p>
            
            <p>Best regards,<br>The NetravePrint Team</p>
          </div>
        `,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      toast.success('Quote sent to customer!');
      setShowEditDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send quote');
    } finally {
      setIsSending(false);
    }
  };

  const handleConvertToOrder = async (quote) => {
    try {
      const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();
      
      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        items_json: quote.items_json,
        subtotal: quote.subtotal,
        shipping_cost: quote.shipping_estimate || 0,
        discount: quote.discount || 0,
        total: quote.total,
        customer_email: quote.customer_email,
        notes: `Converted from Quote ${quote.quote_number}`,
      });

      await base44.entities.Quote.update(quote.id, {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        converted_order_id: order.id,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Converted to Order ${orderNumber}`);
    } catch (err) {
      toast.error('Failed to convert quote');
    }
  };

  const getItems = (quote) => {
    try {
      return quote.items_json ? JSON.parse(quote.items_json) : [];
    } catch { return []; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Quote Requests</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search quotes..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No quotes found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium">{quote.quote_number}</td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{quote.customer_name}</p>
                      <p className="text-sm text-gray-500">{quote.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">{getItems(quote).length} items</td>
                  <td className="px-4 py-4 font-medium">${(quote.total || quote.subtotal || 0).toFixed(2)}</td>
                  <td className="px-4 py-4">
                    <Badge className={STATUS_COLORS[quote.status]}>
                      {quote.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {moment(quote.created_date).format('MMM D, YYYY')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(quote)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {quote.status === 'sent' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600"
                          onClick={() => handleConvertToOrder(quote)}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Convert
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quote Edit/View Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quote {selectedQuote?.quote_number}
            </DialogTitle>
          </DialogHeader>

          {editedQuote && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-500">Customer</Label>
                  <p className="font-medium">{editedQuote.customer_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium">{editedQuote.customer_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p>{editedQuote.customer_phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Company</Label>
                  <p>{editedQuote.customer_company || 'Not provided'}</p>
                </div>
              </div>

              {/* Customer Notes */}
              {editedQuote.notes && (
                <div>
                  <Label>Customer Notes</Label>
                  <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    {editedQuote.notes}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <Label>Quote Items</Label>
                <div className="mt-2 border rounded-lg divide-y">
                  {getItems(editedQuote).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      {item.thumbnail_url && (
                        <img src={item.thumbnail_url} alt="" className="w-12 h-12 object-contain rounded bg-gray-100" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name || item.type}</p>
                        <p className="text-sm text-gray-500">
                          {item.product_type && `${item.width}" × ${item.height}" • `}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.total || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">${(item.unit_price || 0).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Discount ($)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedQuote.discount}
                    onChange={(e) => setEditedQuote({ ...editedQuote, discount: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Discount Reason</Label>
                  <Input
                    value={editedQuote.discount_reason}
                    onChange={(e) => setEditedQuote({ ...editedQuote, discount_reason: e.target.value })}
                    placeholder="Volume discount, promo code..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Shipping Estimate ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editedQuote.shipping_estimate}
                  onChange={(e) => setEditedQuote({ ...editedQuote, shipping_estimate: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(editedQuote.subtotal || 0).toFixed(2)}</span>
                </div>
                {editedQuote.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${editedQuote.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${(editedQuote.shipping_estimate || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={editedQuote.admin_notes}
                  onChange={(e) => setEditedQuote({ ...editedQuote, admin_notes: e.target.value })}
                  placeholder="Notes for internal use only..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Save Changes
            </Button>
            {editedQuote?.status === 'pending' && (
              <Button 
                className="bg-[#8BC34A] hover:bg-[#7CB342]"
                onClick={handleSendQuote}
                disabled={isSending}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Quote to Customer
              </Button>
            )}
            {editedQuote?.status === 'sent' && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleConvertToOrder(editedQuote)}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Convert to Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}