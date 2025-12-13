import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, DollarSign } from 'lucide-react';

export default function PresetSizesManager({ 
  presetSizes = [], 
  sizeUnit = 'inches',
  onSizesChange,
  onUnitChange 
}) {
  const addSize = () => {
    onSizesChange([
      ...presetSizes,
      { width: 24, height: 36, label: '', price: 0, is_active: true }
    ]);
  };

  const updateSize = (index, field, value) => {
    const updated = [...presetSizes];
    updated[index] = { 
      ...updated[index], 
      [field]: field === 'width' || field === 'height' || field === 'price' 
        ? parseFloat(value) || 0 
        : value 
    };
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

      {/* Preset Sizes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold text-slate-900">Preset Sizes</Label>
            <p className="text-xs text-slate-500">Define standard sizes with fixed prices</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSize}>
            <Plus className="w-4 h-4 mr-1" /> Add Size
          </Button>
        </div>

        {presetSizes.length > 0 ? (
          <div className="space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-3 px-3 text-xs text-slate-500 font-medium">
              <div className="col-span-2">Width ({sizeUnit === 'feet' ? 'ft' : 'in'})</div>
              <div className="col-span-2">Height ({sizeUnit === 'feet' ? 'ft' : 'in'})</div>
              <div className="col-span-3">Display Label</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Active</div>
              <div className="col-span-1"></div>
            </div>

            {presetSizes.map((size, idx) => (
              <div 
                key={idx} 
                className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border transition-colors ${
                  size.is_active 
                    ? 'bg-white border-slate-200 hover:border-blue-300' 
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={size.width}
                    onChange={(e) => updateSize(idx, 'width', e.target.value)}
                    className="h-9 text-sm bg-slate-50/50"
                    placeholder="24"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={size.height}
                    onChange={(e) => updateSize(idx, 'height', e.target.value)}
                    className="h-9 text-sm bg-slate-50/50"
                    placeholder="36"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="text"
                    value={size.label || ''}
                    onChange={(e) => updateSize(idx, 'label', e.target.value)}
                    className="h-9 text-sm bg-slate-50/50"
                    placeholder="2' x 3'"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={size.price}
                      onChange={(e) => updateSize(idx, 'price', e.target.value)}
                      className="h-9 text-sm bg-slate-50/50 pl-6"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <Switch
                    checked={size.is_active !== false}
                    onCheckedChange={() => toggleActive(idx)}
                  />
                  <span className="ml-2 text-xs text-slate-500">
                    {size.is_active !== false ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
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
