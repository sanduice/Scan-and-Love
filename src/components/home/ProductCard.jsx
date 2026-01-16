import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ImageWithFallback from '@/components/ImageWithFallback';

export default function ProductCard({ product, displayName, linkTo }) {
  // Calculate starting price from preset_sizes or base_price
  const getStartingPrice = () => {
    if (product.preset_sizes && product.preset_sizes.length > 0) {
      const firstSize = product.preset_sizes[0];
      if (firstSize.price) {
        return parseFloat(firstSize.price).toFixed(2);
      }
      // Calculate from dimensions if no price set
      if (firstSize.width && firstSize.height && product.price_per_sqft) {
        return ((firstSize.width * firstSize.height) / 144 * product.price_per_sqft).toFixed(2);
      }
    }
    if (product.base_price) {
      return parseFloat(product.base_price).toFixed(2);
    }
    return null;
  };

  const price = getStartingPrice();

  return (
    <Link 
      to={linkTo || createPageUrl('ProductDetail') + `?slug=${product.slug}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden relative">
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />
        <ImageWithFallback 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
          {displayName || product.name}
        </h3>
        {price && (
          <p className="text-sm text-muted-foreground mt-auto">
            Starting at <span className="font-medium text-foreground">${price}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
