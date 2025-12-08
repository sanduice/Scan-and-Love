import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const FASTENERS = [
  { 
    value: 'magnetic', 
    label: 'Magnetic', 
    description: 'Strong dual magnet - won\'t damage clothing. Most popular choice.',
    price: '+$1.00',
    icon: '🧲'
  },
  { 
    value: 'pin', 
    label: 'Pin Fastener', 
    description: 'Traditional safety pin back - secure and affordable.',
    price: 'Included',
    icon: '📌'
  },
  { 
    value: 'military-clutch', 
    label: 'Military Clutch', 
    description: 'Double post with butterfly clutch backs - very secure.',
    price: '+$0.50',
    icon: '🎖️'
  },
  { 
    value: 'pocket-clip', 
    label: 'Pocket Clip', 
    description: 'Clips onto pocket, collar or lanyard - no holes in clothing.',
    price: '+$0.75',
    icon: '📎'
  },
  { 
    value: 'swivel-clip', 
    label: 'Swivel Clip', 
    description: 'Rotating bulldog clip - great for ID cards and lanyards.',
    price: '+$0.50',
    icon: '🔄'
  },
  { 
    value: 'lanyard-slot', 
    label: 'Lanyard Slot', 
    description: 'Slot for lanyard attachment - no additional hardware needed.',
    price: 'Included',
    icon: '🏷️'
  },
];

export default function FastenerPanel({ value, onChange }) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Fastener Type</Label>
      <div className="space-y-2">
        {FASTENERS.map((fastener) => (
          <button
            key={fastener.value}
            onClick={() => onChange(fastener.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
              value === fastener.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              {fastener.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{fastener.label}</p>
                <Badge variant={fastener.price === 'Included' ? 'secondary' : 'outline'} className="text-[10px]">
                  {fastener.price}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{fastener.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}