import React from 'react';
import { Label } from '@/components/ui/label';

export default function DomePanel({ value, onChange, badgeType }) {
  if (badgeType === 'executive') {
    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium">Dome Coating</Label>
        <div className="p-4 bg-gray-50 rounded-lg border text-center text-sm text-gray-500">
          Dome coating is not available for Executive Name Badges as they feature a premium flat metal finish.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Dome Coating</Label>
      <p className="text-xs text-gray-500">
        Add a clear domed resin coating for a professional, 3D effect that also protects your badge.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChange(true)}
          className={`p-4 rounded-lg border-2 transition-all ${
            value === true
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-16 h-10 mx-auto mb-2 bg-gradient-to-br from-white via-gray-100 to-white rounded-lg shadow-lg" 
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,200,200,0.3) 50%, rgba(255,255,255,0.9) 100%)',
            }}
          />
          <p className="text-sm font-medium text-center">Dome</p>
          <p className="text-xs text-gray-500 text-center">+$1.00 each</p>
        </button>

        <button
          onClick={() => onChange(false)}
          className={`p-4 rounded-lg border-2 transition-all ${
            value === false
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-16 h-10 mx-auto mb-2 bg-gray-200 rounded-lg" />
          <p className="text-sm font-medium text-center">No Dome</p>
          <p className="text-xs text-gray-500 text-center">Standard</p>
        </button>
      </div>
    </div>
  );
}