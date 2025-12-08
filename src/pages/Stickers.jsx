import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors, Circle, Square, QrCode, Layers, Tag, Star,
  Truck, Shield, Clock, ArrowRight, Sparkles, Smartphone, Link2
} from 'lucide-react';

const STICKER_PRODUCTS = [
  {
    id: 'die-cut',
    name: 'Die Cut Stickers',
    description: 'Custom shaped stickers cut precisely to your design. Our AI automatically traces your artwork to create the perfect cut line.',
    icon: Scissors,
    image: 'https://stickerine.com/cdn/shop/files/die-cut-alien-product-image.webp?v=1759104866&width=600',
    startingPrice: 117,
    startingQty: 50,
    popular: true,
    features: ['Any custom shape', 'AI-powered die cut', 'Weatherproof vinyl', 'Matte or glossy finish'],
    sizes: ['2"×2"', '3"×3"', '4"×4"', '5"×5"', 'Custom'],
  },
  {
    id: 'qr-code',
    name: 'QR Code Stickers',
    description: 'Promote your business with scannable QR codes. Generate a QR code instantly and place it next to your logo. Perfect for marketing, menus, and business cards.',
    icon: QrCode,
    image: 'https://stickerine.com/cdn/shop/files/qr-code-sticker-product-image.webp?v=1756231429&width=600',
    startingPrice: 67,
    startingQty: 50,
    popular: true,
    features: ['Built-in QR generator', 'Dynamic QR codes', 'Place QR on any side', 'Scannable guarantee'],
    sizes: ['2"×4"', '2.5"×5"', '3"×6"', 'Custom'],
    highlight: 'NEW: QR Generator Built-in',
  },
  {
    id: 'circle',
    name: 'Circle Stickers',
    description: 'Classic round stickers perfect for logos, seals, and branding. Clean edges and perfect symmetry every time.',
    icon: Circle,
    image: 'https://stickerine.com/cdn/shop/files/ChatGPT_Image_Sep_28_2025_05_05_17_PM.jpg?v=1759107506&width=600',
    startingPrice: 117,
    startingQty: 50,
    features: ['Perfect circles', 'Multiple sizes', 'Premium vinyl', 'Great for logos'],
    sizes: ['2"×2"', '3"×3"', '4"×4"', '5"×5"'],
  },
  {
    id: 'square',
    name: 'Square & Rectangle',
    description: 'Clean rectangular stickers with optional rounded corners. Versatile for any design or branding.',
    icon: Square,
    image: 'https://stickerine.com/cdn/shop/files/ChatGPT_Image_Sep_28_2025_06_30_28_PM.png?v=1760025515&width=600',
    startingPrice: 117,
    startingQty: 50,
    features: ['Sharp or rounded corners', 'Any aspect ratio', 'Durable finish'],
    sizes: ['2"×2"', '3"×3"', '4"×4"', '5"×5"', 'Custom'],
  },
  {
    id: 'sheet',
    name: 'Sticker Sheets',
    description: 'Multiple stickers on one easy-peel sheet. Perfect for variety packs, merchandise, and giveaways.',
    icon: Layers,
    image: 'https://stickerine.com/cdn/shop/files/still-growing.png?format=webp&v=1755808507&width=600',
    startingPrice: 99,
    startingQty: 25,
    features: ['Multiple designs per sheet', 'Easy peel backing', 'Great for bundles'],
    sizes: ['4"×6"', '8.5"×11"'],
  },
  {
    id: 'labels',
    name: 'Product Labels',
    description: 'Professional labels for products and packaging. Waterproof options available for bottles and outdoor use.',
    icon: Tag,
    image: 'https://stickerine.com/cdn/shop/files/grease-grind-2.png?format=webp&v=1755808533&width=600',
    startingPrice: 45,
    startingQty: 100,
    features: ['Product labels', 'Waterproof options', 'Roll or sheet format'],
    sizes: ['2"×2"', '3"×3"', 'Custom'],
  },
];

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
  { icon: Clock, title: '2-Day Turnaround', desc: 'Fast production' },
  { icon: Shield, title: 'Weatherproof', desc: 'UV & water resistant' },
  { icon: Sparkles, title: 'AI Die Cut', desc: 'Auto-trace your artwork' },
];

const MATERIALS = [
  { id: 'white-vinyl', name: 'White Vinyl', color: 'bg-white border-2', textColor: 'text-gray-800' },
  { id: 'clear-vinyl', name: 'Clear', color: 'bg-gradient-to-br from-white/50 to-gray-100/50 border-2 border-dashed', textColor: 'text-gray-600' },
  { id: 'holographic', name: 'Holographic', color: 'bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300', textColor: 'text-white' },
  { id: 'glossy', name: 'Glossy', color: 'bg-white border-2 shadow-lg', textColor: 'text-gray-800' },
  { id: 'matte', name: 'Matte', color: 'bg-gray-100 border-2', textColor: 'text-gray-700' },
  { id: 'kraft', name: 'Kraft', color: 'bg-amber-200', textColor: 'text-amber-900' },
];

export default function Stickers() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white mb-4">New: AI-Powered Die Cut</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Custom Stickers & Labels
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Upload your artwork and our AI automatically creates the perfect die cut line. 
              Adjust the cut tightness, preview instantly, and order in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('StickerBuilder') + '?type=die-cut'}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  <Scissors className="w-5 h-5 mr-2" />
                  Create Die Cut Stickers
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                See All Products
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{feature.title}</p>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Material Options Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Materials Available</h3>
        <div className="flex flex-wrap gap-3">
          {MATERIALS.map((mat) => (
            <div key={mat.id} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
              <div className={`w-6 h-6 rounded-full ${mat.color}`} />
              <span className="text-sm font-medium text-gray-700">{mat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Choose Your Sticker Type</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STICKER_PRODUCTS.map((product) => (
            <Link 
              key={product.id}
              to={createPageUrl('StickerBuilder') + `?type=${product.id}`}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.popular && (
                  <Badge className="absolute top-3 left-3 bg-purple-600">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Popular
                  </Badge>
                )}
                {product.highlight && (
                  <Badge className="absolute top-3 right-3 bg-green-600">
                    {product.highlight}
                  </Badge>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <product.icon className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                
                {/* Sizes */}
                {product.sizes && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.sizes.map((size, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {size}
                      </span>
                    ))}
                  </div>
                )}
                
                <ul className="space-y-1 mb-4">
                  {product.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${product.startingPrice}</span>
                    <span className="text-sm text-gray-500"> / {product.startingQty}</span>
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Create <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* QR Code Feature Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <Badge className="bg-white/20 text-white mb-4">
                <QrCode className="w-3 h-3 mr-1" />
                New Feature
              </Badge>
              <h2 className="text-3xl font-bold mb-4">QR Code Stickers with Built-in Generator</h2>
              <p className="text-white/90 mb-6">
                Generate dynamic QR codes instantly! Just paste your link, social media handle, or any URL. 
                Position the QR code on any side of your artwork - top, bottom, left, or right.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span>Generate QR codes for any URL or social media</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <span>Dynamic QR - update the link anytime</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <span>Place QR on top, bottom, left, or right</span>
                </li>
              </ul>
              <Link to={createPageUrl('StickerBuilder') + '?type=qr-code'}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  <QrCode className="w-5 h-5 mr-2" />
                  Create QR Code Stickers
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-medium">QR on Right</div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center">
                        <span className="text-2xl">🎨</span>
                      </div>
                      <div className="w-12 h-12 bg-gray-900 rounded p-1">
                        <div className="w-full h-full bg-white grid grid-cols-3 gap-px">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className={`${Math.random() > 0.5 ? 'bg-gray-900' : 'bg-white'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-medium">QR on Bottom</div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="w-full h-12 bg-purple-100 rounded flex items-center justify-center mb-2">
                        <span className="text-xl">🏪</span>
                      </div>
                      <div className="w-8 h-8 bg-gray-900 rounded p-1 mx-auto">
                        <div className="w-full h-full bg-white grid grid-cols-3 gap-px">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className={`${Math.random() > 0.5 ? 'bg-gray-900' : 'bg-white'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-900">Sizes: 2"×4" • 2.5"×5" • 3"×6" • Custom</div>
                  <div className="text-sm text-gray-500">Starting at $67 for 50 stickers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Our AI Die Cut Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload any image and our AI automatically traces the edges to create a perfect die cut line
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Upload', desc: 'Upload your logo, photo, or artwork' },
              { step: '2', title: 'AI Traces', desc: 'Our AI detects edges and creates die cut path' },
              { step: '3', title: 'Adjust', desc: 'Choose tight, standard, or loose cut offset' },
              { step: '4', title: 'Order', desc: 'Review proof and place your order' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Table Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Bulk Pricing = Big Savings</h2>
              <p className="text-white/90 mb-6">
                Order more and save up to 90%. Perfect for businesses, events, and giveaways.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>50 stickers</span>
                  <span>$2.34 each</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>500 stickers</span>
                  <span>$1.06 each - Save 55%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>5,000 stickers</span>
                  <span>$0.65 each - Save 72%</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <Link to={createPageUrl('StickerBuilder') + '?type=die-cut'}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Start Your Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}