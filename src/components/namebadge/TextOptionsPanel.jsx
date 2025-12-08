import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Minus, Plus } from 'lucide-react';

const FONTS = [
  { name: 'Arial', category: 'Sans-Serif' },
  { name: 'Arial Black', category: 'Sans-Serif' },
  { name: 'Century Gothic', category: 'Sans-Serif' },
  { name: 'Verdana', category: 'Sans-Serif' },
  { name: 'Trebuchet MS', category: 'Sans-Serif' },
  { name: 'Tahoma', category: 'Sans-Serif' },
  { name: 'Times New Roman', category: 'Serif' },
  { name: 'Georgia', category: 'Serif' },
  { name: 'Palatino Linotype', category: 'Serif' },
  { name: 'Book Antiqua', category: 'Serif' },
  { name: 'Courier New', category: 'Monospace' },
  { name: 'Lucida Console', category: 'Monospace' },
  { name: 'Comic Sans MS', category: 'Display' },
  { name: 'Impact', category: 'Display' },
  { name: 'Copperplate', category: 'Display' },
];

const COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#1a1a1a', label: 'Dark Gray' },
  { value: '#666666', label: 'Gray' },
  { value: '#C41E3A', label: 'Red' },
  { value: '#00008B', label: 'Navy' },
  { value: '#006400', label: 'Forest' },
  { value: '#8B4513', label: 'Brown' },
  { value: '#D4AF37', label: 'Gold' },
  { value: '#C0C0C0', label: 'Silver' },
  { value: '#800080', label: 'Purple' },
  { value: '#008080', label: 'Teal' },
];

export default function TextOptionsPanel({ element, onUpdate }) {
  // Convert inches to points for display/editing (1 inch = 72pt)
  const currentPt = Math.round(element.fontSize * 72);

  const updateFontSizePt = (newPt) => {
    const constrainedPt = Math.max(6, Math.min(100, newPt));
    onUpdate({ fontSize: constrainedPt / 72 });
  };

  return (
    <div className="space-y-5">
      {/* Text Content */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Text Content</Label>
        <Input
          value={element.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Enter text..."
          className="mt-1.5 text-lg"
        />
        <p className="text-xs text-orange-600 mt-1.5 bg-orange-50 p-2 rounded">
          💡 This is placeholder text. You'll enter actual names/titles in the next step.
        </p>
      </div>

      {/* Font Selection */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Font Family</Label>
        <Select value={element.fontFamily} onValueChange={(v) => onUpdate({ fontFamily: v })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {FONTS.map((font) => (
              <SelectItem 
                key={font.name} 
                value={font.name} 
                style={{ fontFamily: font.name }}
                className="py-2"
              >
                <span style={{ fontFamily: font.name }}>{font.name}</span>
                <span className="text-xs text-gray-400 ml-2">({font.category})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Font Size</Label>
          <span className="text-sm text-gray-500">{currentPt}pt</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateFontSizePt(currentPt - 1)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Slider
            value={[currentPt]}
            onValueChange={([v]) => updateFontSizePt(v)}
            min={6}
            max={72}
            step={1}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateFontSizePt(currentPt + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Font Style */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Style</Label>
        <div className="flex gap-1 mt-1.5">
          <Button
            variant={element.fontWeight === 'bold' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            <Bold className="w-4 h-4 mr-1" />
            Bold
          </Button>
          <Button
            variant={element.fontStyle === 'italic' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
          >
            <Italic className="w-4 h-4 mr-1" />
            Italic
          </Button>
          <Button
            variant={element.textDecoration === 'underline' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })}
          >
            <Underline className="w-4 h-4 mr-1" />
            Underline
          </Button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Alignment</Label>
        <div className="flex gap-1 mt-1.5">
          <Button
            variant={element.textAlign === 'left' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ textAlign: 'left' })}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={element.textAlign === 'center' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ textAlign: 'center' })}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={element.textAlign === 'right' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ textAlign: 'right' })}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Text Color</Label>
        <div className="grid grid-cols-6 gap-2 mt-1.5">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdate({ color: color.value })}
              className={`w-full aspect-square rounded-lg border-2 transition-all ${
                element.color === color.value 
                  ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <div className="flex items-center gap-2 mt-3">
          <Label className="text-xs text-gray-500">Custom:</Label>
          <input
            type="color"
            value={element.color || '#000000'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-xs text-gray-500 uppercase">{element.color}</span>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
        <div 
          className="p-4 bg-gray-100 rounded-lg text-center"
          style={{
            fontFamily: element.fontFamily,
            fontSize: `${element.fontSize * 150}px`,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            textDecoration: element.textDecoration,
            textAlign: element.textAlign,
            color: element.color,
          }}
        >
          {element.text || 'Preview Text'}
        </div>
      </div>
    </div>
  );
}