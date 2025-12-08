import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Universal pricing calculator that fetches from database
export function usePricing(productType, material, options = {}) {
  const { width = 0, height = 0, quantity = 1, sizeKey = null } = options;

  const { data: pricingTiers = [] } = useQuery({
    queryKey: ['pricing-tiers', productType],
    queryFn: () => base44.entities.PricingTier.filter({ product_type: productType, is_active: true }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product details for sale info
  const { data: productInfo } = useQuery({
    queryKey: ['product-sale-info', productType],
    queryFn: async () => {
      const res = await base44.entities.Product.filter({ slug: productType });
      return res[0];
    },
    enabled: !!productType
  });

  const pricing = useMemo(() => {
    // Find matching tier or fallback
    let tier = pricingTiers.find(t => 
      t.material === material && 
      (sizeKey ? t.size_key === sizeKey : !t.size_key)
    );
    
    if (!tier) tier = pricingTiers.find(t => t.material === material);
    if (!tier && pricingTiers.length > 0) tier = pricingTiers[0];

    // Base calculations
    let unitPrice = 0;
    let total = 0;
    let pricePerUnit = 0;
    const sqft = (width * height) / 144;
    const sqin = width * height;
    let smartUsed = false;

    // 1. Try Smart Curve Logic
    // Use smart curve if:
    // a) No sizeKey (custom size) OR
    // b) sizeKey exists but no matching DB tier found (fallback to calculated)
    if ((!sizeKey || !tier) && width > 0 && height > 0) {
       const smartTotal = calculateSmartCurve(productType, width, height, quantity);
       if (smartTotal !== null) {
          total = smartTotal;
          unitPrice = total / quantity;
          pricePerUnit = unitPrice / (tier?.pricing_method === 'per_sqin' ? sqin : sqft || 1);
          smartUsed = true;
       }
    }

    // 2. Tier Logic (only if Smart Curve wasn't used)
    if (!smartUsed && tier) {
      let qtyBreaks = [];
      try {
        qtyBreaks = tier.quantity_breaks_json ? JSON.parse(tier.quantity_breaks_json) : [];
      } catch (e) {}

      pricePerUnit = tier.base_price;
      for (const breakpoint of qtyBreaks.sort((a, b) => b.qty - a.qty)) {
        if (quantity >= breakpoint.qty) {
          pricePerUnit = breakpoint.price;
          break;
        }
      }

      switch (tier.pricing_method) {
        case 'per_sqft':
          unitPrice = sqft * pricePerUnit;
          total = unitPrice * quantity;
          break;
        case 'per_sqin':
          unitPrice = sqin * pricePerUnit;
          total = unitPrice * quantity;
          break;
        case 'fixed':
        case 'tiered_qty':
          unitPrice = pricePerUnit;
          total = unitPrice * quantity;
          break;
        default:
          unitPrice = pricePerUnit;
          total = unitPrice * quantity;
      }

      if (tier.min_price && unitPrice < tier.min_price) {
        unitPrice = tier.min_price;
        total = unitPrice * quantity;
      }
      if (tier.setup_fee) {
        total += tier.setup_fee;
      }
    }

    // 3. Sale / Discount Logic
    const regularUnitPrice = unitPrice;
    const regularTotal = total;
    let saleUnitPrice = unitPrice;
    let saleTotal = total;
    let isOnSale = false;
    let salePercentage = 0;

    if (productInfo && (productInfo.is_on_sale || productInfo.sale_percentage > 0)) {
      isOnSale = true;
      
      // Percentage discount
      if (productInfo.sale_percentage > 0) {
        salePercentage = productInfo.sale_percentage;
        saleUnitPrice = unitPrice * (1 - (salePercentage / 100));
        saleTotal = saleUnitPrice * quantity;
      } 
      // Fixed sale price (only works for fixed products really, but handling simplified)
      else if (productInfo.sale_price > 0) {
        // If a fixed sale price is set on the product entity, it might override calc
        // Usually better to use percentage for variable products
        // We'll calculate implied percentage
        if (tier?.pricing_method === 'fixed' && productInfo.base_price) {
           salePercentage = ((productInfo.base_price - productInfo.sale_price) / productInfo.base_price) * 100;
           saleUnitPrice = productInfo.sale_price; // Use the explicit sale price if fixed
           saleTotal = saleUnitPrice * quantity;
        }
      }
    }

    return {
      unitPrice: Math.round(saleUnitPrice * 100) / 100,
      total: Math.round(saleTotal * 100) / 100,
      regularUnitPrice: Math.round(regularUnitPrice * 100) / 100,
      regularTotal: Math.round(regularTotal * 100) / 100,
      isOnSale,
      salePercentage: Math.round(salePercentage),
      sqft: Math.round(sqft * 100) / 100,
      sqin: Math.round(sqin * 100) / 100,
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      tier,
    };
  }, [pricingTiers, productInfo, material, width, height, quantity, sizeKey]);

  return pricing;
}

// Hardcoded fallback pricing - verified from signs.com & vistaprint Nov 2024
export const FALLBACK_PRICING = {
  'vinyl-banner': {
    // Signs.com: ~$3.50/sqft for 13oz, quantity discounts
    '13 oz Vinyl': { perSqft: 3.50, breaks: { 1: 3.50, 2: 3.25, 5: 2.95, 10: 2.65, 25: 2.35, 50: 2.10, 100: 1.85 }, min: 29.99 },
    '18 oz Vinyl': { perSqft: 4.25, breaks: { 1: 4.25, 2: 4.00, 5: 3.70, 10: 3.40, 25: 3.10, 50: 2.85, 100: 2.60 }, min: 39.99 },
  },
  'retractable-banner': {
    // Signs.com verified: Standard 24x81=$89, 33x81=$114.19, 47x81=$149
    '24x81': { fixed: 89.99, breaks: { 1: 89.99, 2: 84.99, 5: 79.99, 10: 74.99 } },
    '33x81': { fixed: 114.19, breaks: { 1: 114.19, 2: 109.99, 5: 99.99, 10: 94.99 } },
    '33x78': { fixed: 109.99, breaks: { 1: 109.99, 2: 104.99, 5: 94.99, 10: 89.99 } },
    '47x81': { fixed: 149.99, breaks: { 1: 149.99, 2: 139.99, 5: 129.99, 10: 119.99 } },
    // Premium sizes
    '36x92': { fixed: 189.99, breaks: { 1: 189.99, 2: 179.99, 5: 169.99, 10: 159.99 } },
    '48x92': { fixed: 229.99, breaks: { 1: 229.99, 2: 219.99, 5: 199.99, 10: 189.99 } },
  },
  'plastic-sign': {
    '3mm PVC': { perSqft: 8.50, breaks: { 1: 8.50, 2: 7.75, 5: 7.00, 10: 6.25, 25: 5.50, 50: 4.95 }, min: 19.99 },
    '6mm PVC': { perSqft: 10.50, breaks: { 1: 10.50, 2: 9.75, 5: 9.00, 10: 8.25, 25: 7.50, 50: 6.95 }, min: 24.99 },
  },
  'yard-sign': {
    // Coroplast pricing competitive with signs.com
    'Coroplast 4mm': { perSqft: 5.50, breaks: { 1: 5.50, 2: 5.00, 5: 4.25, 10: 3.50, 25: 2.95, 50: 2.50, 100: 2.25 }, min: 12.99 },
  },
  'sticker': {
    'White Vinyl Matte': { perSqin: 0.08, breaks: { 50: 0.08, 100: 0.06, 250: 0.045, 500: 0.035, 1000: 0.025, 2500: 0.018, 5000: 0.012 }, min: 25 },
    'White Vinyl Glossy': { perSqin: 0.09, breaks: { 50: 0.09, 100: 0.07, 250: 0.05, 500: 0.04, 1000: 0.03, 2500: 0.02, 5000: 0.014 }, min: 25 },
    'Clear Vinyl': { perSqin: 0.12, breaks: { 50: 0.12, 100: 0.10, 250: 0.07, 500: 0.05, 1000: 0.04, 2500: 0.03, 5000: 0.02 }, min: 35 },
    'Holographic': { perSqin: 0.18, breaks: { 50: 0.18, 100: 0.15, 250: 0.12, 500: 0.09, 1000: 0.07, 2500: 0.05, 5000: 0.04 }, min: 45 },
  },
  'foam-board': {
    '3/16" Foam Board': { perSqft: 6.50, breaks: { 1: 6.50, 2: 5.95, 5: 5.40, 10: 4.85, 25: 4.30 }, min: 18.99 },
    '1/2" Foam Board': { perSqft: 8.50, breaks: { 1: 8.50, 2: 7.95, 5: 7.40, 10: 6.85, 25: 6.30 }, min: 24.99 },
  },
  'mesh-banner': {
    '8oz Mesh Vinyl': { perSqft: 4.50, breaks: { 1: 4.50, 5: 4.00, 10: 3.50 }, min: 39.99 },
  },
  'fabric-banner': {
    'Polyester Fabric': { perSqft: 6.00, breaks: { 1: 6.00, 5: 5.50, 10: 5.00 }, min: 45.00 },
  },
  'step-and-repeat': {
    '13oz Matte Vinyl': { perSqft: 4.00, breaks: { 1: 4.00, 2: 3.75 }, min: 150.00 },
    'Fabric': { perSqft: 6.50, breaks: { 1: 6.50, 2: 6.00 }, min: 200.00 },
  },
  'table-throw': {
    '6ft Table Throw (3-sided)': { fixed: 159.00 },
    '6ft Table Throw (4-sided)': { fixed: 179.00 },
    '8ft Table Throw (4-sided)': { fixed: 199.00 },
  },
  'pop-up-display': {
    '8ft Straight': { fixed: 699.00 },
    '10ft Straight': { fixed: 899.00 },
  },
  'a-frame-sign': {
    'Standard A-Frame': { fixed: 89.00 }, // Hardware + 2 inserts
    'Deluxe A-Frame': { fixed: 129.00 },
  },
  'car-magnet': {
    '30mil Magnet': { perSqft: 12.00, min: 35.00 },
  },
  'aluminum-sign': {
    'Aluminum .040': { perSqft: 10.00, min: 25.00 },
    'Aluminum .080': { perSqft: 15.00, min: 35.00 },
  },
  'acrylic-sign': {
    'Clear Acrylic': { perSqft: 18.00, min: 45.00 },
  },
  'canvas-print': {
    'Standard Canvas': { perSqft: 14.00, min: 30.00 },
  },
  'die-cut-sticker': {
    'White Vinyl': { perSqin: 0.08, min: 45.00 },
  },
  'transfer-sticker': {
    'Standard Vinyl': { perSqin: 0.12, min: 55.00 },
  },
  'static-cling': {
    'White Static Cling': { perSqin: 0.09, min: 35.00 },
  },
  'floor-decal': {
    'Anti-Slip Vinyl': { perSqft: 8.00, min: 35.00 },
  },
  'vinyl-lettering': {
    'Standard Vinyl': { perSqin: 0.06, min: 25.00 },
  },
  'window-perf': {
    'Perforated Vinyl': { perSqft: 6.50, min: 45.00 },
  },
  'x-banner': {
    '24" x 63"': { fixed: 45.00 },
    '32" x 70"': { fixed: 55.00 },
  },
  'kiss-cut-sticker': {
    'White Vinyl': { perSqin: 0.09, min: 25.00 },
  },
  'clear-sticker': {
    'Clear Vinyl': { perSqin: 0.12, min: 35.00 },
  },
  'holographic-sticker': {
    'Holographic Vinyl': { perSqin: 0.18, min: 45.00 },
  },
  'bumper-sticker': {
    'White Vinyl': { perSqin: 0.06, min: 25.00 },
  },
  'roll-labels': {
    'Paper': { perSqin: 0.03, min: 50.00 },
    'BOPP': { perSqin: 0.04, min: 60.00 },
  },
  'pole-banner': {
    '18" x 36"': { fixed: 65.00 },
    '24" x 48"': { fixed: 85.00 },
    '30" x 60"': { fixed: 115.00 },
  },
  'safety-sign': {
    'Aluminum .040': { perSqft: 14.00, min: 20.00 },
    'Plastic': { perSqft: 9.00, min: 15.00 },
  },
  'poster-print': {
    'Semi-Gloss Paper': { perSqft: 6.00, min: 15.00 },
  },
  'frosted-decal': {
    'Frosted Vinyl': { perSqft: 12.00, min: 35.00 },
  },
  'real-estate-frame': {
    '18" x 24" Frame': { fixed: 45.00 },
    '24" x 36" Frame': { fixed: 65.00 },
  },
};

// Smart Pricing Algorithm to mimic industry standards (StickerMule, Signs.com)
function calculateSmartCurve(productType, width, height, quantity) {
  const totalSqIn = width * height * quantity;
  const totalSqFt = totalSqIn / 144;
  
  let rate = 0;
  let baseSetup = 0;
  let minOrder = 0;

  // Refined Smart Curves based on market analysis (Signs.com / BannerBuzz / Etc)

  // 1. Stickers & Decals (Per Sq Inch logic with heavy volume decay)
  if (productType.includes('sticker') || productType.includes('decal') || productType.includes('label') || productType.includes('cling')) {
    // Market: Small qtys ~$1-2/each, Bulk <$0.10/sqin
    // Formula: Rate = Base * (TotalSqIn ^ -0.45) + MinMaterialCost
    const baseRate = 2.20; 
    const decay = 0.45; 
    let ratePerSqIn = baseRate * Math.pow(totalSqIn, -decay);

    // Specific adjustments
    if (productType.includes('holographic')) ratePerSqIn *= 1.5;
    if (productType.includes('transfer')) ratePerSqIn *= 1.8;
    if (productType.includes('floor')) ratePerSqIn *= 0.8; // Floor decals usually larger, cheaper per in
    if (productType.includes('window')) ratePerSqIn *= 1.1;

    // Clamp rate (Min $0.005/sqin for massive bulk, Max $0.75/sqin for tiny singles)
    const finalRate = Math.max(0.005, Math.min(0.75, ratePerSqIn));

    const rawTotal = totalSqIn * finalRate;
    minOrder = 25; 
    return Math.max(minOrder, rawTotal);
  }

  // 2. Vinyl Banners (Per Sq Ft - Highly commoditized)
  if (productType.includes('banner') && !productType.includes('retractable') && !productType.includes('x-banner')) {
    // Market: $3-5/sqft standard, drop to <$2/sqft bulk
    let ratePerSqFt = 3.99; // Base

    if (totalSqFt > 36) ratePerSqFt = 2.99;   // > 3x12
    if (totalSqFt > 72) ratePerSqFt = 2.49;   // > 2 big banners
    if (totalSqFt > 150) ratePerSqFt = 1.99;  // Bulk
    if (totalSqFt > 500) ratePerSqFt = 1.49;  // Wholesale
    if (totalSqFt > 1000) ratePerSqFt = 0.99; // Factory direct

    // Material adjustments
    if (productType.includes('mesh')) ratePerSqFt += 1.00;
    if (productType.includes('fabric')) ratePerSqFt += 2.50; // Fabric is premium
    if (productType.includes('pole')) ratePerSqFt += 3.00; // Pole banner (heavy duty + pockets usually)

    minOrder = 29;
    // Pole banners often have high min because of hardware or finishing
    if (productType.includes('pole')) minOrder = 59;

    return Math.max(minOrder, totalSqFt * ratePerSqFt);
    }

  // 3. Yard Signs (Per Unit + SqFt - Coroplast)
  if (productType.includes('yard')) {
    // Market: 18x24 single ~$15-20. 100 qty ~$3-4 each.
    const sqftPerSign = (width * height) / 144;

    // Cost per sign = (Material * SqFt) + (PrintSetup / Qty) + Handling
    // This curve mimics the steep drop for yard signs
    let unitBase = 0;

    if (quantity < 5) unitBase = 12.00 + (sqftPerSign * 3.00);
    else if (quantity < 10) unitBase = 8.00 + (sqftPerSign * 2.50);
    else if (quantity < 25) unitBase = 5.50 + (sqftPerSign * 2.00);
    else if (quantity < 50) unitBase = 4.00 + (sqftPerSign * 1.50);
    else if (quantity < 100) unitBase = 2.75 + (sqftPerSign * 1.25);
    else unitBase = 1.99 + (sqftPerSign * 1.00); // Bulk

    minOrder = 15;
    return Math.max(minOrder, unitBase * quantity);
  }

  // 4. Rigid Signs (Aluminum, Acrylic, PVC, Foam)
  if (productType.includes('aluminum') || productType.includes('acrylic') || productType.includes('plastic') || productType.includes('pvc') || productType.includes('foam') || productType.includes('board')) {
    let ratePerSqFt = 12.00;

    if (productType.includes('foam')) ratePerSqFt = 9.00;
    if (productType.includes('pvc') || productType.includes('plastic')) ratePerSqFt = 11.00;
    if (productType.includes('aluminum')) ratePerSqFt = 14.00;
    if (productType.includes('acrylic')) ratePerSqFt = 22.00; // Expensive material

    // Volume discount
    if (totalSqFt > 20) ratePerSqFt *= 0.92;
    if (totalSqFt > 50) ratePerSqFt *= 0.85;
    if (totalSqFt > 100) ratePerSqFt *= 0.78;
    if (totalSqFt > 500) ratePerSqFt *= 0.70;

    minOrder = 25;
    // Acrylic minimum is higher
    if (productType.includes('acrylic')) minOrder = 45;

    return Math.max(minOrder, totalSqFt * ratePerSqFt);
  }

  // 5. Displays & Stands (Fixed hardware cost + Print)
  if (productType.includes('retractable') || productType.includes('step') || productType.includes('flag') || productType.includes('throw') || productType.includes('pop-up') || productType.includes('x-banner')) {
     // These are usually standardized, but if custom size:
     let hardwareBase = 40.00; // Generic hardware guess
     let printRate = 5.00; // SqFt print

     if (productType.includes('flag')) { hardwareBase = 60; printRate = 6; }
     if (productType.includes('step')) { hardwareBase = 120; printRate = 4; }
     if (productType.includes('pop')) { hardwareBase = 400; printRate = 8; }

     // Volume on prints only
     if (quantity > 1) hardwareBase *= 0.95; // Slight hardware discount
     if (quantity > 5) hardwareBase *= 0.90;

     return (hardwareBase + (totalSqFt / quantity * printRate)) * quantity;
  }

  // 6. Magnets (Per Sq Ft - thick material)
  if (productType.includes('magnet')) {
    let ratePerSqFt = 10.00;
    if (totalSqFt > 20) ratePerSqFt = 8.50;
    if (totalSqFt > 50) ratePerSqFt = 7.00;
    
    minOrder = 35;
    return Math.max(minOrder, totalSqFt * ratePerSqFt);
  }

  // 7. Canvas & Posters (Per Sq Ft - Fine art)
  if (productType.includes('canvas') || productType.includes('poster')) {
    let ratePerSqFt = 8.00; // Poster
    if (productType.includes('canvas')) ratePerSqFt = 18.00; // Canvas is wrapped

    if (totalSqFt > 20) ratePerSqFt *= 0.90;
    if (totalSqFt > 50) ratePerSqFt *= 0.80;

    minOrder = 30;
    return Math.max(minOrder, totalSqFt * ratePerSqFt);
  }

  // 8. Safety Signs (Usually small rigid)
  if (productType.includes('safety')) {
    // Treat as rigid aluminum usually
    let ratePerSqFt = 14.00;
    minOrder = 20;
    return Math.max(minOrder, totalSqFt * ratePerSqFt);
  }

  // 9. Frames & Hardware
  if (productType.includes('frame')) {
    // Real estate frames
    // Fixed pricing logic better, but for smart curve:
    // Approx $30-50 per unit
    let unitPrice = 45.00;
    if (width > 30) unitPrice = 65.00; // Larger frame
    
    // Volume
    if (quantity > 5) unitPrice *= 0.9;
    if (quantity > 25) unitPrice *= 0.8;

    return unitPrice * quantity;
  }

  // 10. Generic Catch-All
  if (width > 0 && height > 0) {
     const ratePerSqFt = 6.00;
     minOrder = 25;
     return Math.max(minOrder, totalSqFt * ratePerSqFt);
  }

  return null; // No smart curve found
}

// Simple calculate function using fallback
export function calculatePrice(productType, material, options = {}) {
  const { width = 0, height = 0, quantity = 1, sizeKey = null } = options;
  
  // Try Smart Curve first for custom sizing
  if (!sizeKey && width > 0 && height > 0) {
    const smartTotal = calculateSmartCurve(productType, width, height, quantity);
    if (smartTotal !== null) {
      const unitPrice = smartTotal / quantity;
      const sqft = (width * height) / 144;
      return {
        unitPrice: Math.round(unitPrice * 100) / 100,
        total: Math.round(smartTotal * 100) / 100,
        sqft: Math.round(sqft * 100) / 100,
        sqin: Math.round((width * height) * 100) / 100,
        pricePerUnit: 0, // Variable in smart curve
      };
    }
  }

  const productPricing = FALLBACK_PRICING[productType];
  if (!productPricing) return { unitPrice: 0, total: 0 };

  const materialPricing = productPricing[material] || productPricing[sizeKey] || Object.values(productPricing)[0];
  if (!materialPricing) return { unitPrice: 0, total: 0 };

  // Get price for quantity from breaks
  const breaks = materialPricing.breaks || {};
  const sortedBreaks = Object.entries(breaks).sort((a, b) => Number(b[0]) - Number(a[0]));
  let pricePerUnit = materialPricing.perSqft || materialPricing.perSqin || materialPricing.fixed || 0;
  
  for (const [qty, price] of sortedBreaks) {
    if (quantity >= Number(qty)) {
      pricePerUnit = price;
      break;
    }
  }

  let unitPrice = 0;
  const sqft = (width * height) / 144;
  const sqin = width * height;

  if (materialPricing.perSqft) {
    unitPrice = sqft * pricePerUnit;
  } else if (materialPricing.perSqin) {
    unitPrice = sqin * pricePerUnit;
  } else if (materialPricing.fixed) {
    unitPrice = pricePerUnit;
  }

  // Apply minimum
  if (materialPricing.min && unitPrice < materialPricing.min) {
    unitPrice = materialPricing.min;
  }

  const total = unitPrice * quantity;

  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    total: Math.round(total * 100) / 100,
    sqft: Math.round(sqft * 100) / 100,
    sqin: Math.round(sqin * 100) / 100,
    pricePerUnit: Math.round(pricePerUnit * 100) / 100,
  };
}

export default function PricingDisplay({ productType, material, width, height, quantity, sizeKey }) {
  const pricing = usePricing(productType, material, { width, height, quantity, sizeKey });
  
  if (!pricing.total) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Unit Price</span>
        <div className="text-right">
          {pricing.isOnSale && (
            <span className="text-gray-400 line-through mr-2 text-xs">
              ${pricing.regularUnitPrice.toFixed(2)}
            </span>
          )}
          <span className={`font-medium ${pricing.isOnSale ? 'text-red-600' : ''}`}>
            ${pricing.unitPrice.toFixed(2)}
          </span>
        </div>
      </div>
      {quantity > 1 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantity</span>
          <span className="font-medium">×{quantity}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>Total</span>
        <div className="text-right">
          {pricing.isOnSale && (
            <div className="text-xs text-gray-400 line-through font-normal">
              ${pricing.regularTotal.toFixed(2)}
            </div>
          )}
          <span className={pricing.isOnSale ? 'text-red-600' : 'text-green-600'}>
            ${pricing.total.toFixed(2)}
          </span>
        </div>
      </div>
      {pricing.isOnSale && pricing.salePercentage > 0 && (
        <div className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded text-center">
          SAVE {pricing.salePercentage}% TODAY
        </div>
      )}
    </div>
  );
}