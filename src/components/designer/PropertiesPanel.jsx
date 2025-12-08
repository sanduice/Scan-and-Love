import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, Copy, Lock, Unlock, RotateCcw, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, FlipHorizontal, FlipVertical
} from 'lucide-react';

const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
  'Impact', 'Comic Sans MS', 'Courier New', 'Trebuchet MS'
];

export default function PropertiesPanel({ element, updateElement, deleteElement, duplicateElement }) {
  if (!element) {
    return (
      <div className="p-4 text-gray-400 text-center">
        <p className="text-sm">Select an element to edit its properties</p>
      </div>
    );
  }

  const handleChange = (key, value) => {
    updateElement(element.id, { [key]: value });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          onClick={() => duplicateElement(element.id)}
        >
          <Copy className="w-4 h-4 mr-1" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-red-400 hover:bg-red-900/20 hover:border-red-400"
          onClick={() => deleteElement(element.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
          onClick={() => handleChange('locked', !element.locked)}
        >
          {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </Button>
      </div>

      {/* Position & Size */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">Position & Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-400">X (inches)</Label>
            <Input
              type="number"
              value={element.x?.toFixed(2) || 0}
              onChange={(e) => handleChange('x', parseFloat(e.target.value))}
              className="bg-gray-700 border-gray-600 text-white h-8"
              step={0.1}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Y (inches)</Label>
            <Input
              type="number"
              value={element.y?.toFixed(2) || 0}
              onChange={(e) => handleChange('y', parseFloat(e.target.value))}
              className="bg-gray-700 border-gray-600 text-white h-8"
              step={0.1}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Width (in)</Label>
            <Input
              type="number"
              value={element.width?.toFixed(2) || 0}
              onChange={(e) => handleChange('width', parseFloat(e.target.value))}
              className="bg-gray-700 border-gray-600 text-white h-8"
              step={0.1}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Height (in)</Label>
            <Input
              type="number"
              value={element.height?.toFixed(2) || 0}
              onChange={(e) => handleChange('height', parseFloat(e.target.value))}
              className="bg-gray-700 border-gray-600 text-white h-8"
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-400">Rotation</Label>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-6 px-2"
            onClick={() => handleChange('rotation', 0)}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            value={[element.rotation || 0]}
            min={0}
            max={360}
            step={1}
            onValueChange={([v]) => handleChange('rotation', v)}
            className="flex-1"
          />
          <Input
            type="number"
            value={element.rotation || 0}
            onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
            className="w-16 bg-gray-700 border-gray-600 text-white h-8"
          />
        </div>
      </div>

      {/* Text Properties */}
      {element.type === 'text' && (
        <>
          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Text Content</Label>
            <textarea
              value={element.text}
              onChange={(e) => handleChange('text', e.target.value)}
              className="w-full h-24 bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your text..."
            />
            <p className="text-xs text-gray-500 mt-1">Double-click text on canvas to edit inline</p>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Font</Label>
            <Select value={element.fontFamily} onValueChange={(v) => handleChange('fontFamily', v)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Font Size (inches)</Label>
            <Input
              type="number"
              value={element.fontSize}
              onChange={(e) => handleChange('fontSize', parseFloat(e.target.value))}
              className="bg-gray-700 border-gray-600 text-white h-8"
              step={0.5}
              min={0.5}
            />
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Style</Label>
            <div className="flex gap-1">
              <Button
                variant={element.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                className="border-gray-600"
                onClick={() => handleChange('fontWeight', element.fontWeight === 'bold' ? 'normal' : 'bold')}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={element.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                className="border-gray-600"
                onClick={() => handleChange('fontStyle', element.fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <Button
                variant={element.textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                className="border-gray-600"
                onClick={() => handleChange('textAlign', 'left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={element.textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                className="border-gray-600"
                onClick={() => handleChange('textAlign', 'center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={element.textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                className="border-gray-600"
                onClick={() => handleChange('textAlign', 'right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <Input
                value={element.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white h-8 uppercase"
              />
            </div>
          </div>
        </>
      )}

      {/* Shape Properties */}
      {element.type === 'shape' && (
        <>
          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Fill Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.fill}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <Input
                value={element.fill}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white h-8 uppercase"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Border</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.stroke === 'none' ? '#000000' : element.stroke}
                onChange={(e) => handleChange('stroke', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <Input
                type="number"
                value={element.strokeWidth || 0}
                onChange={(e) => {
                  const width = parseInt(e.target.value);
                  handleChange('strokeWidth', width);
                  if (width > 0 && element.stroke === 'none') {
                    handleChange('stroke', '#000000');
                  }
                }}
                className="w-16 bg-gray-700 border-gray-600 text-white h-8"
                min={0}
                placeholder="Width"
              />
            </div>
          </div>
        </>
      )}

      {/* Image Properties */}
      {element.type === 'image' && (
        <div>
          <Label className="text-xs text-gray-400 mb-2 block">Image</Label>
          <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden mb-2">
            <img src={element.src} alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
              <FlipHorizontal className="w-4 h-4 mr-1" />
              Flip H
            </Button>
            <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
              <FlipVertical className="w-4 h-4 mr-1" />
              Flip V
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}