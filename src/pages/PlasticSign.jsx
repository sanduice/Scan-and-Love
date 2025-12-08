import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ChevronRight, Check, Star, Truck, Clock, Shield, Minus, Plus,
  Square, Circle, Upload, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { calculatePrice, FALLBACK_PRICING } from '@/components/pricing/PricingCalculator';

const PRESET_SIZES = [
  { label: '6" × 6"', width: 6, height: 6 },
  { label: '8" × 10"', width: 8, height: 10 },
  { label: '12" × 12"', width: 12, height: 12 },
  { label: '12" × 18"', width: 12, height: 18 },
  { label: '18" × 24"', width: 18, height: 24 },
  { label: '24" × 24"', width: 24, height: 24 },
  { label: '24" × 36"', width: 24, height: 36 },
  { label: '36" × 48"', width: 36, height: 48 },
];

const MATERIALS = [
  { id: '3mm PVC', name: '3mm PVC Plastic', desc: 'Standard thickness, lightweight, great for indoor/outdoor', priceLabel: 'From $15' },
  { id: '6mm PVC', name: '6mm PVC Plastic', desc: 'Extra durability, heavier weight, professional look', priceLabel: 'From $20' },
];

const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'rounded-quarter', name: 'Rounded (1/4")', icon: Square },
  { id: 'rounded-1inch', name: 'Rounded (1")', icon: Square },
  { id: 'circle', name: 'Circle / Oval', icon: Circle },
];

const MOUNTING = [
  { id: 'none', name: 'None (drilled holes only)', price: 0 },
  { id: 'standoffs-4', name: 'Standoffs (4 corners)', price: 15, desc: 'Chrome aluminum, floating mount' },
  { id: 'easel', name: 'Easel Back', price: 8, desc: 'Self-standing display' },
  { id: 'velcro', name: 'Velcro Strips (12)', price: 12, desc: 'Easy repositioning' },
];

export default function PlasticSign() {
  const navigate = useNavigate();
  const [width, setWidth] = useState(12);
  const [height, setHeight] = useState(18);
  const [material, setMaterial] = useState('3mm PVC');
  const [shape, setShape] = useState('rectangle');
  const [mounting, setMounting] = useState('none');
  const [printSides, setPrintSides] = useState('single');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const mountingOption = MOUNTING.find(m => m.id === mounting);

  // Calculate pricing
  const pricing = calculatePrice('plastic-sign', material, { width, height, quantity });
  const mountingCost = mountingOption?.price || 0;
  const doubleSidedMultiplier = printSides === 'double' ? 1.5 : 1;
  const unitPrice = (pricing.unitPrice * doubleSidedMultiplier) + mountingCost;
  const total = unitPrice * quantity;

  const handlePresetSize = (preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleDesignOnline = () => {
    navigate(createPageUrl('DesignTool') + `?product=plastic-sign&width=${width}&height=${height}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={createPageUrl('Products') + '?category=signs'} className="hover:text-blue-600">Signs</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Plastic Signs</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="bg-white/20 text-white mb-4">Indoor & Outdoor Use</Badge>
              <h1 className="text-4xl font-bold mb-4">Custom Plastic Signs</h1>
              <p className="text-xl text-white/90 mb-6">
                Durable PVC plastic signs printed with UV-resistant inks. Perfect for offices, 
                parking lots, wayfinding, and business signage. Weatherproof and long-lasting.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-white/90">1,389 Reviews</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-sm text-white/70">Over $99</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Next Day</p>
                    <p className="text-sm text-white/70">Production</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Weatherproof</p>
                    <p className="text-sm text-white/70">UV resistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Lightweight</p>
                    <p className="text-sm text-white/70">Easy install</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop" 
                alt="Plastic Signs"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-8">
            {/* Size Selection */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Size</h2>
              
              {/* Preset Sizes */}
              <div className="mb-4">
                <Label className="text-sm text-gray-600 mb-2 block">Popular Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetSize(preset)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                        width === preset.width && height === preset.height
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width (inches)</Label>
                  <Input 
                    type="number" 
                    value={width} 
                    onChange={(e) => setWidth(Math.max(4, Math.min(96, Number(e.target.value))))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Height (inches)</Label>
                  <Input 
                    type="number" 
                    value={height} 
                    onChange={(e) => setHeight(Math.max(4, Math.min(96, Number(e.target.value))))}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Min: 4" × 4" | Max: 96" × 96"</p>
            </div>

            {/* Material */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Material</h2>
              <RadioGroup value={material} onValueChange={setMaterial}>
                <div className="space-y-3">
                  {MATERIALS.map((m) => (
                    <label 
                      key={m.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        material === m.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={m.id} id={m.id} />
                        <div>
                          <span className="font-medium text-gray-900">{m.name}</span>
                          <p className="text-sm text-gray-500">{m.desc}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{m.priceLabel}</Badge>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Shape */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Shape</h2>
              <RadioGroup value={shape} onValueChange={setShape}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SHAPES.map((s) => (
                    <label 
                      key={s.id}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        shape === s.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={s.id} id={s.id} className="sr-only" />
                      <s.icon className={`w-8 h-8 mb-2 ${s.id.includes('rounded') ? 'rounded' : ''} ${s.id === 'circle' ? 'rounded-full' : ''}`} />
                      <span className="text-sm font-medium text-center">{s.name}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Print Sides */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Print Sides</h2>
              <RadioGroup value={printSides} onValueChange={setPrintSides}>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      printSides === 'single' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="single" id="single" />
                      <span className="font-medium">Single Sided</span>
                    </div>
                  </label>
                  <label 
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      printSides === 'double' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="double" id="double" />
                      <span className="font-medium">Double Sided</span>
                    </div>
                    <Badge variant="outline">+50%</Badge>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Mounting Options */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Mounting & Accessories</h2>
              <RadioGroup value={mounting} onValueChange={setMounting}>
                <div className="space-y-3">
                  {MOUNTING.map((m) => (
                    <label 
                      key={m.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        mounting === m.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={m.id} id={m.id} />
                        <div>
                          <span className="font-medium text-gray-900">{m.name}</span>
                          {m.desc && <p className="text-sm text-gray-500">{m.desc}</p>}
                        </div>
                      </div>
                      {m.price > 0 && (
                        <Badge variant="outline">+${m.price}</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Preview */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div 
                  className={`bg-white mx-auto shadow-sm flex items-center justify-center text-xs text-gray-400 ${
                    shape === 'circle' ? 'rounded-full' : shape.includes('rounded') ? 'rounded-lg' : 'rounded'
                  }`}
                  style={{
                    width: Math.min(150, width * 3),
                    height: Math.min(100, height * 3),
                  }}
                >
                  {width}" × {height}"
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">PVC Plastic Sign</p>
              </div>

              {/* Configuration Summary */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium">{width}" × {height}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area</span>
                  <span className="font-medium">{pricing.sqft} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material</span>
                  <span className="font-medium">{material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shape</span>
                  <span className="font-medium capitalize">{shape.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sides</span>
                  <span className="font-medium capitalize">{printSides}</span>
                </div>
                {mounting !== 'none' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mounting</span>
                    <span className="font-medium">{mountingOption?.name}</span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <Label className="text-sm text-gray-600">Quantity</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base ({pricing.sqft} sq ft × ${pricing.pricePerUnit}/sqft)</span>
                  <span>${pricing.unitPrice.toFixed(2)}</span>
                </div>
                {printSides === 'double' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Double sided</span>
                    <span>+50%</span>
                  </div>
                )}
                {mountingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{mountingOption?.name}</span>
                    <span>+${mountingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit price</span>
                  <span className="font-medium">${unitPrice.toFixed(2)}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>× {quantity}</span>
                    <span></span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-6">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12"
                  onClick={handleDesignOnline}
                >
                  Design Online
                </Button>
                <Button variant="outline" className="w-full h-12">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your File
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}