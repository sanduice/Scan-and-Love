import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, DollarSign, Camera, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PresetSizesManager({ 
  presetSizes = [], 
  sizeUnit = 'inches',
  pricingType = 'custom',
  pricePerSqft = 0,
  onSizesChange,
  onUnitChange,
  onPricingTypeChange,
  onPricePerSqftChange
}) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const fileInputRefs = useRef({});
  
  // Calculate price based on dimensions and price per sqft
  const calculateSqFtPrice = (width, height) => {
    if (!width || !height || !pricePerSqft) return 0;
    // Convert to square feet (dimensions are in inches)
    const sqFt = (width * height) / 144;
    return (sqFt * pricePerSqft).toFixed(2);
  };

  // Auto-update preset prices when pricing type is per_sqft
  useEffect(() => {
    if (pricingType === 'per_sqft' && pricePerSqft > 0 && presetSizes.length > 0) {
      const updatedSizes = presetSizes.map(size => ({
        ...size,
        price: parseFloat(calculateSqFtPrice(size.width, size.height))
      }));
      
      // Check if prices actually changed to avoid infinite loop
      const pricesChanged = updatedSizes.some((size, idx) => 
        size.price !== presetSizes[idx]?.price
      );
      
      if (pricesChanged) {
        onSizesChange(updatedSizes);
      }
    }
  }, [pricingType, pricePerSqft]);

  const addSize = () => {
    const newSize = { width: 24, height: 36, price: 0, is_active: true, image_url: null };
    if (pricingType === 'per_sqft' && pricePerSqft > 0) {
      newSize.price = parseFloat(calculateSqFtPrice(24, 36));
    }
    onSizesChange([...presetSizes, newSize]);
  };

  const updateSize = (index, field, value) => {
    const updated = [...presetSizes];
    const numValue = field === 'width' || field === 'height' || field === 'price' 
      ? parseFloat(value) || 0 
      : value;
    
    updated[index] = { ...updated[index], [field]: numValue };
    
    // Auto-calculate price if per_sqft mode and width/height changed
    if (pricingType === 'per_sqft' && (field === 'width' || field === 'height')) {
      updated[index].price = parseFloat(calculateSqFtPrice(
        field === 'width' ? numValue : updated[index].width,
        field === 'height' ? numValue : updated[index].height
      ));
    }
    
    onSizesChange(updated);
  };

  const removeSize = (index) => {
    onSizesChange(presetSizes.filter((_, i) => i !== index));
  };

  const toggleActive = (index) => {
    const updated = [...presetSizes];
    updated[index] = { ...updated[index], is_active: !updated[index].is_active };
    onSizesChange(updated);
  };

  // Handle image upload for a preset size
  const handleImageUpload = async (index, file) => {
    if (!file) return;
    
    setUploadingIndex(index);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updated = [...presetSizes];
      updated[index] = { ...updated[index], image_url: file_url };
      onSizesChange(updated);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Remove image from a preset size
  const removeImage = (index) => {
    const updated = [...presetSizes];
    updated[index] = { ...updated[index], image_url: null };
    onSizesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Size Unit Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <Label className="text-sm font-medium text-slate-700">Size Unit</Label>
          <p className="text-xs text-slate-500">Choose display unit for sizes</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onUnitChange('inches')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              sizeUnit === 'inches' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inches
          </button>
          <button
            type="button"
            onClick={() => onUnitChange('feet')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              sizeUnit === 'feet' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Feet
          </button>
        </div>
      </div>

      {/* Price per Square Foot - Always visible, independent of Pricing Mode */}
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-5 h-5 text-green-600" />
          <div>
            <Label className="text-sm font-semibold text-green-900">Price per Square Foot</Label>
            <p className="text-xs text-green-700">Used for custom size pricing calculations</p>
          </div>
        </div>
        <div className="relative max-w-xs">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={pricePerSqft}
            onChange={(e) => onPricePerSqftChange(parseFloat(e.target.value) || 0)}
            className="h-10 pl-8 bg-white"
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-green-600 mt-2">
          💡 This rate is used when customers select "Custom Size" or change dimensions in the design tool.
        </p>
      </div>

      {/* Pricing Mode - Simple Radio Selection */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium text-slate-700">Pricing Mode for Preset Sizes</Label>
            <p className="text-xs text-slate-500">Custom: Set individual prices. Per Sq Ft: Auto-calculate using rate above.</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingType"
                value="custom"
                checked={pricingType === 'custom'}
                onChange={() => onPricingTypeChange('custom')}
                className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-500"
              />
              <span className="text-sm font-medium text-slate-700">Custom Price</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingType"
                value="per_sqft"
                checked={pricingType === 'per_sqft'}
                onChange={() => onPricingTypeChange('per_sqft')}
                className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-500"
              />
              <span className="text-sm font-medium text-slate-700">Per Square Foot</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preset Sizes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold text-slate-900">Preset Sizes</Label>
            <p className="text-xs text-slate-500">Define standard sizes with {pricingType === 'per_sqft' ? 'auto-calculated' : 'fixed'} prices</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSize}>
            <Plus className="w-4 h-4 mr-1" /> Add Size
          </Button>
        </div>

        {presetSizes.length > 0 ? (
          <div className="space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-11 gap-3 px-3 text-xs text-slate-500 font-medium">
              <div className="col-span-1">Image</div>
              <div className="col-span-2">Width ({sizeUnit === 'feet' ? 'ft' : 'in'})</div>
              <div className="col-span-2">Height ({sizeUnit === 'feet' ? 'ft' : 'in'})</div>
              <div className="col-span-2">
                Price
                {pricingType === 'per_sqft' && (
                  <span className="ml-1 text-blue-500">(auto)</span>
                )}
              </div>
              <div className="col-span-2">Active</div>
              <div className="col-span-2"></div>
            </div>

            {presetSizes.map((size, idx) => (
              <div 
                key={idx} 
                className={`grid grid-cols-11 gap-3 items-start p-3 rounded-xl border transition-colors ${
                  size.is_active 
                    ? 'bg-white border-slate-200 hover:border-blue-300' 
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                {/* Image Upload Column */}
                <div className="col-span-1 pt-0.5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => fileInputRefs.current[idx] = el}
                    onChange={(e) => handleImageUpload(idx, e.target.files?.[0])}
                  />
                  {size.image_url ? (
                    <div className="relative group w-12 h-12">
                      <img 
                        src={size.image_url} 
                        alt="Size thumbnail"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      disabled={uploadingIndex === idx}
                      className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      {uploadingIndex === idx ? (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>

                <div className="col-span-2 pt-0.5">
                  <Input
                    type="number"
                    step="0.1"
                    value={size.width}
                    onChange={(e) => updateSize(idx, 'width', e.target.value)}
                    className="h-9 text-sm bg-slate-50/50"
                    placeholder="24"
                  />
                </div>
                <div className="col-span-2 pt-0.5">
                  <Input
                    type="number"
                    step="0.1"
                    value={size.height}
                    onChange={(e) => updateSize(idx, 'height', e.target.value)}
                    className="h-9 text-sm bg-slate-50/50"
                    placeholder="36"
                  />
                </div>
                <div className="col-span-2 pt-0.5">
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={size.price}
                      onChange={(e) => updateSize(idx, 'price', e.target.value)}
                      className={`h-9 text-sm pl-6 ${
                        pricingType === 'per_sqft' 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'bg-slate-50/50'
                      }`}
                      placeholder="0.00"
                      disabled={pricingType === 'per_sqft'}
                      title={pricingType === 'per_sqft' ? 'Auto-calculated from dimensions' : ''}
                    />
                  </div>
                  {pricingType === 'per_sqft' && (
                    <p className="text-[10px] text-blue-500 mt-1">
                      {((size.width * size.height) / 144).toFixed(2)} sq ft
                    </p>
                  )}
                </div>
                <div className="col-span-2 flex items-center h-9 mt-0.5">
                  <Switch
                    checked={size.is_active !== false}
                    onCheckedChange={() => toggleActive(idx)}
                  />
                  <span className="ml-2 text-xs text-slate-500">
                    {size.is_active !== false ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end h-9 mt-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeSize(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
            <p className="text-sm">No preset sizes defined</p>
            <p className="text-xs mt-1">Click "Add Size" to create standard size options with prices</p>
          </div>
        )}
      </div>
    </div>
  );
}
