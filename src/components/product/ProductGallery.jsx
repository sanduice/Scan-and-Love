import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageWithFallback from '@/components/ImageWithFallback';

export default function ProductGallery({ product }) {
  const [selectedImage, setSelectedImage] = useState(0);
  
  const images = [
    product.image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean);

  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800');
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
        <ImageWithFallback
          src={images[selectedImage]}
          alt={product.name}
          className="w-full h-full object-cover"
          fallbackText="Main Image"
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index ? 'border-[#2196F3] ring-2 ring-[#2196F3]/20' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ImageWithFallback 
                src={img} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Product Description */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-600 leading-relaxed">
          {product.long_description || product.short_description}
        </p>
        
        {product.features && product.features.length > 0 && (
          <ul className="mt-6 space-y-3">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#8BC34A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#8BC34A]" />
                </div>
                <span className="text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}