import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Type, Image, Square, Circle, Upload, Layout, Shapes, Palette,
  Star, Triangle, Hexagon, Heart, Loader2, Search, X, Smile,
  Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown, GripVertical
} from 'lucide-react';

// Template categories with templates
const TEMPLATE_CATEGORIES = {
  'vinyl-banner': {
    'Sale & Promotion': [
      { id: 'sale-1', name: 'Big Sale', color: '#DC2626', text: 'SALE', subtext: 'Up to 50% Off!' },
      { id: 'sale-2', name: 'Clearance', color: '#EA580C', text: 'CLEARANCE', subtext: 'Everything Must Go!' },
      { id: 'sale-3', name: 'Special Offer', color: '#7C3AED', text: 'SPECIAL OFFER', subtext: 'Limited Time Only' },
    ],
    'Business': [
      { id: 'grand-opening', name: 'Grand Opening', color: '#1E40AF', text: 'GRAND OPENING', subtext: 'Join Us!' },
      { id: 'now-open', name: 'Now Open', color: '#059669', text: 'NOW OPEN', subtext: 'Come Visit Us' },
      { id: 'coming-soon', name: 'Coming Soon', color: '#4F46E5', text: 'COMING SOON', subtext: 'Stay Tuned!' },
    ],
    'Events': [
      { id: 'welcome', name: 'Welcome', color: '#059669', text: 'WELCOME', subtext: '' },
      { id: 'birthday', name: 'Happy Birthday', color: '#EC4899', text: 'Happy Birthday!', subtext: '[Name]' },
      { id: 'congratulations', name: 'Congratulations', color: '#8B5CF6', text: 'Congratulations!', subtext: '' },
    ],
  },
  'yard-sign': {
    'Real Estate': [
      { id: 'for-sale', name: 'For Sale', color: '#DC2626', text: 'FOR SALE', subtext: 'Call: 555-1234' },
      { id: 'for-rent', name: 'For Rent', color: '#2563EB', text: 'FOR RENT', subtext: 'Call Now' },
      { id: 'open-house', name: 'Open House', color: '#1E40AF', text: 'OPEN HOUSE', subtext: 'Sunday 1-4PM' },
    ],
    'Political': [
      { id: 'vote', name: 'Vote For', color: '#DC2626', text: 'VOTE', subtext: '[Candidate]' },
    ],
  },
};

const CLIPART_CATEGORIES = {
  'Arrows': [
    { id: 'arrow-right', url: 'https://www.svgrepo.com/show/533661/arrow-right.svg' },
    { id: 'arrow-left', url: 'https://www.svgrepo.com/show/533655/arrow-left.svg' },
    { id: 'arrow-up', url: 'https://www.svgrepo.com/show/533663/arrow-up.svg' },
    { id: 'arrow-down', url: 'https://www.svgrepo.com/show/533657/arrow-down.svg' },
  ],
  'Icons': [
    { id: 'star', url: 'https://www.svgrepo.com/show/513354/star.svg' },
    { id: 'heart', url: 'https://www.svgrepo.com/show/525418/heart.svg' },
    { id: 'check', url: 'https://www.svgrepo.com/show/525834/check-circle.svg' },
    { id: 'phone', url: 'https://www.svgrepo.com/show/525896/phone.svg' },
    { id: 'mail', url: 'https://www.svgrepo.com/show/525737/letter.svg' },
    { id: 'location', url: 'https://www.svgrepo.com/show/525752/map-point.svg' },
  ],
  'Social': [
    { id: 'facebook', url: 'https://www.svgrepo.com/show/521654/facebook.svg' },
    { id: 'instagram', url: 'https://www.svgrepo.com/show/521711/instagram.svg' },
    { id: 'twitter', url: 'https://www.svgrepo.com/show/521828/twitter.svg' },
  ],
};

const QUICK_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#000000', '#FFFFFF', '#6B7280', '#1F2937'
];

export default function LeftSidebarPanel({ 
  activeTab, 
  onAddText, 
  onAddShape,
  onImageUpload,
  onAddClipart,
  isUploading,
  onApplyTemplate,
  productType = 'vinyl-banner',
  onClose,
  // Layers props
  elements = [],
  selectedElement,
  setSelectedElement,
  setElements,
  updateElement,
  deleteElement,
}) {
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [clipartCategory, setClipartCategory] = useState('Arrows');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const templateCategories = TEMPLATE_CATEGORIES[productType] || TEMPLATE_CATEGORIES['vinyl-banner'];
  const categoryNames = Object.keys(templateCategories);

  const generateTemplateElements = (template) => {
    const baseWidth = productType === 'yard-sign' ? 24 : 72;
    const baseHeight = productType === 'yard-sign' ? 18 : 36;
    return [
      { type: 'shape', shape: 'rectangle', fill: template.color, x: 0, y: 0, width: baseWidth, height: baseHeight },
      { type: 'text', text: template.text, fontSize: baseHeight * 0.25, fontFamily: 'Arial', fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', x: baseWidth * 0.1, y: baseHeight * 0.2, width: baseWidth * 0.8, height: baseHeight * 0.35 },
      ...(template.subtext ? [{ type: 'text', text: template.subtext, fontSize: baseHeight * 0.15, fontFamily: 'Arial', fontWeight: 'normal', color: '#FFFFFF', textAlign: 'center', x: baseWidth * 0.15, y: baseHeight * 0.55, width: baseWidth * 0.7, height: baseHeight * 0.25 }] : []),
    ];
  };

  const handleApplyTemplate = (template) => {
    const elements = generateTemplateElements(template);
    onApplyTemplate({ ...template, elements });
  };

  const moveLayer = (id, direction) => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= elements.length) return;
    const newElements = [...elements];
    [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
    setElements(newElements);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7086]" />
              <Input 
                placeholder="Search templates..." 
                className="bg-[#313244] border-[#45475a] text-[#cdd6f4] pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {categoryNames.map(category => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-[#a6adc8] uppercase mb-2 tracking-wider">{category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {templateCategories[category].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className="aspect-[2/1] rounded-lg overflow-hidden hover:ring-2 ring-[#89b4fa] transition-all group relative"
                      style={{ backgroundColor: template.color }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                        <span className="text-white text-[10px] font-bold text-center leading-tight truncate w-full">
                          {template.text}
                        </span>
                        {template.subtext && (
                          <span className="text-white/80 text-[8px] truncate w-full text-center">
                            {template.subtext}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wider">Add Text</h4>
            <button 
              onClick={onAddText}
              className="w-full p-4 bg-[#313244] hover:bg-[#45475a] rounded-xl text-left transition-colors group"
            >
              <div className="text-xl font-bold text-[#cdd6f4] group-hover:text-white">Add a heading</div>
              <div className="text-xs text-[#6c7086] mt-1">Click to add title text</div>
            </button>
            <button 
              onClick={onAddText}
              className="w-full p-3 bg-[#313244] hover:bg-[#45475a] rounded-xl text-left transition-colors group"
            >
              <div className="text-base font-medium text-[#cdd6f4] group-hover:text-white">Add a subheading</div>
              <div className="text-xs text-[#6c7086] mt-1">Medium-sized text</div>
            </button>
            <button 
              onClick={onAddText}
              className="w-full p-3 bg-[#313244] hover:bg-[#45475a] rounded-xl text-left transition-colors group"
            >
              <div className="text-sm text-[#cdd6f4] group-hover:text-white">Add body text</div>
              <div className="text-xs text-[#6c7086] mt-1">Small paragraph text</div>
            </button>
          </div>
        );

      case 'images':
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wider">Upload Image</h4>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full aspect-[4/3] border-2 border-dashed border-[#45475a] rounded-xl flex flex-col items-center justify-center hover:border-[#89b4fa] hover:bg-[#313244]/50 transition-all"
            >
              {isUploading ? (
                <Loader2 className="w-10 h-10 text-[#89b4fa] animate-spin" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[#6c7086] mb-2" />
                  <div className="text-[#cdd6f4] text-sm font-medium">Click to upload</div>
                  <div className="text-[#6c7086] text-xs mt-1">or drag and drop</div>
                </>
              )}
            </button>
            <p className="text-[#6c7086] text-xs text-center">PNG, JPG, SVG up to 50MB</p>
          </div>
        );

      case 'clipart':
        return (
          <div className="space-y-4">
            <Select value={clipartCategory} onValueChange={setClipartCategory}>
              <SelectTrigger className="bg-[#313244] border-[#45475a] text-[#cdd6f4]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e2e] border-[#313244]">
                {Object.keys(CLIPART_CATEGORIES).map(cat => (
                  <SelectItem key={cat} value={cat} className="text-[#cdd6f4] focus:bg-[#313244]">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-4 gap-2">
              {CLIPART_CATEGORIES[clipartCategory]?.map((clip) => (
                <button
                  key={clip.id}
                  onClick={() => onAddClipart && onAddClipart(clip.url)}
                  className="aspect-square bg-white rounded-lg p-2 hover:ring-2 ring-[#89b4fa] transition-all"
                >
                  <img src={clip.url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'shapes':
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wider">Basic Shapes</h4>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => onAddShape('rectangle')}
                className="aspect-square bg-[#313244] rounded-xl flex items-center justify-center hover:bg-[#45475a] transition-colors"
              >
                <Square className="w-6 h-6 text-[#89b4fa]" fill="currentColor" />
              </button>
              <button 
                onClick={() => onAddShape('circle')}
                className="aspect-square bg-[#313244] rounded-xl flex items-center justify-center hover:bg-[#45475a] transition-colors"
              >
                <Circle className="w-6 h-6 text-[#a6e3a1]" fill="currentColor" />
              </button>
              <button 
                onClick={() => onAddShape('rounded-rect')}
                className="aspect-square bg-[#313244] rounded-xl flex items-center justify-center hover:bg-[#45475a] transition-colors"
              >
                <div className="w-6 h-5 bg-[#cba6f7] rounded-md" />
              </button>
              <button 
                onClick={() => onAddShape('triangle')}
                className="aspect-square bg-[#313244] rounded-xl flex items-center justify-center hover:bg-[#45475a] transition-colors"
              >
                <Triangle className="w-6 h-6 text-[#f9e2af]" fill="currentColor" />
              </button>
            </div>

            <h4 className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wider pt-2">Quick Colors</h4>
            <div className="grid grid-cols-6 gap-2">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color}
                  className="aspect-square rounded-lg border border-[#45475a] hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        );

      case 'layers':
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wider mb-3">Layers</h4>
            {elements.length === 0 ? (
              <div className="text-center py-8 text-[#6c7086]">
                <p className="text-sm">No layers yet</p>
                <p className="text-xs mt-1">Add elements to see them here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...elements].reverse().map((el, idx) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElement(el.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedElement === el.id 
                        ? 'bg-[#89b4fa]/20 border border-[#89b4fa]' 
                        : 'hover:bg-[#313244] border border-transparent'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-[#6c7086]" />
                    
                    <div className="w-8 h-8 bg-[#313244] rounded flex items-center justify-center flex-shrink-0">
                      {el.type === 'text' && <Type className="w-4 h-4 text-[#cdd6f4]" />}
                      {el.type === 'shape' && <Square className="w-4 h-4 text-[#cdd6f4]" />}
                      {(el.type === 'image' || el.type === 'clipart') && <Image className="w-4 h-4 text-[#cdd6f4]" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#cdd6f4] truncate">
                        {el.type === 'text' ? el.text?.slice(0, 15) || 'Text' : el.type}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}
                        className="p-1 text-[#6c7086] hover:text-white"
                      >
                        {el.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                        className="p-1 text-[#6c7086] hover:text-[#f38ba8]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-72 bg-[#1e1e2e] border-r border-[#313244] flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#313244]">
        <h3 className="text-sm font-semibold text-[#cdd6f4] capitalize">{activeTab}</h3>
        <button onClick={onClose} className="p-1 text-[#6c7086] hover:text-white rounded hover:bg-[#313244]">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
}