import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Star, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RelatedProducts({ currentProduct }) {
  const { data: relatedProducts = [], isLoading } = useQuery({
    queryKey: ['related-products', currentProduct?.category_id],
    queryFn: async () => {
      if (!currentProduct?.category_id) return [];
      const products = await base44.entities.Product.filter({ 
        category_id: currentProduct.category_id,
        is_active: true 
      }, 'is_popular', 4);
      // Filter out current product
      return products.filter(p => p.id !== currentProduct.id).slice(0, 4);
    },
    enabled: !!currentProduct?.category_id,
  });

  if (isLoading) return <div className="grid grid-cols-4 gap-4"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>;
  if (relatedProducts.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
        <Link 
          to={createPageUrl('Products') + `?category=${currentProduct.category_id}`}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
        >
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <Link 
            key={product.id}
            to={createPageUrl('ProductDetail') + `?slug=${product.slug}`}
            className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-all"
          >
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="ml-1 text-gray-500">{product.average_rating || 4.5}</span>
                </div>
                <span className="font-bold text-gray-900">${product.base_price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}