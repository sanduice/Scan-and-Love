import React from 'react';
import { Label } from '@/components/ui/label';

const SIZES = [
  { value: '1x3-rectangle', label: '1"x3" Rectangle', width: 60, height: 20 },
  { value: '1.5x3-rectangle', label: '1.5"x3" Rectangle', width: 60, height: 30 },
  { value: '1.5x3-oval', label: '1.5"x3" Oval', width: 60, height: 30, isOval: true },
  { value: '2x3-rectangle', label: '2"x3" Rectangle', width: 60, height: 40 },
];

export default function SizeShapePanel({ value, onChange }) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">SELECT A SIZE / SHAPE</Label>
      <div className="grid grid-cols-2 gap-3">
        {SIZES.map((size) => (
          <button
            key={size.value}
            onClick={() => onChange(size.value)}
            className={`relative p-4 rounded-lg border-2 transition-all ${
              value === size.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div 
              className="mx-auto bg-gray-200 mb-2"
              style={{
                width: size.width,
                height: size.height,
                borderRadius: size.isOval ? '50%' : '4px',
              }}
            />
            <p className="text-xs text-center text-gray-600">{size.label}</p>
            {value === size.value && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}