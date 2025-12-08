import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Star, Shield, Truck, Clock } from 'lucide-react';
import ImageWithFallback from '@/components/ImageWithFallback';
import StickerConfigurator from './StickerConfigurator';

export default function StickerLandingView({ product }) {
  // This view mimics StickerMule's clean, focused product page
  // The configurator is the HERO of the page.
  
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header for focus */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
           <div className="flex items-center gap-2 text-sm text-gray-500">
             <Link to={createPageUrl('Stickers')} className="hover:text-purple-600">Stickers</Link>
             <span>/</span>
             <span className="text-gray-900 font-medium">{product.name}</span>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left: Product Visuals & Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <ImageWithFallback 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="prose max-w-none">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                {product.long_description || product.short_description || "Custom stickers made with premium vinyl. Durable, weatherproof, and perfect for your brand."}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Durable & Weatherproof</h3>
                    <p className="text-sm text-gray-600">Thick, durable vinyl protects from scratching, rain & sunlight.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Fast Turnaround</h3>
                    <p className="text-sm text-gray-600">Get your stickers fast with 2-day production options.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Preview */}
            <div className="bg-gray-50 rounded-xl p-6">
               <div className="flex items-center gap-2 mb-2">
                 <div className="flex text-yellow-400"><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /></div>
                 <span className="font-bold text-gray-900">4.9/5 Average</span>
               </div>
               <p className="text-gray-600 italic">"Best stickers I've ever ordered. The cut quality is insane." - Mike T.</p>
            </div>
          </div>

          {/* Right: The Configurator (Sticky) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <StickerConfigurator product={product} />
              
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                   <Truck className="w-4 h-4" /> Free Shipping
                </div>
                <div className="flex items-center gap-1">
                   <Check className="w-4 h-4" /> Online Proof
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}