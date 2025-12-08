import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Type, Image, Square, Circle, Upload, Layout, Shapes, Palette,
  Star, Triangle, Hexagon, Heart, Loader2, Search, ChevronDown, Smile
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
      { id: 'graduation', name: 'Graduation', color: '#1E40AF', text: 'Class of 2024', subtext: 'Congratulations!' },
    ],
    'Announcements': [
      { id: 'we-moved', name: 'We Moved', color: '#0891B2', text: 'WE MOVED!', subtext: 'New Location' },
      { id: 'hiring', name: 'Now Hiring', color: '#16A34A', text: 'NOW HIRING', subtext: 'Apply Today' },
    ],
  },
  'yard-sign': {
    'Real Estate': [
      { id: 'for-sale', name: 'For Sale', color: '#DC2626', text: 'FOR SALE', subtext: 'Call: 555-1234' },
      { id: 'for-rent', name: 'For Rent', color: '#2563EB', text: 'FOR RENT', subtext: 'Call Now' },
      { id: 'open-house', name: 'Open House', color: '#1E40AF', text: 'OPEN HOUSE', subtext: 'Sunday 1-4PM' },
      { id: 'sold', name: 'Sold', color: '#DC2626', text: 'SOLD', subtext: '' },
    ],
    'Political': [
      { id: 'vote', name: 'Vote For', color: '#DC2626', text: 'VOTE', subtext: '[Candidate]' },
      { id: 'campaign', name: 'Campaign', color: '#1E40AF', text: '[Name]', subtext: 'For [Office]' },
    ],
    'Events': [
      { id: 'yard-sale', name: 'Yard Sale', color: '#F59E0B', text: 'YARD SALE', subtext: 'Saturday 9AM' },
      { id: 'party', name: 'Party Here', color: '#EC4899', text: 'PARTY HERE!', subtext: '→' },
    ],
  },
};

// Clipart categories
const CLIPART_CATEGORIES = {
  'Arrows': [
    { id: 'arrow-right', url: 'https://www.svgrepo.com/show/533661/arrow-right.svg' },
    { id: 'arrow-left', url: 'https://www.svgrepo.com/show/533655/arrow-left.svg' },
    { id: 'arrow-up', url: 'https://www.svgrepo.com/show/533663/arrow-up.svg' },
    { id: 'arrow-down', url: 'https://www.svgrepo.com/show/533657/arrow-down.svg' },
  ],
  'Stars & Shapes': [
    { id: 'star', url: 'https://www.svgrepo.com/show/513354/star.svg' },
    { id: 'heart', url: 'https://www.svgrepo.com/show/525418/heart.svg' },
    { id: 'circle', url: 'https://www.svgrepo.com/show/526773/circle.svg' },
    { id: 'check', url: 'https://www.svgrepo.com/show/525834/check-circle.svg' },
  ],
  'Business': [
    { id: 'phone', url: 'https://www.svgrepo.com/show/525896/phone.svg' },
    { id: 'mail', url: 'https://www.svgrepo.com/show/525737/letter.svg' },
    { id: 'location', url: 'https://www.svgrepo.com/show/525752/map-point.svg' },
    { id: 'clock', url: 'https://www.svgrepo.com/show/525847/clock-circle.svg' },
  ],
  'Social': [
    { id: 'facebook', url: 'https://www.svgrepo.com/show/521654/facebook.svg' },
    { id: 'instagram', url: 'https://www.svgrepo.com/show/521711/instagram.svg' },
    { id: 'twitter', url: 'https://www.svgrepo.com/show/521828/twitter.svg' },
    { id: 'website', url: 'https://www.svgrepo.com/show/525882/global.svg' },
  ],
  'Celebration': [
    { id: 'cake', url: 'https://www.svgrepo.com/show/408416/cake-birthday-candles-dessert.svg' },
    { id: 'gift', url: 'https://www.svgrepo.com/show/524424/gift.svg' },
    { id: 'balloon', url: 'https://www.svgrepo.com/show/395286/balloon.svg' },
    { id: 'party', url: 'https://www.svgrepo.com/show/395322/party-popper.svg' },
  ],
};

export default function ToolPanel({ 
  activeTab, 
  setActiveTab, 
  onAddText, 
  onAddShape,
  onImageUpload,
  onAddClipart,
  isUploading,
  canvasWidth,
  canvasHeight,
  templates = [],
  onApplyTemplate,
  productType = 'vinyl-banner',
}) {
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [clipartCategory, setClipartCategory] = useState('Arrows');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
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

  return (
    <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-gray-900 rounded-none border-b border-gray-700 grid grid-cols-5 h-12">
          <TabsTrigger value="templates" className="data-[state=active]:bg-gray-800 flex flex-col gap-0.5 h-full py-1">
            <Layout className="w-4 h-4" />
            <span className="text-[9px]">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:bg-gray-800 flex flex-col gap-0.5 h-full py-1">
            <Type className="w-4 h-4" />
            <span className="text-[9px]">Text</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-gray-800 flex flex-col gap-0.5 h-full py-1">
            <Image className="w-4 h-4" />
            <span className="text-[9px]">Images</span>
          </TabsTrigger>
          <TabsTrigger value="clipart" className="data-[state=active]:bg-gray-800 flex flex-col gap-0.5 h-full py-1">
            <Smile className="w-4 h-4" />
            <span className="text-[9px]">Clipart</span>
          </TabsTrigger>
          <TabsTrigger value="shapes" className="data-[state=active]:bg-gray-800 flex flex-col gap-0.5 h-full py-1">
            <Shapes className="w-4 h-4" />
            <span className="text-[9px]">Shapes</span>
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 overflow-auto m-0 p-3">
          <div className="mb-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Categories</SelectItem>
                {categoryNames.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedCategory ? [selectedCategory] : categoryNames).map(category => (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">{category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {templateCategories[category].map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className="aspect-[2/1] rounded-lg overflow-hidden hover:ring-2 ring-blue-500 transition-all group relative"
                    style={{ backgroundColor: template.color }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                      <span className="text-white text-[8px] font-bold text-center leading-tight truncate w-full">
                        {template.text}
                      </span>
                      {template.subtext && (
                        <span className="text-white/80 text-[6px] truncate w-full text-center">
                          {template.subtext}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5">
                      <span className="text-white text-[8px] block text-center">{template.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="flex-1 overflow-auto m-0 p-4">
          <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">Add Text</h4>
          <div className="space-y-2">
            <Button 
              onClick={onAddText}
              className="w-full h-auto py-4 bg-gray-700 hover:bg-gray-600 text-white justify-start"
            >
              <div className="text-left">
                <div className="text-lg font-bold">Add Heading</div>
                <div className="text-xs text-gray-400">Large title text</div>
              </div>
            </Button>
            <Button 
              onClick={onAddText}
              className="w-full h-auto py-3 bg-gray-700 hover:bg-gray-600 text-white justify-start"
            >
              <div className="text-left">
                <div className="text-base font-medium">Add Subheading</div>
                <div className="text-xs text-gray-400">Medium text</div>
              </div>
            </Button>
            <Button 
              onClick={onAddText}
              className="w-full h-auto py-2 bg-gray-700 hover:bg-gray-600 text-white justify-start"
            >
              <div className="text-left">
                <div className="text-sm">Add Body Text</div>
                <div className="text-xs text-gray-400">Small paragraph text</div>
              </div>
            </Button>
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="flex-1 overflow-auto m-0 p-4">
          <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">Upload Image</h4>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-blue-500 hover:bg-gray-700/50 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            )}
            <div className="text-white text-sm font-medium">
              {isUploading ? 'Uploading...' : 'Click to upload'}
            </div>
            <div className="text-gray-400 text-xs mt-1">PNG, JPG, SVG up to 50MB</div>
          </button>
        </TabsContent>

        {/* Clipart Tab */}
        <TabsContent value="clipart" className="flex-1 overflow-auto m-0 p-3">
          <div className="mb-3">
            <Select value={clipartCategory} onValueChange={setClipartCategory}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CLIPART_CATEGORIES).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {CLIPART_CATEGORIES[clipartCategory]?.map((clip) => (
              <button
                key={clip.id}
                onClick={() => onAddClipart && onAddClipart(clip.url)}
                className="aspect-square bg-white rounded-lg p-2 hover:ring-2 ring-blue-500 transition-all"
              >
                <img src={clip.url} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Icons from SVG Repo (CC0 License)
          </p>
        </TabsContent>

        {/* Shapes Tab */}
        <TabsContent value="shapes" className="flex-1 overflow-auto m-0 p-4">
          <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">Basic Shapes</h4>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => onAddShape('rectangle')}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Square className="w-6 h-6 text-blue-400" fill="currentColor" />
            </button>
            <button 
              onClick={() => onAddShape('circle')}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Circle className="w-6 h-6 text-green-400" fill="currentColor" />
            </button>
            <button 
              onClick={() => onAddShape('rounded-rect')}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <div className="w-6 h-5 bg-purple-400 rounded-md" />
            </button>
            <button 
              onClick={() => onAddShape('triangle')}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Triangle className="w-6 h-6 text-yellow-400" fill="currentColor" />
            </button>
          </div>

          <h4 className="text-xs font-medium text-gray-400 uppercase mt-6 mb-3">Quick Colors</h4>
          <div className="grid grid-cols-8 gap-1.5">
            {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF', '#6B7280', '#1F2937'].map((color) => (
              <button
                key={color}
                className="aspect-square rounded-md border border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}