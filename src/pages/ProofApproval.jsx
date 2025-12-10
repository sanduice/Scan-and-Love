import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, XCircle, AlertCircle, Package, Download, 
  Loader2, MessageSquare, Eye, ZoomIn, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProofApproval() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const orderId = urlParams.get('order');
  
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null); // 'approve' | 'revise'
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [viewingItem, setViewingItem] = useState(0);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    if (!orderId || !token) {
      setError('Invalid proof link. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      const orders = await base44.entities.Order.filter({ id: orderId });
      if (orders.length === 0) {
        setError('Order not found. Please contact support.');
        setLoading(false);
        return;
      }

      const foundOrder = orders[0];
      
      // Verify token matches
      if (foundOrder.proof_token !== token) {
        setError('Invalid or expired proof link. Please contact support for a new link.');
        setLoading(false);
        return;
      }

      // Check if already approved
      if (foundOrder.status === 'proof_approved') {
        setSubmitted(true);
        setAction('approve');
      }

      setOrder(foundOrder);
      
      // Parse items
      try {
        const parsedItems = foundOrder.items_json ? JSON.parse(foundOrder.items_json) : [];
        setItems(parsedItems);
      } catch (e) {
        setItems([]);
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Unable to load proof. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await base44.entities.Order.update(order.id, {
        status: 'proof_approved',
        proof_approved_at: new Date().toISOString(),
      });

      // Send notification email to admin
      await base44.integrations.Core.SendEmail({
        to: 'support@netraveprint.com', // or order.created_by for admin
        subject: `Proof APPROVED - Order #${order.order_number}`,
        body: `
Customer has APPROVED the proof for Order #${order.order_number}.

Order is ready to move to production.

Customer: ${order.customer_email || order.created_by}
Approved at: ${new Date().toLocaleString()}
        `.trim(),
      });

      setSubmitted(true);
      setAction('approve');
      toast.success('Proof approved! Your order will move to production.');
    } catch (err) {
      console.error('Error approving proof:', err);
      toast.error('Failed to submit approval. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevisions = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please describe the changes you need.');
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Order.update(order.id, {
        status: 'artwork_review',
        proof_revision_requests: revisionNotes,
      });

      // Send notification email to admin
      await base44.integrations.Core.SendEmail({
        to: 'support@netraveprint.com',
        subject: `Revision Request - Order #${order.order_number}`,
        body: `
Customer has requested REVISIONS for Order #${order.order_number}.

REVISION REQUESTS:
${revisionNotes}

Customer: ${order.customer_email || order.created_by}
Requested at: ${new Date().toLocaleString()}

Please update the artwork and send a new proof.
        `.trim(),
      });

      setSubmitted(true);
      setAction('revise');
      toast.success('Revision request submitted. We will update your proof and send a new one.');
    } catch (err) {
      console.error('Error submitting revision:', err);
      toast.error('Failed to submit revision request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your proof...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proof Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="mailto:support@netraveprint.com" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {action === 'approve' ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Proof Approved!</h1>
              <p className="text-gray-600 mb-6">
                Thank you! Your order #{order?.order_number} has been approved and will move to production.
                We'll send you a shipping confirmation once it's on its way.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Revision Request Received</h1>
              <p className="text-gray-600 mb-6">
                We've received your revision requests for order #{order?.order_number}. 
                Our team will update your artwork and send you a new proof to review.
              </p>
            </>
          )}
          <Badge className="bg-gray-100 text-gray-800">Order #{order?.order_number}</Badge>
        </div>
      </div>
    );
  }

  const currentItem = items[viewingItem];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2196F3] to-[#1976D2] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Proof Review</h1>
                <p className="text-sm text-gray-500">Order #{order?.order_number}</p>
              </div>
            </div>
            <Badge className="bg-pink-100 text-pink-800">
              Awaiting Your Approval
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Artwork Preview - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-medium text-blue-900 mb-2">Please Review Your Proof Carefully</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check all text for spelling and accuracy</li>
                <li>• Verify colors appear as expected</li>
                <li>• Confirm size and dimensions are correct</li>
                <li>• Ensure all design elements are properly positioned</li>
              </ul>
            </div>

            {/* Main Artwork Viewer */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    Item {viewingItem + 1} of {items.length}: {currentItem?.product_name || currentItem?.product_type || 'Custom Design'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentItem?.width}" × {currentItem?.height}" • Qty: {currentItem?.quantity || 1}
                  </p>
                </div>
                {items.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingItem(Math.max(0, viewingItem - 1))}
                      disabled={viewingItem === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">{viewingItem + 1}/{items.length}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingItem(Math.min(items.length - 1, viewingItem + 1))}
                      disabled={viewingItem === items.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Artwork Display */}
              <div className="bg-gray-100 p-8 flex items-center justify-center min-h-[400px]">
                {/* Check for PDF proof first */}
                {order.proof_pdf_url ? (
                  <div className="w-full">
                    <iframe 
                      src={order.proof_pdf_url}
                      className="w-full h-[500px] rounded-lg border"
                      title="Proof PDF"
                    />
                    <div className="mt-4 text-center">
                      <a 
                        href={order.proof_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download PDF Proof
                      </a>
                    </div>
                  </div>
                ) : currentItem?.thumbnail_url ? (
                  <div className="relative bg-white rounded-lg shadow-lg p-4">
                    <img 
                      src={currentItem.thumbnail_url} 
                      alt="Artwork proof" 
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4" />
                    <p>Proof image not available</p>
                    <p className="text-sm mt-2">Please contact support</p>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <span className="ml-2 font-medium">{currentItem?.width}" × {currentItem?.height}"</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-2 font-medium">{currentItem?.quantity || 1}</span>
                  </div>
                  {currentItem?.material && (
                    <div>
                      <span className="text-gray-500">Material:</span>
                      <span className="ml-2 font-medium">{currentItem.material}</span>
                    </div>
                  )}
                  {currentItem?.finish && (
                    <div>
                      <span className="text-gray-500">Finish:</span>
                      <span className="ml-2 font-medium">{currentItem.finish}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes from Production Team */}
            {order?.proof_notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Note from Our Team:</h4>
                <p className="text-yellow-800">{order.proof_notes}</p>
              </div>
            )}
          </div>

          {/* Approval Panel - 1 col */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Number:</span>
                  <span className="font-medium">#{order?.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Proof Sent:</span>
                  <span className="font-medium">
                    {order?.proof_sent_at ? format(new Date(order.proof_sent_at), 'MMM d, yyyy') : '-'}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">${(order?.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Decision</h3>
              
              {/* Approve Button */}
              <Button 
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg mb-4"
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                Approve & Start Production
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Request Revisions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Need Changes?</h4>
                <Textarea
                  placeholder="Describe the changes you need (e.g., fix spelling, adjust colors, move elements...)"
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="resize-none"
                />
                <Button 
                  variant="outline"
                  className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  onClick={handleRequestRevisions}
                  disabled={submitting || !revisionNotes.trim()}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Request Revisions
                </Button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Questions about your proof?</p>
              <a 
                href="mailto:support@netraveprint.com" 
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}