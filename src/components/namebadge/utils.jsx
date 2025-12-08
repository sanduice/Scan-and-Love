/**
 * Centralized pricing logic for Name Badges to ensure consistency 
 * between the Designer, Names Entry, and Cart.
 */

export const QUANTITY_TIERS = [
  { min: 1, max: 10, discount: 0 },
  { min: 11, max: 20, discount: 0.04 },
  { min: 21, max: 30, discount: 0.06 },
  { min: 31, max: 50, discount: 0.08 },
  { min: 51, max: 100, discount: 0.11 },
  { min: 101, max: 250, discount: 0.15 },
  { min: 251, max: 1000, discount: 0.18 },
  { min: 1001, max: Infinity, discount: 0.25 },
];

export const calculateNameBadgePrice = ({
  sizeShape = '1x3-rectangle',
  background = 'white-plastic',
  border = 'none',
  fastener = 'magnetic',
  dome = false,
  quantity = 1
}) => {
  // 1. Determine Base Price (Standard 1x3 White with Magnet)
  let base = 9.99;

  // 2. Size Adjustments
  if (sizeShape === '2x3-rectangle') base += 1.00;
  if (sizeShape === '1.5x3-oval') base += 0.50;

  // 3. Material/Background Adjustments
  if (background && (background.includes('gold-metallic') || background.includes('silver-metallic'))) base += 1.00; // Premium
  if (background && background.includes('wood')) base += 2.00; // Wood

  // 4. Border Adjustments
  // "Executive" frames are real metal
  if (border === 'gold' || border === 'silver') {
    base += 4.00; 
  } else if (border !== 'none') {
    // Printed borders
    base += 0.50;
  }

  // 5. Fastener Adjustments
  // We assume Base $9.99 includes Magnetic. 
  // If they pick Pin, it's cheaper.
  if (fastener === 'pin') base -= 1.00;
  if (fastener === 'pocket-clip') base -= 0.25;
  if (fastener === 'military-clutch') base -= 0.50;
  if (fastener === 'swivel-clip') base -= 0.50;

  // 6. Dome Coating
  if (dome) base += 1.50;

  // 7. Calculate Quantity Discount
  const tier = QUANTITY_TIERS.find(t => quantity >= t.min && quantity <= t.max);
  const discountPercent = tier ? tier.discount : 0;
  
  const unitPrice = base * (1 - discountPercent);

  return {
    basePrice: base,
    unitPrice: Number(unitPrice.toFixed(2)),
    totalPrice: Number((unitPrice * quantity).toFixed(2)),
    discountPercent
  };
};

export const getQuantityTier = (qty) => {
  return QUANTITY_TIERS.find(t => qty >= t.min && qty <= t.max);
};