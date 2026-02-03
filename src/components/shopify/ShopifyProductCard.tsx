import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useShopifyCartStore } from '@/stores/shopifyCartStore';
import ImageWithFallback from '@/components/ImageWithFallback';
import type { ShopifyProduct } from '@/lib/shopify/types';
import { toast } from 'sonner';

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

export function ShopifyProductCard({ product }: ShopifyProductCardProps) {
  const addItem = useShopifyCartStore(state => state.addItem);
  const isLoading = useShopifyCartStore(state => state.isLoading);

  const { node } = product;
  const imageUrl = node.images?.edges?.[0]?.node?.url;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants?.edges?.[0]?.node;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) {
      toast.error('This product is not available');
      return;
    }

    await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    });

    toast.success(`Added "${node.title}" to cart`);
  };

  return (
    <Link to={`/shopify-product/${node.handle}`}>
      <Card className="group hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt={node.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {node.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
            {node.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="text-lg font-bold">
            ${parseFloat(price.amount).toFixed(2)} {price.currencyCode}
          </span>
          <Button 
            size="sm" 
            onClick={handleAddToCart}
            disabled={isLoading || !firstVariant?.availableForSale}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ShopifyProductCard;
