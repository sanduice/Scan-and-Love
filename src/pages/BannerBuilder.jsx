import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, Upload, Palette, Clock, Truck, ChevronRight, Check, 
  X, FileImage, AlertCircle, Minus, Plus, ShoppingCart, Info
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import BannerPreview from '@/components/banner/BannerPreview';
import PricingBreakdown from '@/components/banner/PricingBreakdown';
import ArtworkUploader from '@/components/banner/ArtworkUploader';

// Pricing table per sq ft based on quantity - calibrated to match signs.com
// Signs.com: 72x36 (18 sqft) = $58.61 for qty 1 = $3.26/sqft
const PRICING_TABLE = {
  '13 oz Vinyl': {
    1: 3.26,
    2: 3.10,
    3: 2.95,
    5: 2.70,
    10: 2.40,
    25: 2.10,
    50: 1.85,
    100: 1.60
  },
  '18 oz Vinyl': {
    1: 4.00,
    2: 3.85,
    3: 3.70,
    5: 3.45,
    10: 3.15,
    25: 2.85,
    50: 2.60,
    100: 2.35
  }
};

export default function BannerBuilder() {
  const [width, setWidth] = useState(72);
  const [height, setHeight] = useState(36);
  const [quantity, setQuantity] = useState(1);
  const [artwork, setArtwork] = useState(null);
  const [artworkPreview, setArtworkPreview] = useState(null);
  const [designMethod, setDesignMethod] = useState('upload');
  const [isUploading, setIsUploading] = useState(false);
  
  const [options, setOptions] = useState({
    material: '13 oz Vinyl',
    printSides: 'Single Sided',
    finish: 'Welded Hem',
    grommets: 'Every 2-3 ft',
    polePockets: 'None',
    accessory: 'None'
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'vinyl-banner'],
    queryFn: () => base44.entities.Product.filter({ slug: 'vinyl-banner' }),
  });

  const product = products[0];

  // Get price per sq ft based on quantity
  const getPricePerSqFt = (material, qty) => {
    const table = PRICING_TABLE[material];
    const tiers = Object.keys(table).map(Number).sort((a, b) => b - a);
    for (const tier of tiers) {
      if (qty >= tier) return table[tier];
    }
    return table[1];
  };

  // Calculate all pricing
  const pricing = useMemo(() => {
    const sqft = (width * height) / 144;
    const pricePerSqFt = getPricePerSqFt(options.material, quantity);
    
    // Base price
    let baseTotal = sqft * pricePerSqFt * quantity;
    
    // Option modifiers
    const modifiers = {
      printSides: options.printSides === 'Double Sided' ? baseTotal * 0.5 : 0,
      finish: options.finish === 'Sewn Hem' ? 5 * quantity : 0,
      grommets: options.grommets === 'Every 12-18 in' ? 8 * quantity : 0,
      polePockets: options.polePockets === '3" Pockets (Top & Bottom)' ? 12 * quantity : 
                   options.polePockets === '3" Pocket (Top Only)' ? 6 * quantity : 0,
    };
    
    // Accessory prices
    const accessoryPrices = {
      'None': 0,
      'Bungees (8)': 12,
      'Zip Ties (10)': 5,
      '10ft Nylon Rope (4)': 15,
      'Hanging Clips (6)': 18,
      'Suction Cups (8)': 16,
      'Velcro (12)': 10
    };
    modifiers.accessory = (accessoryPrices[options.accessory] || 0) * quantity;
    
    const optionsTotal = Object.values(modifiers).reduce((a, b) => a + b, 0);
    const subtotal = baseTotal + optionsTotal;
    const shipping = subtotal >= 99 ? 0 : 12.95;
    const total = subtotal + shipping;
    
    return {
      sqft: sqft.toFixed(2),
      pricePerSqFt,
      baseTotal,
      modifiers,
      optionsTotal,
      subtotal,
      shipping,
      total,
      unitPrice: (subtotal / quantity).toFixed(2)
    };
  }, [width, height, quantity, options]);

  const updateOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleArtworkUpload = async (file) => {
    setIsUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtworkPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload to server
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setArtwork(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <Skeleton className="h-[600px] lg:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')} className="text-gray-500 hover:text-gray-700 text-sm">Home</Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">Vinyl Banner Builder</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold text-[#8BC34A]">${pricing.total.toFixed(2)}</div>
              </div>
              <Button className="bg-[#8BC34A] hover:bg-[#7CB342] text-white h-12 px-6">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner Preview */}
            <BannerPreview 
              width={width} 
              height={height} 
              artwork={artworkPreview}
              options={options}
            />

            {/* Size Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Choose Your Size</h3>
              
              {/* Quick Sizes */}
              <div className="mb-6">
                <Label className="text-sm text-gray-600 mb-3 block">Popular Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "2' × 4'", w: 24, h: 48 },
                    { label: "3' × 6'", w: 36, h: 72 },
                    { label: "4' × 8'", w: 48, h: 96 },
                    { label: "3' × 10'", w: 36, h: 120 },
                    { label: "4' × 12'", w: 48, h: 144 },
                  ].map((size) => (
                    <button
                      key={size.label}
                      onClick={() => { setWidth(size.h); setHeight(size.w); }}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        width === size.h && height === size.w
                          ? 'border-[#2196F3] bg-[#2196F3]/5 text-[#2196F3]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Size */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Width (inches)</Label>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setWidth(Math.max(12, width - 1))}
                      className="h-12 w-10 flex items-center justify-center border border-r-0 rounded-l-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Math.max(12, Math.min(192, Number(e.target.value))))}
                      className="h-12 rounded-none text-center border-x-0"
                    />
                    <button 
                      onClick={() => setWidth(Math.min(192, width + 1))}
                      className="h-12 w-10 flex items-center justify-center border border-l-0 rounded-r-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Height (inches)</Label>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setHeight(Math.max(12, height - 1))}
                      className="h-12 w-10 flex items-center justify-center border border-r-0 rounded-l-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Math.max(12, Math.min(120, Number(e.target.value))))}
                      className="h-12 rounded-none text-center border-x-0"
                    />
                    <button 
                      onClick={() => setHeight(Math.min(120, height + 1))}
                      className="h-12 w-10 flex items-center justify-center border border-l-0 rounded-r-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Quantity</Label>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-12 w-10 flex items-center justify-center border border-r-0 rounded-l-lg hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="h-12 rounded-none text-center border-x-0"
                    />
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-12 w-10 flex items-center justify-center border border-l-0 rounded-r-lg hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Size</Label>
                  <div className="h-12 flex items-center justify-center bg-gray-50 rounded-lg border text-gray-900 font-medium">
                    {pricing.sqft} sq ft
                  </div>
                </div>
              </div>
            </div>

            {/* Material & Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Select Options</h3>
              
              <div className="space-y-6">
                {/* Material */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Material</Label>
                  <RadioGroup
                    value={options.material}
                    onValueChange={(v) => updateOption('material', v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { name: '13 oz Vinyl', desc: 'Standard weight, great for indoor/outdoor use', price: null },
                      { name: '18 oz Vinyl', desc: 'Heavy-duty, required for double-sided printing', price: '+$0.75/sqft' }
                    ].map((opt) => (
                      <div key={opt.name} className="relative">
                        <RadioGroupItem value={opt.name} id={`material-${opt.name}`} className="peer sr-only" />
                        <Label
                          htmlFor={`material-${opt.name}`}
                          className="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer peer-data-[state=checked]:border-[#2196F3] peer-data-[state=checked]:bg-[#2196F3]/5 hover:bg-gray-100 transition-all"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-data-[state=checked]:border-[#2196F3] flex items-center justify-center mt-0.5">
                            {options.material === opt.name && <div className="w-2.5 h-2.5 rounded-full bg-[#2196F3]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{opt.name}</span>
                              {opt.price && <span className="text-sm text-[#2196F3]">{opt.price}</span>}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Print Sides */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Print Sides</Label>
                  <RadioGroup
                    value={options.printSides}
                    onValueChange={(v) => updateOption('printSides', v)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {[
                      { name: 'Single Sided', price: null },
                      { name: 'Double Sided', price: '+50%' }
                    ].map((opt) => (
                      <div key={opt.name} className="relative">
                        <RadioGroupItem value={opt.name} id={`sides-${opt.name}`} className="peer sr-only" />
                        <Label
                          htmlFor={`sides-${opt.name}`}
                          className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer peer-data-[state=checked]:border-[#2196F3] peer-data-[state=checked]:bg-[#2196F3]/5 hover:bg-gray-100 transition-all"
                        >
                          <span className="font-medium text-gray-900">{opt.name}</span>
                          {opt.price && <span className="text-sm text-[#2196F3]">{opt.price}</span>}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {options.printSides === 'Double Sided' && options.material === '13 oz Vinyl' && (
                    <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>18 oz Vinyl recommended for double-sided banners</span>
                    </div>
                  )}
                </div>

                {/* Finish */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Edge Finish</Label>
                  <RadioGroup
                    value={options.finish}
                    onValueChange={(v) => updateOption('finish', v)}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { name: 'Welded Hem', price: 'Free' },
                      { name: 'Sewn Hem', price: '+$5' },
                      { name: 'None (Flush Cut)', price: 'Free' }
                    ].map((opt) => (
                      <div key={opt.name} className="relative">
                        <RadioGroupItem value={opt.name} id={`finish-${opt.name}`} className="peer sr-only" />
                        <Label
                          htmlFor={`finish-${opt.name}`}
                          className="flex flex-col items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer peer-data-[state=checked]:border-[#2196F3] peer-data-[state=checked]:bg-[#2196F3]/5 hover:bg-gray-100 transition-all text-center"
                        >
                          <span className="font-medium text-gray-900 text-sm">{opt.name}</span>
                          <span className="text-xs text-gray-500 mt-1">{opt.price}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Grommets */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Grommets</Label>
                  <RadioGroup
                    value={options.grommets}
                    onValueChange={(v) => updateOption('grommets', v)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {[
                      { name: 'Every 2-3 ft', price: 'Free' },
                      { name: 'Every 12-18 in', price: '+$8' },
                      { name: '4 Corners', price: 'Free' },
                      { name: 'Top Corners Only', price: 'Free' },
                      { name: 'None', price: 'Free' }
                    ].map((opt) => (
                      <div key={opt.name} className="relative">
                        <RadioGroupItem value={opt.name} id={`grommets-${opt.name}`} className="peer sr-only" />
                        <Label
                          htmlFor={`grommets-${opt.name}`}
                          className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer peer-data-[state=checked]:border-[#2196F3] peer-data-[state=checked]:bg-[#2196F3]/5 hover:bg-gray-100 transition-all"
                        >
                          <span className="text-sm font-medium text-gray-900">{opt.name}</span>
                          <span className="text-xs text-gray-500">{opt.price}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Pole Pockets */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Pole Pockets</Label>
                  <RadioGroup
                    value={options.polePockets}
                    onValueChange={(v) => updateOption('polePockets', v)}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { name: 'None', price: 'Free' },
                      { name: '3" Pocket (Top Only)', price: '+$6' },
                      { name: '3" Pockets (Top & Bottom)', price: '+$12' }
                    ].map((opt) => (
                      <div key={opt.name} className="relative">
                        <RadioGroupItem value={opt.name} id={`pockets-${opt.name}`} className="peer sr-only" />
                        <Label
                          htmlFor={`pockets-${opt.name}`}
                          className="flex flex-col items-center p-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer peer-data-[state=checked]:border-[#2196F3] peer-data-[state=checked]:bg-[#2196F3]/5 hover:bg-gray-100 transition-all text-center"
                        >
                          <span className="font-medium text-gray-900 text-sm">{opt.name}</span>
                          <span className="text-xs text-gray-500 mt-1">{opt.price}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Artwork Upload */}
            <ArtworkUploader
              artwork={artwork}
              artworkPreview={artworkPreview}
              isUploading={isUploading}
              designMethod={designMethod}
              setDesignMethod={setDesignMethod}
              onUpload={handleArtworkUpload}
              onRemove={() => { setArtwork(null); setArtworkPreview(null); }}
              width={width}
              height={height}
            />
          </div>

          {/* Right Panel - Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <PricingBreakdown 
                pricing={pricing} 
                options={options}
                quantity={quantity}
                width={width}
                height={height}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}