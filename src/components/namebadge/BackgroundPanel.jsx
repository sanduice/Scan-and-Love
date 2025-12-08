import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const MATERIALS = [
  { value: 'white-plastic', label: 'White - Plastic', color: '#FFFFFF', border: '#e5e7eb' },
  { value: 'black-plastic', label: 'Black - Plastic', color: '#1a1a1a' },
  { value: 'gold-plastic', label: 'Gold - Plastic', color: '#D4AF37' },
  { value: 'silver-plastic', label: 'Silver - Plastic', color: '#C0C0C0' },
  { value: 'gold-metallic', label: 'Gold Metallic', color: '#FFD700', gradient: true, premium: true },
  { value: 'silver-metallic', label: 'Silver Metallic', color: '#E8E8E8', gradient: true, premium: true },
  { value: 'rose-gold', label: 'Rose Gold', color: '#B76E79', gradient: true, premium: true },
  { value: 'wood-grain', label: 'Wood Grain', color: '#DEB887', pattern: true },
  { value: 'brushed-metal', label: 'Brushed Metal', color: '#A8A8A8', gradient: true, premium: true },
  { value: 'bling-silver', label: 'Silver Bling', color: '#C0C0C0', pattern: true, premium: true },
  { value: 'bling-gold', label: 'Gold Bling', color: '#FFD700', pattern: true, premium: true },
  { value: 'chalkboard', label: 'Chalkboard', color: '#333333', pattern: true },
  { value: 'glossy-white', label: 'Glossy White', color: '#FFFFFF', border: '#e5e7eb', gradient: true },
  { value: 'red-plastic', label: 'Red', color: '#EF4444' },
  { value: 'blue-plastic', label: 'Blue', color: '#3B82F6' },
  { value: 'green-plastic', label: 'Green', color: '#22C55E' },
];

const CUSTOM_BACKGROUNDS = [
  { url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=100&fit=crop', label: 'Blue Gradient' },
  { url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&h=100&fit=crop', label: 'Rainbow' },
  { url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=100&fit=crop', label: 'Pink Swirl' },
  { url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=200&h=100&fit=crop', label: 'Blue Abstract' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=100&fit=crop', label: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=100&fit=crop', label: 'Marble' },
  { url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=100&fit=crop', label: 'Dark Gradient' },
  { url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=200&h=100&fit=crop', label: 'Sunset' },
];

export default function BackgroundPanel({ value, onChange, backgroundImage, onBackgroundImageChange, badgeType }) {
  const handleCustomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onBackgroundImageChange(file_url);
      toast.success('Background uploaded!');
    } catch (err) {
      toast.error('Failed to upload background');
    }
  };

  const filteredMaterials = badgeType === 'executive' 
    ? MATERIALS.filter(m => ['gold-metallic', 'silver-metallic', 'rose-gold', 'brushed-metal', 'black-plastic'].includes(m.value))
    : MATERIALS;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">Material/Color</Label>
        <div className="grid grid-cols-3 gap-2">
          {filteredMaterials.map((mat) => (
            <button
              key={mat.value}
              onClick={() => {
                onChange(mat.value);
                onBackgroundImageChange(null);
              }}
              className={`p-2 rounded-lg border-2 transition-all relative ${
                value === mat.value && !backgroundImage
                  ? 'border-blue-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {mat.premium && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] px-1 rounded">
                  PREMIUM
                </span>
              )}
              <div 
                className="w-full h-8 rounded mb-1"
                style={{
                  background: mat.gradient 
                    ? `linear-gradient(135deg, ${mat.color} 0%, #fff 50%, ${mat.color} 100%)`
                    : mat.color,
                  border: mat.border ? `1px solid ${mat.border}` : 'none',
                }}
              />
              <p className="text-[10px] text-center text-gray-600 truncate">{mat.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Pattern Backgrounds</Label>
        <div className="grid grid-cols-4 gap-2">
          {CUSTOM_BACKGROUNDS.map((bg, i) => (
            <button
              key={i}
              onClick={() => onBackgroundImageChange(bg.url)}
              className={`aspect-[2/1] rounded-lg overflow-hidden border-2 ${
                backgroundImage === bg.url ? 'border-blue-500' : 'border-gray-200'
              }`}
              title={bg.label}
            >
              <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        
        <label className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Upload Custom Background
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
        </label>
      </div>
    </div>
  );
}