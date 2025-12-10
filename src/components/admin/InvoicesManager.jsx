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
  Search, Eye, Send, CheckCircle, Loader2, FileText, DollarSign,
  Plus, Receipt, CreditCard, Mail, Download, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

const PAYMENT_METHODS = [
  { value: 'pending', label: 'Pending' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Other' },
];

export default function InvoicesManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders-for-invoices'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Invoice created');
      setShowCreateDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Invoice updated');
    },
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Find orders without invoices for quick invoice creation
  const uninvoicedOrders = orders.filter(order => 
    order.payment_status === 'pending' && 
    !invoices.some(inv => inv.order_id === order.id)
  );

  const openEditDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setEditedInvoice({ ...invoice });
    setShowEditDialog(true);
  };

  const handleCreateFromOrder = (order) => {
    const invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase();
    
    createMutation.mutate({
      invoice_number: invoiceNumber,
      order_id: order.id,
      status: 'draft',
      customer_email: order.customer_email || order.created_by,
      customer_name: order.shipping_address_json ? JSON.parse(order.shipping_address_json).name : '',
      items_json: order.items_json,
      subtotal: order.subtotal,
      tax: order.tax || 0,
      shipping: order.shipping_cost || 0,
      discount: order.discount || 0,
      total: order.total,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: selectedInvoice.id,
      data: editedInvoice,
    });
    setShowEditDialog(false);
  };

  const handleMarkPaid = async () => {
    await base44.entities.Invoice.update(selectedInvoice.id, {
      ...editedInvoice,
      status: 'paid',
      amount_paid: editedInvoice.total,
      paid_at: new Date().toISOString(),
    });

    // Also update the related order if exists
    if (editedInvoice.order_id) {
      await base44.entities.Order.update(editedInvoice.order_id, {
        payment_status: 'paid',
        status: 'paid',
      });
    }

    queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    toast.success('Invoice marked as paid');
    setShowEditDialog(false);
  };

  const handleSendInvoice = async () => {
    setIsSending(true);
    try {
      await base44.entities.Invoice.update(selectedInvoice.id, {
        ...editedInvoice,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      // Parse items for email
      const items = editedInvoice.items_json ? JSON.parse(editedInvoice.items_json) : [];
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name || item.name || item.type}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.unit_price || 0).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.line_total || item.total || 0).toFixed(2)}</td>
        </tr>
      `).join('');

      await base44.integrations.Core.SendEmail({
        to: editedInvoice.customer_email,
        subject: `Invoice ${editedInvoice.invoice_number} from NetravePrint`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Invoice</h2>
            <p>Hi ${editedInvoice.customer_name || 'Customer'},</p>
            <p>Please find your invoice details below:</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice #:</strong> ${editedInvoice.invoice_number}</p>
              <p><strong>Due Date:</strong> ${format(new Date(editedInvoice.due_date), 'MMMM d, yyyy')}</p>
              <p><strong>Amount Due:</strong> <span style="font-size: 1.5em; color: #2196F3;">$${(editedInvoice.total || 0).toFixed(2)}</span></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #333; color: white;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: left;">Qty</th>
                  <th style="padding: 10px; text-align: left;">Price</th>
                  <th style="padding: 10px; text-align: left;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin: 20px 0;">
              <p>Subtotal: $${(editedInvoice.subtotal || 0).toFixed(2)}</p>
              ${editedInvoice.discount > 0 ? `<p>Discount: -$${editedInvoice.discount.toFixed(2)}</p>` : ''}
              <p>Shipping: $${(editedInvoice.shipping || 0).toFixed(2)}</p>
              ${editedInvoice.tax > 0 ? `<p>Tax: $${editedInvoice.tax.toFixed(2)}</p>` : ''}
              <p style="font-size: 1.3em;"><strong>Total Due: $${(editedInvoice.total || 0).toFixed(2)}</strong></p>
            </div>

            <h3>Payment Options:</h3>
            <ul>
              <li>Credit Card - Reply to this email or call us</li>
              <li>Check - Make payable to "NetravePrint" and mail to our address</li>
              <li>Wire Transfer - Contact us for details</li>
            </ul>

            ${editedInvoice.notes ? `<p><strong>Notes:</strong> ${editedInvoice.notes}</p>` : ''}

            <p>Questions? Reply to this email or call 1-888-222-4929</p>
            
            <p>Thank you for your business!</p>
          </div>
        `,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success('Invoice sent to customer');
      setShowEditDialog(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  const getItems = (invoice) => {
    try {
      return invoice.items_json ? JSON.parse(invoice.items_json) : [];
    } catch { return []; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions - Create from uninvoiced orders */}
      {uninvoicedOrders.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {uninvoicedOrders.length} order(s) pending payment - create invoices:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uninvoicedOrders.slice(0, 5).map((order) => (
              <Button
                key={order.id}
                size="sm"
                variant="outline"
                onClick={() => handleCreateFromOrder(order)}
                className="bg-white"
              >
                <Plus className="w-3 h-3 mr-1" />
                #{order.order_number} - ${(order.total || 0).toFixed(2)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => {
                const isOverdue = invoice.status === 'sent' && isBefore(new Date(invoice.due_date), new Date());
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{invoice.invoice_number}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium">{invoice.customer_name || 'Customer'}</p>
                        <p className="text-sm text-gray-500">{invoice.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">${(invoice.total || 0).toFixed(2)}</p>
                      {invoice.amount_paid > 0 && invoice.amount_paid < invoice.total && (
                        <p className="text-xs text-green-600">Paid: ${invoice.amount_paid.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={STATUS_COLORS[isOverdue ? 'overdue' : invoice.status]}>
                        {isOverdue ? 'overdue' : invoice.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(invoice)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Invoice {selectedInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>

          {editedInvoice && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge className={STATUS_COLORS[editedInvoice.status]}>
                  {editedInvoice.status}
                </Badge>
                {editedInvoice.order_id && (
                  <span className="text-sm text-gray-500">
                    Linked to order
                  </span>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={editedInvoice.customer_name || ''}
                    onChange={(e) => setEditedInvoice({ ...editedInvoice, customer_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <Input
                    value={editedInvoice.customer_email || ''}
                    onChange={(e) => setEditedInvoice({ ...editedInvoice, customer_email: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <Label>Invoice Items</Label>
                <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {getItems(editedInvoice).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium">{item.product_name || item.name || item.type}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.line_total || item.total || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(editedInvoice.subtotal || 0).toFixed(2)}</span>
                </div>
                {editedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${editedInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${(editedInvoice.shipping || 0).toFixed(2)}</span>
                </div>
                {editedInvoice.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${editedInvoice.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${(editedInvoice.total || 0).toFixed(2)}</span>
                </div>
                {editedInvoice.amount_paid > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>${editedInvoice.amount_paid.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Payment Info (for marking as paid) */}
              {editedInvoice.status !== 'paid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={editedInvoice.payment_method || 'pending'}
                      onValueChange={(value) => setEditedInvoice({ ...editedInvoice, payment_method: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Reference</Label>
                    <Input
                      value={editedInvoice.payment_reference || ''}
                      onChange={(e) => setEditedInvoice({ ...editedInvoice, payment_reference: e.target.value })}
                      placeholder="Check #, Transaction ID..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editedInvoice.due_date?.split('T')[0] || ''}
                  onChange={(e) => setEditedInvoice({ ...editedInvoice, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editedInvoice.notes || ''}
                  onChange={(e) => setEditedInvoice({ ...editedInvoice, notes: e.target.value })}
                  placeholder="Payment terms, notes to customer..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Save Changes
            </Button>
            {editedInvoice?.status === 'draft' && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSendInvoice}
                disabled={isSending}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Invoice
              </Button>
            )}
            {editedInvoice?.status !== 'paid' && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleMarkPaid}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}