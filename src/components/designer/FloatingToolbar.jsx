import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Trash2, Copy, Lock, Unlock, ChevronDown, Palette, Type
} from 'lucide-react';

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
  'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Courier New'
];

const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#1F2937'
];

export default function FloatingToolbar({ element, updateElement, deleteElement, duplicateElement }) {
  if (!element) return null;

  const isText = element.type === 'text';
  const isShape = element.type === 'shape';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-[#181825] border border-[#313244] rounded-xl px-2 py-1.5 shadow-2xl">
        {isText && (
          <>
            {/* Font Family */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors">
                  <span className="max-w-[100px] truncate">{element.fontFamily || 'Arial'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1 bg-[#1e1e2e] border-[#313244]">
                {FONT_FAMILIES.map(font => (
                  <button
                    key={font}
                    onClick={() => updateElement(element.id, { fontFamily: font })}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      element.fontFamily === font 
                        ? 'bg-[#89b4fa] text-[#1e1e2e]' 
                        : 'text-[#cdd6f4] hover:bg-[#313244]'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-[#313244]" />

            {/* Font Size */}
            <div className="flex items-center">
              <Input
                type="number"
                value={Math.round(element.fontSize || 12)}
                onChange={(e) => updateElement(element.id, { fontSize: Number(e.target.value) })}
                className="w-14 h-8 bg-[#313244] border-[#45475a] text-[#cdd6f4] text-center text-sm"
              />
            </div>

            <div className="w-px h-6 bg-[#313244]" />

            {/* Bold / Italic */}
            <button
              onClick={() => updateElement(element.id, { fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`p-2 rounded-lg transition-colors ${
                element.fontWeight === 'bold' ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateElement(element.id, { fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`p-2 rounded-lg transition-colors ${
                element.fontStyle === 'italic' ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-[#313244]" />

            {/* Alignment */}
            <button
              onClick={() => updateElement(element.id, { textAlign: 'left' })}
              className={`p-2 rounded-lg transition-colors ${
                element.textAlign === 'left' ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateElement(element.id, { textAlign: 'center' })}
              className={`p-2 rounded-lg transition-colors ${
                element.textAlign === 'center' || !element.textAlign ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateElement(element.id, { textAlign: 'right' })}
              className={`p-2 rounded-lg transition-colors ${
                element.textAlign === 'right' ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
              }`}
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-[#313244]" />

            {/* Text Color */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded border border-[#45475a]" style={{ backgroundColor: element.color || '#000000' }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-[#1e1e2e] border-[#313244]">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateElement(element.id, { color })}
                      className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                        element.color === color ? 'ring-2 ring-[#89b4fa]' : 'border-[#45475a]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {isShape && (
          <>
            {/* Fill Color */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors">
                  <div className="w-4 h-4 rounded border border-[#45475a]" style={{ backgroundColor: element.fill || '#3B82F6' }} />
                  <span className="text-sm">Fill</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-[#1e1e2e] border-[#313244]">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateElement(element.id, { fill: color })}
                      className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                        element.fill === color ? 'ring-2 ring-[#89b4fa]' : 'border-[#45475a]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        <div className="w-px h-6 bg-[#313244]" />

        {/* Common Actions */}
        <button
          onClick={() => duplicateElement(element.id)}
          className="p-2 text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => updateElement(element.id, { locked: !element.locked })}
          className={`p-2 rounded-lg transition-colors ${
            element.locked ? 'bg-[#f9e2af] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
          }`}
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button
          onClick={() => deleteElement(element.id)}
          className="p-2 text-[#f38ba8] hover:bg-[#f38ba8]/20 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}