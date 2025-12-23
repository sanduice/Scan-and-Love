import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Type, Minus, Plus, Copy, Trash2, Lock, Unlock, Layers,
  FlipHorizontal, FlipVertical, MoveUp, MoveDown, Palette,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  ArrowUpToLine, ArrowDownToLine
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const FONTS = [
  'Arial', 'Arial Black', 'Times New Roman', 'Georgia', 'Verdana', 
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console',
  'Palatino Linotype', 'Book Antiqua', 'Century Gothic', 'Garamond'
];

const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#1E293B', '#7C3AED',
  '#059669', '#DC2626', '#CA8A04', '#0891B2'
];

export default function DesignToolbar({
  element,
  updateElement,
  deleteElement,
  duplicateElement,
  moveLayerUp,
  moveLayerDown,
  bringToFront,
  sendToBack,
  alignToCanvas,
}) {
  if (!element) return null;

  const isText = element.type === 'text';
  const isShape = element.type === 'shape';

  const toggleStyle = (prop, value, altValue = 'normal') => {
    updateElement(element.id, { [prop]: element[prop] === value ? altValue : value });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 flex items-center gap-1 flex-wrap max-w-[95vw]">
      {/* Text specific controls */}
      {isText && (
        <>
          {/* Font family */}
          <Select
            value={element.fontFamily || 'Arial'}
            onValueChange={(v) => updateElement(element.id, { fontFamily: v })}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Font size (displayed in Points) */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // Decrease by 10pt (approx) for large signs, or 1pt for small
                const currentPt = (element.fontSize || 1) * 72;
                const newPt = Math.max(6, currentPt - (currentPt > 100 ? 10 : 1));
                updateElement(element.id, { fontSize: newPt / 72 });
              }}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div className="flex items-center relative">
              <Input
                type="number"
                value={Math.round((element.fontSize || 1) * 72)}
                onChange={(e) => updateElement(element.id, { fontSize: (parseFloat(e.target.value) || 12) / 72 })}
                className="w-14 h-7 text-center text-sm border-0 bg-transparent p-0 pr-3"
              />
              <span className="absolute right-0 text-xs text-gray-400 pointer-events-none">pt</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const currentPt = (element.fontSize || 1) * 72;
                const newPt = currentPt + (currentPt > 100 ? 10 : 1);
                updateElement(element.id, { fontSize: newPt / 72 });
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text style buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={element.fontWeight === 'bold' ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => toggleStyle('fontWeight', 'bold', 'normal')}
              >
                <Bold className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={element.fontStyle === 'italic' ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
              >
                <Italic className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={element.textDecoration === 'underline' ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => toggleStyle('textDecoration', 'underline', 'none')}
              >
                <Underline className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text align */}
          <div className="flex bg-gray-100 rounded-lg">
            {[
              { align: 'left', icon: AlignLeft },
              { align: 'center', icon: AlignCenter },
              { align: 'right', icon: AlignRight },
            ].map(({ align, icon: Icon }) => (
              <Button
                key={align}
                variant={element.textAlign === align ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateElement(element.id, { textAlign: align })}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Type className="w-4 h-4" />
                <div 
                  className="absolute bottom-1 left-1 right-1 h-1 rounded"
                  style={{ backgroundColor: element.color || '#000000' }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                    style={{ 
                      backgroundColor: color,
                      borderColor: element.color === color ? '#3B82F6' : 'transparent'
                    }}
                    onClick={() => updateElement(element.id, { color })}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={element.color || '#000000'}
                onChange={(e) => updateElement(element.id, { color: e.target.value })}
                className="mt-2 w-full h-8"
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Shape color */}
      {isShape && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2">
              <div 
                className="w-5 h-5 rounded border"
                style={{ backgroundColor: element.fill || '#3B82F6' }}
              />
              <span className="text-sm">Fill</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-8 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: color,
                    borderColor: element.fill === color ? '#3B82F6' : 'transparent'
                  }}
                  onClick={() => updateElement(element.id, { fill: color })}
                />
              ))}
            </div>
            <Input
              type="color"
              value={element.fill || '#3B82F6'}
              onChange={(e) => updateElement(element.id, { fill: e.target.value })}
              className="mt-2 w-full h-8"
            />
          </PopoverContent>
        </Popover>
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Opacity */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9">
            {Math.round((element.opacity ?? 1) * 100)}%
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3">
          <div className="text-sm text-gray-600 mb-2">Opacity</div>
          <Slider
            value={[(element.opacity ?? 1) * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => updateElement(element.id, { opacity: v / 100 })}
          />
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Object Alignment */}
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" 
              onClick={() => alignToCanvas?.(element.id, 'left')}>
              <AlignStartVertical className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => alignToCanvas?.(element.id, 'center-h')}>
              <AlignCenterVertical className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center Horizontally</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => alignToCanvas?.(element.id, 'right')}>
              <AlignEndVertical className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => alignToCanvas?.(element.id, 'top')}>
              <AlignStartHorizontal className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Top</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => alignToCanvas?.(element.id, 'center-v')}>
              <AlignCenterHorizontal className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center Vertically</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => alignToCanvas?.(element.id, 'bottom')}>
              <AlignEndHorizontal className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Bottom</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Layer controls */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" 
              onClick={() => bringToFront?.(element.id)}>
              <ArrowUpToLine className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bring to Front</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9"
              onClick={() => sendToBack?.(element.id)}>
              <ArrowDownToLine className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to Back</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Common actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => duplicateElement(element.id)}>
            <Copy className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Duplicate</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => updateElement(element.id, { locked: !element.locked })}
          >
            {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{element.locked ? 'Unlock' : 'Lock'}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => deleteElement(element.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}
