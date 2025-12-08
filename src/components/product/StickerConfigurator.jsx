import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Loader2, Check, ZoomIn, ZoomOut, RotateCcw, Sparkles, 
  AlertCircle, QrCode, ArrowRight, ExternalLink, Scissors
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Pricing logic adapted from StickerBuilder
const PRICING = {
  'die-cut': { 50: 117, 100: 174, 200: 274, 300: 364, 500: 530, 1000: 900, 2500: 2141, 5000: 3240 },
  'kiss-cut': { 50: 99, 100: 149, 200: 229, 300: 299, 500: 449, 1000: 799, 2500: 1899, 5000: 2999 },
  'clear': { 50: 129, 100: 189, 200: 299, 300: 399, 500: 589, 1000: 999, 2500: 2399, 5000: 3699 },
  'holographic': { 50: 149, 100: 219, 200: 349, 300: 469, 500: 699, 1000: 1199, 2500: 2799, 5000: 4299 },
  'default': { 50: 117, 100: 174, 200: 274, 300: 364, 500: 530, 1000: 900, 2500: 2141, 5000: 3240 },
};

const MATERIALS = [
  { id: 'white-vinyl', name: 'White Vinyl', desc: 'Classic matte finish', price: 0, color: 'bg-white border-2 border-gray-300' },
  { id: 'clear-vinyl', name: 'Clear Vinyl', desc: 'Transparent background', price: 0.15, color: 'bg-gradient-to-br from-white/60 to-gray-200/60 border-dashed' },
  { id: 'holographic', name: 'Holographic', desc: 'Rainbow shimmer', price: 0.25, color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300' },
  { id: 'glossy', name: 'Glossy', desc: 'High shine finish', price: 0.05, color: 'bg-white border-2 border-gray-300 shadow-inner' },
];

export default function StickerConfigurator({ product }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State
  const [size, setSize] = useState('3x3');
  const [customWidth, setCustomWidth] = useState(3);
  const [customHeight, setCustomHeight] = useState(3);
  const [quantity, setQuantity] = useState(50);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dieCutPath, setDieCutPath] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [material, setMaterial] = useState('white-vinyl');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Determine base pricing key
  const pricingKey = Object.keys(PRICING).find(k => product.slug?.includes(k)) || 'default';
  const basePricing = PRICING[pricingKey];

  // Calculate Price
  const calculatePrice = () => {
    let w = size === 'custom' ? customWidth : parseFloat(size.split('x')[0]);
    let h = size === 'custom' ? customHeight : parseFloat(size.split('x')[1]);
    
    // Base calculation (approximated from 3x3 baseline)
    const sqIn = w * h;
    const baseSqIn = 9; // 3x3
    
    // Find closest quantity tier
    const tiers = Object.keys(basePricing).map(Number).sort((a, b) => a - b);
    let tierPrice = basePricing[tiers[0]];
    
    // Simple interpolation/lookup
    if (quantity <= tiers[0]) {
      tierPrice = basePricing[tiers[0]] * (quantity / tiers[0]);
    } else {
      // Find brackets
      let lower = tiers[0];
      let upper = tiers[tiers.length-1];
      for(let i=0; i<tiers.length-1; i++) {
        if (quantity >= tiers[i] && quantity < tiers[i+1]) {
          lower = tiers[i];
          upper = tiers[i+1];
          break;
        }
      }
      
      if (quantity >= upper) {
        const unit = basePricing[upper] / upper;
        tierPrice = unit * quantity * 0.9; // Bulk discount
      } else {
        const lowerPrice = basePricing[lower];
        const upperPrice = basePricing[upper];
        const ratio = (quantity - lower) / (upper - lower);
        tierPrice = lowerPrice + (upperPrice - lowerPrice) * ratio;
      }
    }

    // Area adjustment
    const areaFactor = Math.sqrt(sqIn / baseSqIn);
    let total = tierPrice * areaFactor;
    
    // Material upcharge
    const matPrice = MATERIALS.find(m => m.id === material)?.price || 0;
    total *= (1 + matPrice);

    return {
      total: Math.round(total),
      unit: (total / quantity).toFixed(2)
    };
  };

  const price = calculatePrice();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target.result);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      
      // Simulate/Call AI analysis
      setIsProcessing(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: "Analyze this image for a sticker. Is it complex? Shape?",
          file_urls: [file_url],
          response_json_schema: { type: "object", properties: { complexity: { type: "number" }, shape: { type: "string" } } }
        });
        setDieCutPath(result);
      } catch (e) {
        console.log("AI analysis skipped");
      }
      setIsProcessing(false);
      toast.success('File uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!imageUrl && !showUploadDialog) {
      setShowUploadDialog(true);
      return;
    }
    
    setIsAddingToCart(true);
    try {
        await base44.entities.StickerOrder.create({
            product_type: product.slug,
            size: size === 'custom' ? `${customWidth}x${customHeight}` : size,
            width: size === 'custom' ? customWidth : parseFloat(size.split('x')[0]),
            height: size === 'custom' ? customHeight : parseFloat(size.split('x')[1]),
            quantity,
            unit_price: parseFloat(price.unit),
            total_price: price.total,
            material,
            finish: 'matte', // Default
            original_image_url: imageUrl,
            thumbnail_url: uploadedImage || product.image_url,
            is_in_cart: true
        });
        toast.success('Added to cart!');
        navigate(createPageUrl('Cart'));
    } catch (e) {
        toast.error('Error adding to cart');
    } finally {
        setIsAddingToCart(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Configurator Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Configure Your Stickers</h3>
        
        {/* Size Selection */}
        <div className="mb-6">
          <Label className="text-sm text-gray-600 mb-2 block">Size (in Inches)</Label>
          <div className="flex flex-wrap gap-2">
            {['2x2', '3x3', '4x4', '5x5'].map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  size === s ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-gray-200 hover:border-purple-300 text-gray-700'
                }`}
              >
                {s.replace('x', '" x "')}"
              </button>
            ))}
            <button
              onClick={() => setSize('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                size === 'custom' ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-gray-200 hover:border-purple-300 text-gray-700'
              }`}
            >
              Custom
            </button>
          </div>
          
          {size === 'custom' && (
            <div className="flex gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
              <div>
                <Label className="text-xs text-gray-500">Width</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={customWidth} 
                    onChange={e => setCustomWidth(Number(e.target.value))}
                    className="w-24 pl-3 pr-8" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">"</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Height</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={customHeight} 
                    onChange={e => setCustomHeight(Number(e.target.value))}
                    className="w-24 pl-3 pr-8" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">"</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Material Selection */}
        <div className="mb-6">
          <Label className="text-sm text-gray-600 mb-2 block">Material</Label>
          <div className="grid grid-cols-2 gap-3">
            {MATERIALS.map(m => (
              <button
                key={m.id}
                onClick={() => setMaterial(m.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  material === m.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${m.color}`} />
                <div>
                  <div className="text-sm font-bold text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selection */}
        <div>
          <Label className="text-sm text-gray-600 mb-2 block">Quantity</Label>
          <div className="relative">
            <Input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.max(10, Number(e.target.value)))}
              className="text-lg font-bold h-12"
            />
            <div className="absolute right-3 top-3 text-sm text-green-600 font-medium">
              Buy More, Save More!
            </div>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {[50, 100, 200, 300, 500, 1000].map(q => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  quantity === q ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-gray-500">Total Price</div>
            <div className="text-3xl font-bold text-gray-900">${price.total}</div>
            <div className="text-sm text-gray-500">${price.unit} each</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium justify-end">
              <Loader2 className="w-3 h-3" /> 
              <span>Ready to ship</span>
            </div>
            <div className="text-sm text-gray-900">1 Business Day</div>
          </div>
        </div>

        <div className="grid gap-3">
          {!uploadedImage ? (
            <>
              <Button 
                size="lg" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-lg h-14"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Artwork
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => navigate(createPageUrl('DesignTool') + `?product=${product.slug}`)}>
                  Design Online
                </Button>
                <Button variant="outline">Get Help</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded border overflow-hidden">
                  <img src={uploadedImage} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-purple-900 truncate">Artwork Uploaded</div>
                  <div className="text-xs text-purple-700">Ready for die-cut analysis</div>
                </div>
                <button 
                  onClick={() => { setUploadedImage(null); setImageUrl(null); }}
                  className="text-purple-400 hover:text-purple-600"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              <Button 
                size="lg" 
                className="w-full bg-green-600 hover:bg-green-700 text-lg h-14"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                Add to Cart
              </Button>
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
      </div>
    </div>
  );
}