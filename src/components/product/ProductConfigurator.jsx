import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Star, Upload, Palette, Clock, Truck, Shield, ChevronDown, ChevronUp, Check, Info, Loader2
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { usePricing } from '@/components/pricing/PricingCalculator';

// Standard sizes with optional keys for fixed pricing
const STANDARD_SIZES = {
  'vinyl-banner': [
    { label: '2\' × 4\'', width: 24, height: 48 },
    { label: '3\' × 6\'', width: 36, height: 72 },
    { label: '4\' × 8\'', width: 48, height: 96 },
    { label: '3\' × 10\'', width: 36, height: 120 },
  ],
  'yard-sign': [
    { label: '12" × 18"', width: 12, height: 18 },
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 18"', width: 24, height: 18 },
    { label: '24" × 36"', width: 24, height: 36 },
  ],
  'retractable-banner': [
    { label: '24" × 81"', width: 24, height: 81, key: '24x81' },
    { label: '33" × 81"', width: 33, height: 81, key: '33x81' },
    { label: '47" × 81"', width: 47, height: 81, key: '47x81' },
  ],
  'feather-flag': [
    { label: '9 ft Flag', width: 24, height: 102, key: '9 ft Flag' },
    { label: '12 ft Flag', width: 30, height: 138, key: '12 ft Flag' },
    { label: '15 ft Flag', width: 32, height: 170, key: '15 ft Flag' },
  ],
  'table-throw': [
    { label: '6ft (3-sided)', width: 126, height: 84, key: '6ft Table Throw (3-sided)' },
    { label: '6ft (4-sided)', width: 126, height: 84, key: '6ft Table Throw (4-sided)' },
    { label: '8ft (4-sided)', width: 150, height: 90, key: '8ft Table Throw (4-sided)' },
  ],
  'pop-up-display': [
    { label: '8ft Straight', width: 90, height: 90, key: '8ft Straight' },
    { label: '10ft Straight', width: 120, height: 90, key: '10ft Straight' },
  ],
  'step-and-repeat': [
    { label: '8\' × 8\'', width: 96, height: 96, key: '8\' x 8\'' },
    { label: '10\' × 8\'', width: 120, height: 96, key: '10\' x 8\'' },
  ],
  'aluminum-sign': [
    { label: '12" × 18"', width: 12, height: 18 },
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 36"', width: 24, height: 36 },
  ],
  'foam-board': [
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 36"', width: 24, height: 36 },
    { label: '36" × 48"', width: 36, height: 48 },
  ],
  'default': [
    { label: '12" × 18"', width: 12, height: 18 },
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 36"', width: 24, height: 36 },
    { label: '36" × 48"', width: 36, height: 48 },
  ],
  'a-frame-sign': [
    { label: '24" × 36" Frame', width: 24, height: 36, key: '24" x 36" Frame' },
  ],
  'x-banner': [
    { label: '24" × 63"', width: 24, height: 63, key: '24" x 63"' },
    { label: '32" × 70"', width: 32, height: 70, key: '32" x 70"' },
  ],
  'car-magnet': [
    { label: '12" × 18"', width: 12, height: 18 },
    { label: '12" × 24"', width: 12, height: 24 },
    { label: '18" × 24"', width: 18, height: 24 },
  ],
  'acrylic-sign': [
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 36"', width: 24, height: 36 },
    { label: '36" × 48"', width: 36, height: 48 },
  ],
  'pvc-sign': [
    { label: '12" × 18"', width: 12, height: 18 },
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 36"', width: 24, height: 36 },
  ],
  'die-cut-sticker': [
    { label: '3" × 3"', width: 3, height: 3 },
    { label: '4" × 4"', width: 4, height: 4 },
    { label: '5" × 5"', width: 5, height: 5 },
  ],
  'transfer-sticker': [
    { label: '3" × 3"', width: 3, height: 3 },
    { label: '4" × 4"', width: 4, height: 4 },
    { label: '6" × 6"', width: 6, height: 6 },
  ],
  'static-cling': [
    { label: '4" × 4"', width: 4, height: 4 },
    { label: '6" × 6"', width: 6, height: 6 },
  ],
  'floor-decal': [
    { label: '12" × 12"', width: 12, height: 12 },
    { label: '18" × 18"', width: 18, height: 18 },
    { label: '24" × 24"', width: 24, height: 24 },
  ],
  'vinyl-lettering': [
    { label: '6" × 24"', width: 24, height: 6 },
    { label: '12" × 36"', width: 36, height: 12 },
  ],
  'window-perf': [
    { label: '24" × 36"', width: 24, height: 36 },
    { label: '36" × 48"', width: 36, height: 48 },
  ],
  'mesh-banner': [
    { label: '2\' × 4\'', width: 24, height: 48 },
    { label: '3\' × 6\'', width: 36, height: 72 },
    { label: '4\' × 8\'', width: 48, height: 96 },
  ],
  'fabric-banner': [
    { label: '2\' × 4\'', width: 24, height: 48 },
    { label: '3\' × 6\'', width: 36, height: 72 },
    { label: '4\' × 8\'', width: 48, height: 96 },
  ],
  'pole-banner': [
    { label: '18" × 36"', width: 18, height: 36 },
    { label: '24" × 48"', width: 24, height: 48 },
    { label: '30" × 60"', width: 30, height: 60 },
  ],
  'kiss-cut-sticker': [
    { label: '3" × 3"', width: 3, height: 3 },
    { label: '4" × 4"', width: 4, height: 4 },
  ],
  'clear-sticker': [
    { label: '3" × 3"', width: 3, height: 3 },
    { label: '4" × 4"', width: 4, height: 4 },
  ],
  'holographic-sticker': [
    { label: '3" × 3"', width: 3, height: 3 },
    { label: '4" × 4"', width: 4, height: 4 },
  ],
  'bumper-sticker': [
    { label: '3" × 10"', width: 10, height: 3 },
    { label: '4" × 12"', width: 12, height: 4 },
  ],
  'safety-sign': [
    { label: '12" × 18"', width: 12, height: 18 },
    { label: '18" × 24"', width: 18, height: 24 },
  ],
  'canvas-print': [
    { label: '8" × 10"', width: 8, height: 10 },
    { label: '16" × 20"', width: 16, height: 20 },
    { label: '24" × 36"', width: 24, height: 36 },
  ],
  'poster-print': [
    { label: '18" × 24"', width: 18, height: 24 },
    { label: '24" × 36"', width: 24, height: 36 },
  ],
  'frosted-decal': [
    { label: '12" × 12"', width: 12, height: 12 },
    { label: '24" × 24"', width: 24, height: 24 },
  ],
  };

export default function ProductConfigurator({ product }) {
  const navigate = useNavigate();
  const [width, setWidth] = useState(product.default_width || 72);
  const [height, setHeight] = useState(product.default_height || 36);
  const [sizeKey, setSizeKey] = useState(product.default_size_key || null);
  const [quantity, setQuantity] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  
  const [selectedOptions, setSelectedOptions] = useState({
    thickness: product.material_options?.[0]?.name || product.thickness_options?.[0]?.name || 'Standard Material',
    printSide: product.print_side_options?.[0]?.name || 'Single Sided',
    shape: product.shape_options?.[0]?.name,
    finish: product.finish_options?.[0]?.name || 'None',
    grommets: product.grommet_options?.[0]?.name || 'None',
    polePockets: product.pole_pocket_options?.[0]?.name || 'None',
    stakes: product.stake_options?.[0]?.name,
    accessory: 'None',
  });

  const [openSections, setOpenSections] = useState({
    size: true,
    options: false,
  });

  // Initialize selected options from product.product_options when product loads
  useEffect(() => {
    if (product.product_options && Array.isArray(product.product_options) && product.product_options.length > 0) {
      const initialOptions = {};
      product.product_options.forEach(group => {
        if (group.is_visible === false) return;
        const visibleChoices = (group.choices || []).filter(c => c.is_visible !== false);
        // Find default choice or first visible choice
        const defaultChoice = visibleChoices.find(c => c.is_default) || visibleChoices[0];
        if (defaultChoice) {
          initialOptions[group.id] = defaultChoice;
        }
      });
      setSelectedOptions(prev => ({ ...prev, ...initialOptions }));
    }
  }, [product.product_options]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateOption = (key, value) => {
    setSelectedOptions(prev => ({ ...prev, [key]: value }));
  };

  // Update dynamic option with full choice object (including price)
  const updateDynamicOption = (groupId, choice) => {
    setSelectedOptions(prev => ({ ...prev, [groupId]: choice }));
  };

  // Use dynamic pricing hook
  const basePricing = usePricing(product.slug, selectedOptions.thickness || product.material_options?.[0]?.name, { 
    width, 
    height, 
    quantity,
    sizeKey
  });

  // Calculate final price with options/modifiers
  const calculatedPrice = useMemo(() => {
    // Start with base unit price from calculator (includes qty breaks)
    let unitPrice = parseFloat(basePricing.unitPrice) || 0;
    let regularUnitPrice = parseFloat(basePricing.regularUnitPrice) || unitPrice;
    
    // If pricing hook returns 0 (no tier found), use product base price as fallback
    if (unitPrice === 0 && product.base_price) {
       // Simple fallback: base price * sqft (if not fixed)
       const sqft = (width * height) / 144;
       const multiplier = basePricing.tier?.pricing_method === 'fixed' ? 1 : sqft;
       unitPrice = product.base_price * multiplier;
       regularUnitPrice = unitPrice;
    }

    // NEW: Add price modifiers from product_options structure (dynamic options)
    Object.values(selectedOptions).forEach(option => {
      if (option && typeof option === 'object' && option.price !== undefined) {
        const priceModifier = parseFloat(option.price) || 0;
        unitPrice += priceModifier;
        regularUnitPrice += priceModifier;
      }
    });

    // LEGACY: Apply modifiers for backwards compatibility (for products not yet using product_options)
    // Only apply legacy modifiers if product_options is not defined
    if (!product.product_options || product.product_options.length === 0) {
      // Apply modifiers (to both sale and regular)
      if (selectedOptions.printSide === 'Double Sided') {
        unitPrice *= 1.6;
        regularUnitPrice *= 1.6;
      }
      
      // Add option prices from legacy arrays
      const getModifier = (options, selectedName) => {
        const opt = options?.find(o => o.name === selectedName);
        return opt?.price_modifier || opt?.price || 0;
      };

      const modifiers = 
        getModifier(product.finish_options, selectedOptions.finish) +
        getModifier(product.grommet_options, selectedOptions.grommets) +
        getModifier(product.pole_pocket_options, selectedOptions.polePockets);

      unitPrice += modifiers;
      regularUnitPrice += modifiers;
      
      // Accessories are per unit
      const accessoryPrices = {
        'Bungees (8)': 9.99,
        'Zip Ties (10)': 4.99,
        'Rope (4)': 12.99,
        'Hanging Clips (6)': 14.99,
        'Suction Cups (8)': 11.99,
      };
      if (accessoryPrices[selectedOptions.accessory]) {
        unitPrice += accessoryPrices[selectedOptions.accessory];
        regularUnitPrice += accessoryPrices[selectedOptions.accessory];
      }
    }

    const total = unitPrice * quantity;
    const regularTotal = regularUnitPrice * quantity;
    
    return {
      unitPrice: unitPrice.toFixed(2),
      total: total.toFixed(2),
      regularTotal: regularTotal.toFixed(2),
      isOnSale: basePricing.isOnSale,
      salePercentage: basePricing.salePercentage,
      sqft: basePricing.sqft?.toFixed(2) || '0.00',
      perSqFt: basePricing.pricePerUnit?.toFixed(2) || '0.00',
    };
  }, [basePricing, width, height, quantity, selectedOptions, product]);

  // Get standard sizes - prioritize database preset_sizes, then legacy, then hardcoded fallbacks
  const standardSizes = useMemo(() => {
    // Priority 1: New preset_sizes from database (admin-configured)
    if (product.preset_sizes && Array.isArray(product.preset_sizes) && product.preset_sizes.length > 0) {
      return product.preset_sizes
        .filter(size => size.is_active !== false)
        .map(size => ({
          label: size.label || `${size.width}" × ${size.height}"`,
          width: parseFloat(size.width),
          height: parseFloat(size.height),
          price: size.price ? parseFloat(size.price) : undefined,
          key: size.key
        }));
    }
    
    // Priority 2: Legacy standard_sizes field
    if (product.standard_sizes?.length > 0) return product.standard_sizes;
    
    // Priority 3: Hardcoded fallbacks based on slug
    const slug = product.slug || '';
    if (STANDARD_SIZES[slug]) return STANDARD_SIZES[slug];
    if (slug.includes('banner')) return STANDARD_SIZES['vinyl-banner'];
    if (slug.includes('yard')) return STANDARD_SIZES['yard-sign'];
    if (slug.includes('foam')) return STANDARD_SIZES['foam-board'];
    if (slug.includes('alum')) return STANDARD_SIZES['aluminum-sign'];
    if (slug.includes('frame')) return STANDARD_SIZES['a-frame-sign'];
    if (slug.includes('x-banner')) return STANDARD_SIZES['x-banner'];
    if (slug.includes('magnet')) return STANDARD_SIZES['car-magnet'];
    if (slug.includes('acrylic')) return STANDARD_SIZES['acrylic-sign'];
    if (slug.includes('pvc')) return STANDARD_SIZES['pvc-sign'];
    if (slug.includes('sticker')) return STANDARD_SIZES['die-cut-sticker'];
    if (slug.includes('cling')) return STANDARD_SIZES['static-cling'];
    if (slug.includes('floor')) return STANDARD_SIZES['floor-decal'];
    if (slug.includes('lettering')) return STANDARD_SIZES['vinyl-lettering'];
    if (slug.includes('perf')) return STANDARD_SIZES['window-perf'];
    if (slug.includes('mesh')) return STANDARD_SIZES['mesh-banner'];
    if (slug.includes('fabric')) return STANDARD_SIZES['fabric-banner'];
    if (slug.includes('pole')) return STANDARD_SIZES['pole-banner'];
    if (slug.includes('retractable')) return STANDARD_SIZES['retractable-banner'];

    return STANDARD_SIZES['default'];
  }, [product]);

  // Determine if custom sizes are allowed
  const allowCustomSize = useMemo(() => {
    // New field takes priority, then fall back to legacy is_fixed_size check
    if (product.allow_custom_size !== undefined && product.allow_custom_size !== null) {
      return product.allow_custom_size;
    }
    return !product.is_fixed_size;
  }, [product]);

  // Get size unit label
  const sizeUnitLabel = useMemo(() => {
    const unit = product.size_unit || 'inches';
    return unit === 'feet' ? 'in Feet' : 'in Inches';
  }, [product.size_unit]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFileUrl(file_url);
      toast.success('File uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Add to cart with uploaded file
  const handleAddToCart = async () => {
    try {
      await base44.entities.SavedDesign.create({
        name: product.name,
        product_type: product.slug,
        width,
        height,
        quantity,
        unit_price: parseFloat(calculatedPrice.unitPrice),
        is_in_cart: true,
        artwork_url: uploadedFileUrl,
        options_json: JSON.stringify({ ...selectedOptions, sizeKey }),
        material: selectedOptions.thickness,
        finish: selectedOptions.finish,
      });
      toast.success('Added to cart!');
      navigate(createPageUrl('Cart'));
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  // Start design tool
  const startDesigning = () => {
    // Special routing for Stickers
    if (product.slug && (product.slug.includes('sticker') || product.slug.includes('label') || product.slug.includes('cling') || product.slug.includes('decal'))) {
      // Extract type from slug (e.g., 'die-cut-sticker' -> 'die-cut')
      let type = product.slug.replace('-sticker', '').replace('-labels', '').replace('-decal', '').replace('-cling', '');
      if (product.slug === 'roll-labels') type = 'labels';
      if (product.slug === 'static-cling') type = 'static-cling'; // Map if needed
      
      // Default to die-cut if unsure
      if (!['die-cut', 'kiss-cut', 'clear', 'holographic', 'transfer', 'static-cling', 'roll-labels', 'bumper'].some(t => product.slug.includes(t))) {
         type = 'die-cut';
      }
      
      navigate(`${createPageUrl('StickerBuilder')}?type=${type}`);
      return;
    }

    // Special routing for Name Badges
    if (product.slug && product.slug.includes('name-badge')) {
      let type = 'standard';
      if (product.slug.includes('premium')) type = 'premium';
      if (product.slug.includes('executive')) type = 'executive';
      
      let shape = 'rectangle'; // default
      if (product.slug.includes('oval')) {
        shape = 'oval';
        // Oval is usually standard type unless specified otherwise
        if (!product.slug.includes('premium') && !product.slug.includes('executive')) {
           type = 'standard';
        }
      }

      navigate(`${createPageUrl('NameBadgeDesigner')}?type=${type}&shape=${shape}`);
      return;
    }

    let designUrl = `${createPageUrl('DesignTool')}?product=${product.slug || 'vinyl-banner'}&width=${width}&height=${height}`;
    if (sizeKey) {
      designUrl += `&sizeKey=${encodeURIComponent(sizeKey)}`;
    }
    if (selectedOptions.thickness) {
      designUrl += `&material=${encodeURIComponent(selectedOptions.thickness)}`;
    }
    navigate(designUrl);
  };

  const renderOptionGroup = (label, options, selectedKey, optionKey) => {
    if (!options || options.length === 0) return null;

    return (
      <div className="py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">{label}:</span>
          <span className="text-sm text-blue-600 font-medium">{selectedOptions[optionKey]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button
              key={option.name}
              onClick={() => updateOption(optionKey, option.name)}
              className={`p-3 text-left rounded-lg border-2 transition-all ${
                selectedOptions[optionKey] === option.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{option.name}</div>
              {option.description && (
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              )}
              {(option.price_modifier > 0 || option.price > 0) && (
                <div className="text-xs text-green-600 mt-1">+${option.price_modifier || option.price}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // NEW: Render dynamic product options from admin-configured product_options JSONB
  const renderDynamicProductOptions = () => {
    const options = product.product_options || [];
    
    return options
      .filter(group => group.is_visible !== false)
      .map(group => {
        const visibleChoices = (group.choices || []).filter(c => c.is_visible !== false);
        if (visibleChoices.length === 0) return null;
        
        const selectedChoice = selectedOptions[group.id];
        
        return (
          <div key={group.id} className="py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">{group.name}:</span>
              <span className="text-sm text-blue-600 font-medium">
                {selectedChoice?.title || visibleChoices[0]?.title}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {visibleChoices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => updateDynamicOption(group.id, choice)}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    selectedChoice?.id === choice.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{choice.title}</div>
                  {choice.hint && (
                    <div className="text-xs text-gray-500 mt-1">{choice.hint}</div>
                  )}
                  {parseFloat(choice.price) > 0 && (
                    <div className="text-xs text-green-600 mt-1">+${parseFloat(choice.price).toFixed(2)}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-gray-600 mt-2">{product.short_description}</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.average_rating || 4.5)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {(product.review_count || 0).toLocaleString()} Reviews
          </span>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
          <Clock className="w-4 h-4" />
          <span>Next Day Production</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
          <Truck className="w-4 h-4" />
          <span>Free Shipping $99+</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm">
          <Shield className="w-4 h-4" />
          <span>Quality Guarantee</span>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Size Section */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Size ({sizeUnitLabel})</h3>
          
          {/* Quick Sizes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {standardSizes.map((size) => (
              <button
                key={size.label}
                onClick={() => { 
                  setWidth(size.width); 
                  setHeight(size.height);
                  setSizeKey(size.key || null); 
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  width === size.width && height === size.height && (size.key ? sizeKey === size.key : true)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {size.label}
              </button>
            ))}
            {allowCustomSize && (
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Custom
              </button>
            )}
          </div>

          {/* Custom Size Inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-600">W ({product.size_unit === 'feet' ? 'ft' : 'in'}):</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => {
                  setWidth(Math.max(1, Number(e.target.value)));
                  setSizeKey(null); // Custom size invalidates key
                }}
                disabled={!allowCustomSize}
                className="mt-1 h-12 text-lg disabled:opacity-50 disabled:bg-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">H ({product.size_unit === 'feet' ? 'ft' : 'in'}):</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(Math.max(1, Number(e.target.value)));
                  setSizeKey(null); // Custom size invalidates key
                }}
                disabled={!allowCustomSize}
                className="mt-1 h-12 text-lg disabled:opacity-50 disabled:bg-gray-100"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Quantity:</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                min={1}
                className="mt-1 h-12 text-lg"
              />
            </div>
          </div>
          
          <button className="text-sm text-blue-600 hover:underline mt-2">
            Buy More, Save More!
          </button>
        </div>

        {/* Options Section */}
        <Collapsible open={openSections.options} onOpenChange={() => toggleSection('options')}>
          <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-900">Product Options</span>
            {openSections.options ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6">
            {/* NEW: Render from product_options if available */}
            {product.product_options && product.product_options.length > 0 ? (
              renderDynamicProductOptions()
            ) : (
              // LEGACY: Keep old hardcoded options for products not yet configured
              <>
                {!product.hidden_options?.includes('thickness') && renderOptionGroup('Material', product.material_options || product.thickness_options || [
                  { name: 'Standard Material', description: 'High quality print' },
                ], selectedOptions.thickness, 'thickness')}
                
                {!product.hidden_options?.includes('printSide') && renderOptionGroup('Printed Sides', product.print_side_options || [
                  { name: 'Single Sided', description: 'Print on one side' },
                  { name: 'Double Sided', description: 'Print on both sides', price_modifier: 0 },
                ], selectedOptions.printSide, 'printSide')}
                
                {!product.hidden_options?.includes('finish') && renderOptionGroup('Edge Finish', product.finish_options || [
                  { name: 'Welded Hem', description: 'Heat welded for durability' },
                  { name: 'Sewn Hem', description: 'Sewn edges for extra strength', price_modifier: 5 },
                  { name: 'None (Flush Cut)', description: 'No hem, exact size cut' },
                ], selectedOptions.finish, 'finish')}
                
                {!product.hidden_options?.includes('grommets') && renderOptionGroup('Grommets', product.grommet_options || [
                  { name: 'Every 2-3 ft', description: 'Corners + evenly spaced' },
                  { name: 'Every 12-18 in', description: 'More hanging points' },
                  { name: '4 Corners', description: 'Just corner grommets' },
                  { name: 'None', description: 'No grommets' },
                ], selectedOptions.grommets, 'grommets')}
                
                {!product.hidden_options?.includes('polePockets') && renderOptionGroup('Pole Pockets', product.pole_pocket_options || [
                  { name: 'None', description: 'No pole pockets' },
                  { name: '3" Top & Bottom', description: 'Fits 1.5" poles', price_modifier: 8 },
                  { name: '3" Top Only', description: 'Top pocket only', price_modifier: 5 },
                ], selectedOptions.polePockets, 'polePockets')}
                
                {/* Only show accessories if not a sticker/label/decal/cling */}
                {!(product.slug?.includes('sticker') || product.slug?.includes('label') || product.slug?.includes('decal') || product.slug?.includes('cling')) && !product.hidden_options?.includes('accessory') && renderOptionGroup('Accessories', [
                  { name: 'None', description: 'No accessories' },
                  { name: 'Bungees (8)', description: '12" rubber bungee cords', price: 9.99 },
                  { name: 'Zip Ties (10)', description: 'Black zip ties', price: 4.99 },
                  { name: 'Rope (4)', description: '10ft nylon rope pieces', price: 12.99 },
                  { name: 'Hanging Clips (6)', description: 'Steel carabiners', price: 14.99 },
                  { name: 'Suction Cups (8)', description: '2" cups with hooks', price: 11.99 },
                ], selectedOptions.accessory, 'accessory')}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Price & Actions */}
        <div className="px-6 py-6 bg-gray-50">
          {/* Price Breakdown */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{calculatedPrice.sqft} sq ft @ ${calculatedPrice.perSqFt}/sq ft</span>
            <span className="text-sm text-gray-600">× {quantity}</span>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-500">Price:</span>
              <div className="flex items-baseline gap-3">
                <div className={`text-4xl font-bold ${calculatedPrice.isOnSale ? 'text-red-600' : 'text-green-600'}`}>
                  ${calculatedPrice.total}
                </div>
                {calculatedPrice.isOnSale && (
                  <div className="text-lg text-gray-400 line-through">
                    ${calculatedPrice.regularTotal}
                  </div>
                )}
              </div>
              {calculatedPrice.isOnSale && (
                <div className="text-sm font-bold text-red-600 mb-1">
                  SAVE {calculatedPrice.salePercentage}%
                </div>
              )}
              {quantity > 1 && (
                <span className="text-sm text-gray-500">${calculatedPrice.unitPrice} each</span>
              )}
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1 text-green-600">
                <Clock className="w-4 h-4" />
                <span>Ready to Ship</span>
              </div>
              <div className="font-medium text-gray-900 mt-1">
                {product.turnaround_days || 1} Business Day
              </div>
            </div>
          </div>

          {/* Primary CTA - Replicating Signs.com flow */}
          <div className="flex flex-col gap-3 mb-6">
            {product.has_design_tool !== false ? (
              <>
                <Button 
                  size="lg" 
                  className={`w-full h-14 text-white text-lg font-semibold ${
                    calculatedPrice.isOnSale ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={startDesigning}
                >
                  Design Online
                  <Palette className="w-5 h-5 ml-2" />
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-12 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload File
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={startDesigning}
                  >
                    <Info className="w-5 h-5 mr-2" />
                    Let Us Design
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                size="lg" 
                className={`w-full h-14 text-white text-lg font-semibold ${
                  calculatedPrice.isOnSale ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={handleAddToCart}
              >
                Add to Cart - ${calculatedPrice.total}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Features List */}
      {product.features && product.features.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Product Features</h3>
          <ul className="space-y-2">
            {product.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Your Artwork</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              Upload your print-ready file. Accepted formats: PDF, JPG, PNG, AI, PSD
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.ai,.psd"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {isUploading ? (
                  <Loader2 className="w-10 h-10 mx-auto text-blue-500 animate-spin mb-3" />
                ) : uploadedFileUrl ? (
                  <Check className="w-10 h-10 mx-auto text-green-500 mb-3" />
                ) : (
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                )}
                <div className="font-medium text-gray-700">
                  {uploadedFileUrl ? 'File uploaded!' : 'Click to upload'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  or drag and drop
                </div>
              </label>
            </div>

            {uploadedFileUrl && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleAddToCart}
              >
                Add to Cart - ${calculatedPrice.total}
              </Button>
            )}

            <div className="text-center">
              <span className="text-sm text-gray-500">Don't have artwork ready? </span>
              <button 
                onClick={() => { setShowUploadDialog(false); startDesigning(); }}
                className="text-sm text-blue-600 hover:underline"
              >
                Design Online
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}