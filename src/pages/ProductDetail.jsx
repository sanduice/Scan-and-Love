import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import StickerLandingView from '@/components/product/StickerLandingView';
import NameBadgeLandingView from '@/components/product/NameBadgeLandingView';
import ProductConfigurator from '@/components/product/ProductConfigurator';
import ProductGallery from '@/components/product/ProductGallery';
import ProductReviews from '@/components/product/ProductReviews';
import SocialShare from '@/components/SocialShare';
import RelatedProducts from '@/components/product/RelatedProducts';

export default function ProductDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const slug = urlParams.get('slug');
  const productId = urlParams.get('id');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product', slug, productId],
    queryFn: async () => {
      if (productId) {
        return base44.entities.Product.filter({ id: productId });
      }
      return base44.entities.Product.filter({ slug });
    },
    enabled: !!slug || !!productId,
  });

  const product = products[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link to={createPageUrl('Products')}>
            <Button>Browse All Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // SPECIALIZED VIEW ROUTING
  // Stickers -> StickerLandingView (StickerMule style)
  if (product.slug && (product.slug.includes('sticker') || product.slug.includes('label') || product.slug.includes('decal') || product.slug.includes('cling'))) {
    return <StickerLandingView product={product} />;
  }

  // Name Badges -> NameBadgeLandingView (NameBadge.com style)
  if (product.slug && product.slug.includes('name-badge')) {
    return <NameBadgeLandingView product={product} />;
  }

  // STANDARD VIEW (Signs.com style for banners/signs)
  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url ? [product.image_url] : [],
    "description": product.short_description || product.name,
    "sku": product.slug,
    "brand": {
      "@type": "Brand",
      "name": "Netrave Print"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "USD",
      "price": product.is_on_sale && product.sale_price ? product.sale_price : product.base_price,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": product.review_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.average_rating,
      "reviewCount": product.review_count
    } : undefined
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to={createPageUrl('Home')} className="text-gray-500 hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to={createPageUrl('Products')} className="text-gray-500 hover:text-gray-700">Products</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Gallery */}
          <ProductGallery product={product} />

          {/* Right - Configurator */}
          <ProductConfigurator product={product} />
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="mb-8">
             <SocialShare title={`Check out this ${product.name}`} />
          </div>
          <ProductReviews product={product} />
          <RelatedProducts currentProduct={product} />
        </div>
      </div>
    </div>
  );
}