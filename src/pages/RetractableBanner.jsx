import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ChevronRight, Check, Star, Truck, Clock, Shield, Minus, Plus,
  ShoppingCart, Upload, Loader2, Briefcase, Maximize
} from 'lucide-react';
import { toast } from 'sonner';
import { calculatePrice, FALLBACK_PRICING } from '@/components/pricing/PricingCalculator';

const SIZES = [
  { id: '24x81', label: '24" × 81"', width: 24, height: 81, desc: 'Medium - Perfect for tight spaces', price: 89.99 },
  { id: '33x81', label: '33" × 81"', width: 33, height: 81, desc: 'Large - Most popular size', popular: true, price: 114.19 },
  { id: '47x81', label: '47" × 81"', width: 47, height: 81, desc: 'X-Large - Maximum impact', price: 149.99 },
  { id: '36x92', label: '36" × 92"', width: 36, height: 92, desc: 'Premium - Extra tall', price: 189.99, premium: true },
  { id: '48x92', label: '48" × 92"', width: 48, height: 92, desc: 'Premium XL - Trade shows', price: 229.99, premium: true },
];

const MATERIALS = [
  { id: 'vinyl', name: '13 oz Smooth Vinyl', desc: 'Durable, vibrant colors, easy to clean', price: 0 },
  { id: 'fabric', name: 'UV Fabric', desc: 'Premium matte finish, wrinkle-resistant', price: 25 },
];

const ACCESSORIES = [
  { id: 'none', name: 'No Accessories', price: 0 },
  { id: 'led', name: 'LED Display Light', desc: 'Clip-on spotlight for your banner', price: 35 },
  { id: 'case', name: 'Hard Travel Case', desc: 'Protective case with wheels', price: 45 },
];

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $99' },
  { icon: Clock, title: 'Next Day Production', desc: '1 business day turnaround' },
  { icon: Shield, title: '5+ Year Lifespan', desc: 'Durable aluminum base' },
  { icon: Briefcase, title: 'Carrying Case', desc: 'Included free' },
];

export default function RetractableBanner() {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('33x78');
  const [material, setMaterial] = useState('vinyl');
  const [accessory, setAccessory] = useState('none');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const size = SIZES.find(s => s.id === selectedSize);
  const materialOption = MATERIALS.find(m => m.id === material);
  const accessoryOption = ACCESSORIES.find(a => a.id === accessory);

  // Calculate pricing using size's base price
  const sizeData = SIZES.find(s => s.id === selectedSize);
  let basePrice = sizeData?.price || 114.19;
  
  // Volume discounts
  if (quantity >= 10) basePrice *= 0.88;
  else if (quantity >= 5) basePrice *= 0.92;
  else if (quantity >= 2) basePrice *= 0.96;

  const materialCost = materialOption?.price || 0;
  const accessoryCost = accessoryOption?.price || 0;
  const unitPrice = basePrice + materialCost + accessoryCost;
  const total = unitPrice * quantity;

  const handleAddToCart = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      toast.info('Please sign in to add to cart');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsAddingToCart(true);
    try {
      await base44.entities.SavedDesign.create({
        name: `Retractable Banner ${size.label}`,
        product_type: 'retractable-banner',
        width: size.width,
        height: size.height,
        quantity,
        unit_price: unitPrice,
        material: materialOption.name,
        options_json: JSON.stringify({ size: selectedSize, material, accessory }),
        is_in_cart: true,
      });
      toast.success('Added to cart!');
      navigate(createPageUrl('Cart'));
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDesignOnline = () => {
    navigate(createPageUrl('DesignTool') + `?product=retractable-banner&width=${size.width}&height=${size.height}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={createPageUrl('Products') + '?category=displays-stands'} className="hover:text-blue-600">Displays</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Retractable Banners</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="bg-white/20 text-white mb-4">Free Carrying Case Included</Badge>
              <h1 className="text-4xl font-bold mb-4">Retractable Banner Stands</h1>
              <p className="text-xl text-white/90 mb-6">
                Professional pull-up banners perfect for trade shows, events, and retail displays. 
                Easy setup, portable design, and stunning print quality.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-white/90">419 Reviews</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-sm text-white/70">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop" 
                alt="Retractable Banner"
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
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Maximize className="w-5 h-5 text-blue-600" />
                Select Size
              </h2>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SIZES.map((s) => (
                    <label 
                      key={s.id}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSize === s.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={s.id} id={s.id} className="sr-only" />
                      <div className={`w-12 h-20 bg-gray-200 rounded flex items-center justify-center text-xs ${
                        s.id === '47x81' ? 'w-16' : s.id === '24x81' ? 'w-10' : 'w-12'
                      }`}>
                        <span className="text-gray-500 text-[8px]">{s.label}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{s.label}</span>
                          {s.popular && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Popular</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{s.desc}</p>
                      </div>
                      {selectedSize === s.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
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
                      {m.price > 0 && (
                        <Badge variant="outline">+${m.price}</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Accessories */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Accessories</h2>
              <RadioGroup value={accessory} onValueChange={setAccessory}>
                <div className="space-y-3">
                  {ACCESSORIES.map((a) => (
                    <label 
                      key={a.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        accessory === a.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={a.id} id={a.id} />
                        <div>
                          <span className="font-medium text-gray-900">{a.name}</span>
                          {a.desc && <p className="text-sm text-gray-500">{a.desc}</p>}
                        </div>
                      </div>
                      {a.price > 0 && (
                        <Badge variant="outline">+${a.price}</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Quantity Pricing Table */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Volume Pricing</h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { qty: 1, discount: 0 },
                  { qty: 2, discount: 4 },
                  { qty: 5, discount: 8 },
                  { qty: 10, discount: 12 },
                ].map((tier) => {
                  const tierPrice = (sizeData?.price || 114.19) * (1 - tier.discount / 100);
                  const isActive = (tier.qty === 1 && quantity === 1) ||
                    (tier.qty === 2 && quantity >= 2 && quantity < 5) ||
                    (tier.qty === 5 && quantity >= 5 && quantity < 10) ||
                    (tier.qty === 10 && quantity >= 10);
                  return (
                    <div 
                      key={tier.qty}
                      className={`text-center p-3 rounded-lg border ${
                        isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-sm text-gray-500">{tier.qty}+</div>
                      <div className="font-bold text-green-600">${tierPrice.toFixed(2)}</div>
                      {tier.discount > 0 && (
                        <div className="text-xs text-green-600">Save {tier.discount}%</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              
              {/* Preview */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="w-24 h-40 bg-white mx-auto rounded shadow-sm flex items-center justify-center text-xs text-gray-400">
                  {size?.label}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">Retractable Banner</p>
              </div>

              {/* Configuration Summary */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium">{size?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material</span>
                  <span className="font-medium">{materialOption?.name}</span>
                </div>
                {accessory !== 'none' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accessory</span>
                    <span className="font-medium">{accessoryOption?.name}</span>
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
                  <span className="text-gray-600">Base price</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                {materialCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{materialOption?.name}</span>
                    <span>+${materialCost.toFixed(2)}</span>
                  </div>
                )}
                {accessoryCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{accessoryOption?.name}</span>
                    <span>+${accessoryCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit price</span>
                  <span className="font-medium">${unitPrice.toFixed(2)}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">× {quantity}</span>
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

              {/* Guarantees */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Free carrying case included
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  Free shipping over $99
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  5+ year lifespan
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specs Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Product Specifications</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Dimensions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Medium: 24" × 81" (2' × 6.75')</li>
                <li>• Large: 33.5" × 78" (2.8' × 6.5')</li>
                <li>• Large: 33" × 81" (2.75' × 6.75')</li>
                <li>• X-Large: 47" × 81" (3.9' × 6.75')</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Materials</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 13 oz smooth vinyl with UV-resistant ink</li>
                <li>• Premium UV fabric (wrinkle-resistant)</li>
                <li>• Sturdy aluminum base with chrome finish</li>
                <li>• Telescoping support pole</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Included</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Free carrying case with every order</li>
                <li>• Easy snap-rail for graphic changes</li>
                <li>• Stabilizing feet (swing out)</li>
                <li>• Setup instructions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}