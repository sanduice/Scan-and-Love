import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowRight, Truck, Clock, Shield, Award, Loader2 } from 'lucide-react';

export default function AllProducts() {
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list('order'),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
  });

  if (loadingCats || loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const productsByCategory = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">All Products</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Browse our complete selection of custom signs, banners, displays, and more.
            Everything you need for professional signage.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Next Day Production', desc: 'Order by 5PM EST' },
              { icon: Truck, title: 'Free Shipping', desc: 'On orders $99+' },
              { icon: Shield, title: 'Quality Guarantee', desc: '100% Satisfaction' },
              { icon: Award, title: 'Best Prices', desc: 'Wholesale pricing' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{f.title}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories with Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {productsByCategory.filter(c => c.products.length > 0).map((category) => (
          <div key={category.id} className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                <p className="text-gray-600">{category.description}</p>
              </div>
              <Link to={createPageUrl('Products') + `?category=${category.slug}`}>
                <Button variant="outline">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {category.products.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  to={createPageUrl('ProductDetail') + `?id=${product.id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {product.is_popular && (
                      <Badge className="absolute top-2 left-2 bg-orange-500">
                        <Star className="w-3 h-3 mr-1 fill-current" /> Popular
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {product.short_description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        From ${product.base_price?.toFixed(2)}
                      </span>
                      {product.average_rating && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {product.average_rating}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Something Custom?</h2>
          <p className="text-green-100 mb-6">
            Use our free online design tool to create your perfect sign or banner
          </p>
          <Link to={createPageUrl('DesignTool') + '?product=vinyl-banner'}>
            <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100">
              Start Designing Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}