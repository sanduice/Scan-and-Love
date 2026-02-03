import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShopifyProduct } from '@/hooks/useShopifyProducts';
import { useShopifyCartStore } from '@/stores/shopifyCartStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/ImageWithFallback';
import { toast } from 'sonner';

export default function ShopifyProductDetail() {
  const { handle } = useParams();
  const { product, loading, error } = useShopifyProduct(handle || '');
  const addItem = useShopifyCartStore(state => state.addItem);
  const isCartLoading = useShopifyCartStore(state => state.isLoading);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error || 'Product not found'}</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const { node } = product;
  const images = node.images?.edges || [];
  const variants = node.variants?.edges || [];
  const options = node.options || [];

  // Find matching variant based on selected options
  const findMatchingVariant = () => {
    if (variants.length === 1) return variants[0].node;
    
    return variants.find(v => {
      return v.node.selectedOptions.every(opt => 
        selectedOptions[opt.name] === opt.value
      );
    })?.node || variants[0]?.node;
  };

  const selectedVariant = findMatchingVariant();
  const currentImage = images[selectedImageIndex]?.node;

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select all options');
      return;
    }

    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions
    });

    toast.success(`Added ${quantity}x "${node.title}" to cart`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {currentImage ? (
              <ImageWithFallback
                src={currentImage.url}
                alt={currentImage.altText || node.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    idx === selectedImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <ImageWithFallback
                    src={img.node.url}
                    alt={img.node.altText || `${node.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{node.title}</h1>
            <p className="text-2xl font-semibold text-primary">
              ${parseFloat(selectedVariant?.price.amount || '0').toFixed(2)} {selectedVariant?.price.currencyCode}
            </p>
          </div>

          {node.description && (
            <p className="text-muted-foreground">{node.description}</p>
          )}

          {/* Options */}
          {options.filter(opt => opt.values.length > 1).map(option => (
            <div key={option.name} className="space-y-2">
              <label className="text-sm font-medium">{option.name}</label>
              <Select
                value={selectedOptions[option.name] || option.values[0]}
                onValueChange={(value) => handleOptionChange(option.name, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {option.values.map(value => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(q => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            disabled={isCartLoading || !selectedVariant?.availableForSale}
          >
            {isCartLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : !selectedVariant?.availableForSale ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart - ${(parseFloat(selectedVariant?.price.amount || '0') * quantity).toFixed(2)}
              </>
            )}
          </Button>

          {!selectedVariant?.availableForSale && (
            <p className="text-sm text-destructive text-center">
              This product is currently out of stock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
