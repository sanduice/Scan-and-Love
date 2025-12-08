import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import StickerLandingView from '@/components/product/StickerLandingView';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function StickerBuilder() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const type = urlParams.get('type') || 'die-cut';
  
  // Map simple type to product slug
  const slugMap = {
    'die-cut': 'die-cut-sticker',
    'kiss-cut': 'kiss-cut-sticker',
    'transfer': 'transfer-sticker',
    'clear': 'clear-sticker',
    'holographic': 'holographic-sticker',
    'static-cling': 'static-cling',
    'floor-decal': 'floor-decal',
    'roll-labels': 'roll-labels',
    'qr-code': 'die-cut-sticker', // Fallback or specific product if exists
  };

  const slug = slugMap[type] || type + '-sticker';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => base44.entities.Product.filter({ slug }),
  });

  const product = products[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!product) {
    // Fallback mock product if DB entry missing, so page doesn't crash
    const mockProduct = {
      name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Stickers',
      slug: type,
      image_url: 'https://images.unsplash.com/photo-1615915468538-0fbd857888ca?w=800',
      short_description: `Custom ${type.replace('-', ' ')} stickers with premium finish.`,
      base_price: 50,
    };
    
    return <StickerLandingView product={mockProduct} />;
  }

  return <StickerLandingView product={product} />;
}