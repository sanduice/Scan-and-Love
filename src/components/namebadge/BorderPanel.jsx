import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const BORDERS = [
  { value: 'none', label: 'No Border', color: null, price: 'Included' },
  { value: 'gold', label: 'Gold Border', color: '#D4AF37', price: '+$0.50' },
  { value: 'silver', label: 'Silver Border', color: '#C0C0C0', price: '+$0.50' },
  { value: 'black', label: 'Black Border', color: '#000000', price: '+$0.25' },
  { value: 'rose-gold', label: 'Rose Gold Border', color: '#B76E79', price: '+$0.75' },
];

export default function BorderPanel({ value, onChange, badgeType }) {
  const filteredBorders = badgeType === 'executive'
    ? BORDERS.filter(b => b.value !== 'none') // Executive always has a border
    : BORDERS;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Border Style</Label>
      <p className="text-xs text-gray-500">
        {badgeType === 'executive' 
          ? "Executive badges include a premium metal border frame." 
          : "Add a decorative border around your badge"}
      </p>
      <div className="space-y-2">
        {filteredBorders.map((border) => (
          <button
            key={border.value}
            onClick={() => onChange(border.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              value === border.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div 
              className="w-16 h-10 rounded bg-white flex-shrink-0"
              style={{
                border: border.color ? `3px solid ${border.color}` : '1px dashed #ccc',
              }}
            />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">{border.label}</p>
            </div>
            <Badge variant={border.price === 'Included' ? 'secondary' : 'outline'} className="text-[10px]">
              {border.price}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}