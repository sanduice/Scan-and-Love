import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from 'lucide-react';

export default function HeroSection({ categories }) {
  const [selectedProduct, setSelectedProduct] = useState('vinyl-banner');
  const [width, setWidth] = useState(72);
  const [height, setHeight] = useState(36);
  const [quantity, setQuantity] = useState(1);
  
  const calculatePrice = () => {
    const sqft = (width * height) / 144;
    const baseRate = 0.50;
    return (sqft * baseRate * quantity + 15).toFixed(2);
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-[#8BC34A]/20 text-[#8BC34A] border border-[#8BC34A]/30">
                <Tag className="w-4 h-4 mr-2" />
                FREE SHIPPING
              </span>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20">
                DESIGN SERVICES
              </span>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20">
                NEXT DAY PRODUCTION
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Say it big with custom signs and banners.
            </h1>
            
            <p className="text-xl text-slate-300 mb-8">
              Professional quality printing with fast turnaround. Design online or let our experts help you create the perfect sign.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('BannerBuilder')}>
                <Button size="lg" className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-8 text-lg">
                  Build Your Banner
                </Button>
              </Link>
              <Link to={createPageUrl('Products')}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 text-lg">
                  Shop All Products
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Right - Quick Order Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Quote</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sign Type</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vinyl-banner">Vinyl Banner</SelectItem>
                    <SelectItem value="yard-signs">Yard Signs</SelectItem>
                    <SelectItem value="aluminum-signs">Aluminum Signs</SelectItem>
                    <SelectItem value="car-magnets">Car Magnets</SelectItem>
                    <SelectItem value="feather-flags">Feather Flags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size (in Inches)</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-8">W</span>
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-8">H</span>
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  className="h-12"
                />
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-500">Price:</span>
                  <div className="text-3xl font-bold text-[#8BC34A]">${calculatePrice()}</div>
                  <button className="text-sm text-[#2196F3] hover:underline">Buy More, Save More!</button>
                </div>
                <Link to={createPageUrl('ProductDetail') + `?slug=${selectedProduct}`}>
                  <Button className="bg-[#8BC34A] hover:bg-[#7CB342] text-white px-8 h-12 text-lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}