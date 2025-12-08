import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Package, Truck, Download, Printer, FileImage, Clock, CheckCircle,
  MapPin, Phone, Mail, AlertCircle, ExternalLink, Copy, Ship,
  Send, Eye, ZoomIn, X, Loader2, FileDown, Image as ImageIcon,
  MessageSquare, Check, XCircle, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  artwork_review: 'bg-orange-100 text-orange-800',
  proof_sent: 'bg-pink-100 text-pink-800',
  proof_approved: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-purple-100 text-purple-800',
  quality_check: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-amber-100 text-amber-800',
};

const STATUS_FLOW = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'artwork_review', label: 'Artwork Review' },
  { value: 'proof_sent', label: 'Proof Sent' },
  { value: 'proof_approved', label: 'Proof Approved' },
  { value: 'in_production', label: 'In Production' },
  { value: 'quality_check', label: 'QC' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export default function OrderDetailPanel({ order, onUpdate, onClose }) {
  const [editedOrder, setEditedOrder] = useState(order);
  const [activeTab, setActiveTab] = useState('details');
  const [viewingArtwork, setViewingArtwork] = useState(null);
  const [sendingProof, setSendingProof] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofMessage, setProofMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofFileInputRef = React.useRef(null);

  const items = (() => {
    try {
      return order.items_json ? JSON.parse(order.items_json) : (order.items || []);
    } catch { return order.items || []; }
  })();

  const shippingAddress = (() => {
    try {
      return order.shipping_address_json ? JSON.parse(order.shipping_address_json) : (order.shipping_address || {});
    } catch { return order.shipping_address || {}; }
  })();

  const handleStatusChange = (newStatus) => {
    const updates = { status: newStatus };
    
    // Set timestamps based on status
    if (newStatus === 'proof_sent') {
      updates.proof_sent_at = new Date().toISOString();
    } else if (newStatus === 'proof_approved') {
      updates.proof_approved_at = new Date().toISOString();
    } else if (newStatus === 'in_production') {
      updates.production_started_at = new Date().toISOString();
    } else if (newStatus === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    } else if (newStatus === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }
    
    setEditedOrder({ ...editedOrder, ...updates });
  };

  // Convert image URL to base64 for embedding
  const imageUrlToBase64 = async (url) => {
    try {
      if (url.startsWith('data:')) return url;
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Failed to convert image:', err);
      return url;
    }
  };

  // Generate print-ready SVG with embedded images
  const generatePrintFile = async (item, index) => {
    const DPI = 150;
    // Handle badge dimensions if missing (standard 1x3 fallback)
    const width = item.width || (item.size_shape?.includes('1x3') ? 3 : 3);
    const height = item.height || (item.size_shape?.includes('1x3') ? 1 : 1.5);
    
    const widthPx = width * DPI;
    const heightPx = height * DPI;
    
    toast.info('Fetching design data and generating print file...');
    
    try {
      let elements = [];
      
      // Try to get elements from the item directly
      if (item.elements_json) {
        try {
          elements = JSON.parse(item.elements_json);
        } catch (e) { console.error('Error parsing item elements', e); }
      }
      
      // If no elements and it's a badge order (or has a design_id), fetch from NameBadgeDesign
      if (elements.length === 0 && item.design_id) {
        try {
          const designs = await base44.entities.NameBadgeDesign.filter({ id: item.design_id });
          if (designs && designs.length > 0) {
            const design = designs[0];
            if (design.elements_json) {
              elements = JSON.parse(design.elements_json);
              // For badges, we might need to inject specific name data if this is a specific badge in the order
              // But for the general "print file", usually we want the template.
              // If this item represents a specific badge with a name, we should overlay the name.
              // However, the item object here usually comes from the order items list.
              // If it's a "NameBadgeOrder" item, it represents a BATCH.
              // We should probably download a ZIP of all badges or a multi-page PDF, but for now let's get the base design.
            }
          }
        } catch (err) {
          console.error('Failed to fetch badge design:', err);
        }
      }

      if (elements.length === 0 && !item.artwork_url) {
        toast.error('No design elements found. This might be a blank order or upload-only.');
        return;
      }
      
      // Convert all images to base64 first
      const elementsWithBase64 = await Promise.all(
        elements.map(async (el) => {
          if ((el.type === 'image' || el.type === 'clipart') && el.src) {
            const base64Src = await imageUrlToBase64(el.src);
            return { ...el, base64Src };
          }
          return el;
        })
      );

      const elementsContent = elementsWithBase64.map(el => {
        const x = el.x * DPI;
        const y = el.y * DPI;
        const w = el.width * DPI;
        const h = el.height * DPI;
        const rotation = el.rotation || 0;
        const transform = rotation ? `transform="rotate(${rotation} ${x + w/2} ${y + h/2})"` : '';
        
        if (el.type === 'shape') {
          const fill = el.fill || '#3B82F6';
          if (el.shape === 'circle') {
            return `<ellipse cx="${x + w/2}" cy="${y + h/2}" rx="${w/2}" ry="${h/2}" fill="${fill}" ${transform} />`;
          }
          return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${el.shape === 'rounded-rect' ? 12 : 0}" ${transform} />`;
        } else if (el.type === 'text') {
          const fontSize = (el.fontSize || 4) * DPI;
          const fontWeight = el.fontWeight || 'bold';
          const fontFamily = el.fontFamily || 'Arial';
          const textColor = el.color || '#000000';
          const textAlign = el.textAlign || 'center';
          
          let textAnchor = 'middle';
          let textX = x + w / 2;
          if (textAlign === 'left') {
            textAnchor = 'start';
            textX = x + 4;
          } else if (textAlign === 'right') {
            textAnchor = 'end';
            textX = x + w - 4;
          }
          
          const escapedText = (el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<text x="${textX}" y="${y + h/2}" fill="${textColor}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" text-anchor="${textAnchor}" dominant-baseline="middle" ${transform}>${escapedText}</text>`;
        } else if (el.type === 'image' || el.type === 'clipart') {
          const src = el.base64Src || el.src;
          if (src) {
            // Use both xlink:href and href for maximum compatibility (Illustrator needs xlink:href)
            return `<image xlink:href="${src}" href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" ${transform} />`;
          }
        }
        return '';
      }).filter(Boolean).join('\n  ');

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
  <title>Order ${order.order_number} - Item ${index + 1}</title>
  <desc>Print-ready artwork at ${DPI} DPI - ${width}" x ${height}"</desc>
  <rect width="100%" height="100%" fill="white"/>
  ${elementsContent}
</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.order_number}_item${index + 1}_${item.width}x${item.height}_${DPI}dpi.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded print file for Item ${index + 1}`);
    } catch (e) {
      console.error('Error generating print file:', e);
      toast.error('Failed to generate print file');
    }
  };

  const downloadAllArtwork = () => {
    items.forEach((item, i) => {
      setTimeout(() => generatePrintFile(item, i), i * 500);
    });
    toast.success(`Downloading ${items.length} artwork files...`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generatePackingSlip = () => {
    const slip = `
PACKING SLIP
============
Order: ${order.order_number}
Date: ${moment(order.created_date).format('MMM D, YYYY')}

SHIP TO:
${shippingAddress.name || ''}
${shippingAddress.company || ''}
${shippingAddress.street || ''}
${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}
${shippingAddress.phone || ''}

ITEMS:
${items.map((item, i) => `${i + 1}. ${item.product_name || item.product_type} - ${item.width}" x ${item.height}" - Qty: ${item.quantity}`).join('\n')}

Total Items: ${items.reduce((sum, item) => sum + (item.quantity || 1), 0)}
    `.trim();

    const blob = new Blob([slip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing_slip_${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Packing slip downloaded');
  };

  // Upload proof PDF
  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast.error('Please upload a PDF or image file');
      return;
    }
    
    setUploadingProof(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedOrder({ ...editedOrder, proof_pdf_url: file_url });
      toast.success('Proof file uploaded!');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload proof file');
    } finally {
      setUploadingProof(false);
    }
  };

  // Generate proof approval link
  const getProofApprovalLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/ProofApproval?order=${order.id}&token=${editedOrder.proof_token || ''}`;
  };

  // Send proof email to customer
  const sendProofToCustomer = async () => {
    setSendingProof(true);
    
    try {
      const customerEmail = order.customer_email || order.created_by;
      if (!customerEmail) {
        toast.error('No customer email found');
        return;
      }

      // Generate proof token
      const proofToken = `proof_${order.id}_${Date.now()}`;
      const proofLink = `${window.location.origin}/ProofApproval?order=${order.id}&token=${proofToken}`;
      
      // Build proof email content
      const itemsList = items.map((item, i) => 
        `• Item ${i + 1}: ${item.product_name || item.product_type} (${item.width}" x ${item.height}") - Qty: ${item.quantity || 1}`
      ).join('\n');

      const emailBody = `
Hello,

Your order #${order.order_number} is ready for your review!

ORDER DETAILS:
${itemsList}

${proofMessage ? `MESSAGE FROM OUR TEAM:\n${proofMessage}\n` : ''}

Please review your proof at the link below:

${proofLink}

On this page you can:
• View your artwork proof
• APPROVE to move to production
• Request changes if needed

Please review carefully and check:
• All text is spelled correctly
• Colors appear as expected
• Size and dimensions are correct
• All design elements are properly positioned

Thank you for your order!

Best regards,
NetravePrint Production Team
      `.trim();

      await base44.integrations.Core.SendEmail({
        to: customerEmail,
        subject: `Proof Ready for Approval - Order #${order.order_number}`,
        body: emailBody,
      });

      // Update order status
      const updates = {
        ...editedOrder,
        status: 'proof_sent',
        proof_sent_at: new Date().toISOString(),
        proof_token: proofToken,
        proof_notes: proofMessage,
      };
      
      setEditedOrder(updates);
      onUpdate(updates);
      
      setShowProofDialog(false);
      setProofMessage('');
      toast.success('Proof sent to customer!');
    } catch (err) {
      console.error('Failed to send proof:', err);
      toast.error('Failed to send proof email');
    } finally {
      setSendingProof(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedOrder);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Order #{order.order_number}</h2>
            <Badge className={STATUS_COLORS[editedOrder.status]}>
              {editedOrder.status?.replace(/_/g, ' ')}
            </Badge>
            {order.is_rush && (
              <Badge className="bg-red-100 text-red-800 animate-pulse">RUSH</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {moment(order.created_date).format('MMMM D, YYYY [at] h:mm A')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generatePackingSlip}>
            <Printer className="w-4 h-4 mr-2" />
            Packing Slip
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAllArtwork}>
            <Download className="w-4 h-4 mr-2" />
            All Artwork
          </Button>
        </div>
      </div>

      {/* Status Control */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">Order Status</Label>
          <Badge className={STATUS_COLORS[editedOrder.status]}>
            {editedOrder.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
        
        <Select 
          value={editedOrder.status} 
          onValueChange={(value) => handleStatusChange(value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FLOW.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status.value === 'pending' ? 'bg-yellow-500' :
                    status.value === 'paid' ? 'bg-blue-500' :
                    status.value === 'artwork_review' ? 'bg-orange-500' :
                    status.value === 'proof_sent' ? 'bg-pink-500' :
                    status.value === 'proof_approved' ? 'bg-emerald-500' :
                    status.value === 'in_production' ? 'bg-purple-500' :
                    status.value === 'quality_check' ? 'bg-indigo-500' :
                    status.value === 'shipped' ? 'bg-cyan-500' :
                    'bg-green-500'
                  }`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Cancelled
              </div>
            </SelectItem>
            <SelectItem value="on_hold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                On Hold
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {/* Quick Actions for Status */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {editedOrder.status === 'artwork_review' && (
            <Button 
              size="sm" 
              onClick={() => setShowProofDialog(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Proof to Customer
            </Button>
          )}
          {editedOrder.status === 'proof_sent' && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('proof_approved')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark Approved
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStatusChange('artwork_review')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Needs Revisions
              </Button>
            </>
          )}
          {editedOrder.status === 'proof_approved' && (
            <Button 
              size="sm" 
              onClick={() => handleStatusChange('in_production')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Start Production
            </Button>
          )}
          {editedOrder.status === 'in_production' && (
            <Button 
              size="sm" 
              onClick={() => handleStatusChange('quality_check')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Move to QC
            </Button>
          )}
          {editedOrder.status === 'quality_check' && (
            <Button 
              size="sm" 
              onClick={() => handleStatusChange('shipped')}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Truck className="w-4 h-4 mr-2" />
              Mark Shipped
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="artwork">Artwork</TabsTrigger>
          <TabsTrigger value="proofing">Proofing</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {/* Customer Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{shippingAddress.name}</p>
                {shippingAddress.company && <p>{shippingAddress.company}</p>}
                <p>{shippingAddress.street}</p>
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                {shippingAddress.phone && (
                  <p className="flex items-center gap-2 mt-2">
                    <Phone className="w-3 h-3" /> {shippingAddress.phone}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => copyToClipboard(`${shippingAddress.name}\n${shippingAddress.street}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}`)}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy Address
              </Button>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Customer
              </h3>
              <div className="text-sm space-y-2">
                <p className="font-medium">{order.created_by || order.customer_email || 'Guest'}</p>
                {order.customer_phone && <p>{order.customer_phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Items Summary */}
          <div>
            <h3 className="font-medium mb-3">Order Items ({items.length})</h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
                  <div 
                    className="w-24 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 ring-blue-500 transition-all"
                    onClick={() => setViewingArtwork({ item, index: i })}
                  >
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name || item.product_type}</p>
                    <p className="text-sm text-gray-500">
                      {item.width}" × {item.height}" • Qty: {item.quantity || 1}
                    </p>
                    {item.material && <p className="text-sm text-gray-500">{item.material}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.line_total || item.unit_price || 0).toFixed(2)}</p>
                    <div className="flex gap-1 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewingArtwork({ item, index: i })}
                        className="text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => generatePrintFile(item, i)}
                        className="text-green-600"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({order.shipping_method || 'Standard'})</span>
                <span>${(order.shipping_cost || 0).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.rush_fee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Rush Fee</span>
                  <span>${order.rush_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Artwork Tab */}
        <TabsContent value="artwork" className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <FileImage className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Production Files</p>
              <p className="text-sm text-blue-700 mt-1">
                Click on any artwork to view larger. Download individual files or all at once for production.
                Files are generated at 150 DPI for print quality.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item, i) => {
              const hasElements = item.elements_json && JSON.parse(item.elements_json || '[]').length > 0;
              const hasArtwork = item.artwork_url || hasElements;
              
              return (
                <div key={i} className="bg-white border rounded-xl overflow-hidden">
                  {/* Large Preview */}
                  <div 
                    className="aspect-video bg-gray-100 flex items-center justify-center cursor-pointer group relative"
                    onClick={() => setViewingArtwork({ item, index: i })}
                  >
                    {item.thumbnail_url ? (
                      <>
                        <img src={item.thumbnail_url} alt="" className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : item.artwork_url ? (
                      <>
                        <img src={item.artwork_url} alt="" className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>No preview available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Item Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Item {i + 1}: {item.product_name || item.product_type}</h4>
                        <p className="text-sm text-gray-500">{item.width}" × {item.height}" • Qty: {item.quantity || 1}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge>{item.material || 'Standard'}</Badge>
                        {hasElements && (
                          <Badge className="bg-green-100 text-green-800">Has Design Data</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Print Resolution:</span>
                        <span className="ml-1 font-medium">150 DPI</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Output Size:</span>
                        <span className="ml-1 font-medium">{(item.width * 150).toFixed(0)} × {(item.height * 150).toFixed(0)} px</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => generatePrintFile(item, i)}
                        disabled={!hasArtwork}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download SVG
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setViewingArtwork({ item, index: i })}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {!hasArtwork && (
                      <p className="text-xs text-red-500 mt-2">
                        No design data found. Customer may have uploaded artwork file directly.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Proofing Tab */}
        <TabsContent value="proofing" className="space-y-6">
          {/* Proofing Status */}
          <div className={`rounded-lg p-4 flex items-start gap-3 ${
            editedOrder.status === 'proof_approved' ? 'bg-green-50 border border-green-200' :
            editedOrder.status === 'proof_sent' ? 'bg-pink-50 border border-pink-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            {editedOrder.status === 'proof_approved' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Proof Approved by Customer</p>
                  <p className="text-sm text-green-700 mt-1">
                    Approved on {moment(editedOrder.proof_approved_at).format('MMM D, YYYY [at] h:mm A')}
                  </p>
                </div>
              </>
            ) : editedOrder.status === 'proof_sent' ? (
              <>
                <Clock className="w-5 h-5 text-pink-600 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-medium text-pink-800">Waiting for Customer Approval</p>
                  <p className="text-sm text-pink-700 mt-1">
                    Proof sent on {moment(editedOrder.proof_sent_at).format('MMM D, YYYY [at] h:mm A')}
                  </p>
                  {editedOrder.proof_notes && (
                    <p className="text-sm text-pink-600 mt-2 italic">Note: {editedOrder.proof_notes}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Proof Not Sent Yet</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload a PDF proof and send to customer for approval before production.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Upload Proof PDF */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium mb-3">Proof File (PDF or Image)</h4>
            {editedOrder.proof_pdf_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileDown className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Proof file uploaded</p>
                    <a 
                      href={editedOrder.proof_pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline"
                    >
                      View/Download Proof
                    </a>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditedOrder({ ...editedOrder, proof_pdf_url: '' })}
                  >
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleProofUpload}
                />
                <Button 
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => proofFileInputRef.current?.click()}
                  disabled={uploadingProof}
                >
                  {uploadingProof ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <FileDown className="w-5 h-5 mr-2" />
                  )}
                  {uploadingProof ? 'Uploading...' : 'Upload Proof PDF or Image'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Upload a print-ready PDF proof for customer approval
                </p>
              </div>
            )}
          </div>

          {/* Proof Approval Link */}
          {editedOrder.proof_token && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Customer Proof Approval Link</h4>
              <div className="flex gap-2">
                <Input 
                  value={getProofApprovalLink()}
                  readOnly
                  className="bg-white text-sm"
                />
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getProofApprovalLink())}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getProofApprovalLink(), '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Send Proof Button */}
          {!['proof_sent', 'proof_approved', 'in_production', 'shipped', 'delivered'].includes(editedOrder.status) && (
            <Button 
              className="w-full bg-pink-600 hover:bg-pink-700 h-12"
              onClick={() => setShowProofDialog(true)}
            >
              <Send className="w-5 h-5 mr-2" />
              Send Proof to Customer
            </Button>
          )}

          {/* Resend Proof (for proof_sent status) */}
          {editedOrder.status === 'proof_sent' && (
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setShowProofDialog(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Resend Proof Email
            </Button>
          )}

          {/* Revision Requests */}
          {editedOrder.proof_revision_requests && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Customer Revision Requests
              </h4>
              <p className="text-sm text-yellow-700 whitespace-pre-wrap">{editedOrder.proof_revision_requests}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-3"
                onClick={() => setEditedOrder({ ...editedOrder, proof_revision_requests: '' })}
              >
                Clear Revision Requests
              </Button>
            </div>
          )}

          {/* Proofing Timeline */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-4">Proofing Timeline</h4>
            <div className="space-y-4">
              <TimelineItem 
                label="Artwork Uploaded" 
                date={order.created_date} 
                completed={true} 
              />
              <TimelineItem 
                label="Proof Sent to Customer" 
                date={editedOrder.proof_sent_at} 
                completed={!!editedOrder.proof_sent_at} 
              />
              <TimelineItem 
                label="Proof Approved" 
                date={editedOrder.proof_approved_at} 
                completed={!!editedOrder.proof_approved_at} 
              />
              <TimelineItem 
                label="Production Started" 
                date={editedOrder.production_started_at} 
                completed={!!editedOrder.production_started_at} 
              />
            </div>
          </div>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Carrier</Label>
              <Select 
                value={editedOrder.carrier || ''} 
                onValueChange={(v) => setEditedOrder({ ...editedOrder, carrier: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tracking Number</Label>
              <Input
                className="mt-1"
                value={editedOrder.tracking_number || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, tracking_number: e.target.value })}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label>Tracking URL</Label>
              <Input
                className="mt-1"
                value={editedOrder.tracking_url || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, tracking_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Estimated Delivery</Label>
              <Input
                type="date"
                className="mt-1"
                value={editedOrder.estimated_delivery || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, estimated_delivery: e.target.value })}
              />
            </div>
            <div>
              <Label>Package Weight (oz)</Label>
              <Input
                type="number"
                className="mt-1"
                value={editedOrder.weight_oz || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, weight_oz: Number(e.target.value) })}
                placeholder="16"
              />
            </div>
            <div>
              <Label>Package Dimensions (L×W×H)</Label>
              <Input
                className="mt-1"
                value={editedOrder.package_dimensions || ''}
                onChange={(e) => setEditedOrder({ ...editedOrder, package_dimensions: e.target.value })}
                placeholder="12x8x2"
              />
            </div>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <div>
            <Label>Customer Notes</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={editedOrder.notes || ''}
              onChange={(e) => setEditedOrder({ ...editedOrder, notes: e.target.value })}
              placeholder="Notes from the customer..."
            />
          </div>
          <div>
            <Label>Internal Notes (Not visible to customer)</Label>
            <Textarea
              className="mt-1"
              rows={4}
              value={editedOrder.internal_notes || ''}
              onChange={(e) => setEditedOrder({ ...editedOrder, internal_notes: e.target.value })}
              placeholder="Internal production notes..."
            />
          </div>

          {/* Full Timeline */}
          <div>
            <Label className="mb-3 block">Order Timeline</Label>
            <div className="space-y-3">
              <TimelineItem label="Order Placed" date={order.created_date} completed={true} />
              <TimelineItem label="Payment Received" date={order.payment_status === 'paid' ? order.updated_date : null} completed={order.payment_status === 'paid'} />
              <TimelineItem label="Proof Sent" date={editedOrder.proof_sent_at} completed={!!editedOrder.proof_sent_at} />
              <TimelineItem label="Proof Approved" date={editedOrder.proof_approved_at} completed={!!editedOrder.proof_approved_at} />
              <TimelineItem label="Production Started" date={editedOrder.production_started_at} completed={!!editedOrder.production_started_at} />
              <TimelineItem label="Shipped" date={editedOrder.shipped_at} completed={!!editedOrder.shipped_at} />
              <TimelineItem label="Delivered" date={editedOrder.delivered_at} completed={!!editedOrder.delivered_at} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#8BC34A] hover:bg-[#7CB342]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      {/* Artwork Viewer Modal */}
      {viewingArtwork && (
        <Dialog open={true} onOpenChange={() => setViewingArtwork(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                Item {viewingArtwork.index + 1}: {viewingArtwork.item.product_name || viewingArtwork.item.product_type}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="bg-gray-100 rounded-lg p-4 max-h-[60vh] overflow-auto">
                {viewingArtwork.item.thumbnail_url ? (
                  <img 
                    src={viewingArtwork.item.thumbnail_url} 
                    alt="" 
                    className="max-w-full max-h-full object-contain"
                    style={{ minWidth: '400px' }}
                  />
                ) : (
                  <div className="w-96 h-64 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {viewingArtwork.item.width}" × {viewingArtwork.item.height}" • Qty: {viewingArtwork.item.quantity || 1}
                </p>
                <p className="text-sm text-gray-500">{viewingArtwork.item.material || 'Standard Material'}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingArtwork(null)}>Close</Button>
              <Button 
                onClick={() => generatePrintFile(viewingArtwork.item, viewingArtwork.index)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Print File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proof to Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                An email will be sent to <strong>{order.customer_email || order.created_by}</strong> with the artwork proof.
                The customer can approve or request changes.
              </p>
            </div>
            
            <div>
              <Label>Message to Customer (optional)</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={proofMessage}
                onChange={(e) => setProofMessage(e.target.value)}
                placeholder="Add any notes about the proof, special instructions, or questions for the customer..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Items included:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-1">
                {items.map((item, i) => (
                  <li key={i}>• {item.product_name || item.product_type} ({item.width}" × {item.height}")</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProofDialog(false)}>Cancel</Button>
            <Button 
              onClick={sendProofToCustomer}
              disabled={sendingProof}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {sendingProof ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimelineItem({ label, date, completed }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div className="flex-1">
        <span className={completed ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
      </div>
      {date && (
        <span className="text-sm text-gray-500">
          {moment(date).format('MMM D, h:mm A')}
        </span>
      )}
    </div>
  );
}