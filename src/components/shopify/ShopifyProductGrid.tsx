import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { ShopifyProductCard } from './ShopifyProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';

interface ShopifyProductGridProps {
  limit?: number;
  query?: string;
  title?: string;
}

export function ShopifyProductGrid({ limit = 20, query, title = "Shopify Products" }: ShopifyProductGridProps) {
  const { products, loading, error } = useShopifyProducts(limit, query);

  if (loading) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading products: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Shopify Products Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your Shopify store doesn't have any products. Create products by telling me what you want to sell and the price.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ShopifyProductCard key={product.node.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ShopifyProductGrid;
