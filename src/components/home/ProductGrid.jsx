import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ImageWithFallback from '@/components/ImageWithFallback';

export default function ProductGrid({ products, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border">
            <Skeleton className="h-48 w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        // Sale Logic
        const isOnSale = product.is_on_sale;
        const salePercent = product.sale_percentage || 0;
        const originalPrice = product.base_price || 0;
        const displayPrice = isOnSale && salePercent > 0 
          ? (originalPrice * (1 - salePercent / 100)).toFixed(2) 
          : originalPrice.toFixed(2);

        return (
          <Link 
            key={product.id} 
            to={createPageUrl('ProductDetail') + `?slug=${product.slug}`}
            className="group"
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-full flex flex-col">
              <div className="aspect-[4/3] overflow-hidden bg-gray-50 relative">
                <ImageWithFallback
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  fallbackText="Product Image"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.is_popular && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      POPULAR
                    </span>
                  )}
                  {isOnSale && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      SALE {salePercent}% OFF
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2196F3] transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.average_rating || 4.5)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-1">
                    {(product.review_count || 0).toLocaleString()} Reviews
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                  {product.short_description}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">Starting at</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-bold ${isOnSale ? 'text-red-600' : 'text-gray-900'}`}>
                        ${displayPrice}
                      </span>
                      {isOnSale && (
                        <span className="text-sm text-gray-400 line-through">
                          ${originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}