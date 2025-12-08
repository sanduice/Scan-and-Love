import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import {
  Type, Image, Shapes, Upload, Loader2, Search, X,
  Square, Circle, Triangle, Star, Heart, Hexagon,
  ArrowRight, CheckCircle, Zap, Award, ThumbsUp,
  LayoutTemplate, Sparkles, ImagePlus
} from 'lucide-react';
import { toast } from 'sonner';

const SHAPES = [
  { id: 'rect', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'rounded-rect', name: 'Rounded', icon: Square },
];

// Dynamic text presets handled inside component

const CLIPART_CATEGORIES = [
  {
    name: 'Business',
    items: [
      'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      'https://cdn-icons-png.flaticon.com/512/1995/1995574.png',
      'https://cdn-icons-png.flaticon.com/512/4213/4213726.png',
      'https://cdn-icons-png.flaticon.com/512/3281/3281289.png',
    ]
  },
  {
    name: 'Arrows & Icons',
    items: [
      'https://cdn-icons-png.flaticon.com/512/545/545682.png',
      'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
      'https://cdn-icons-png.flaticon.com/512/1828/1828743.png',
      'https://cdn-icons-png.flaticon.com/512/1828/1828940.png',
    ]
  },
  {
    name: 'Sale & Promo',
    items: [
      'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
      'https://cdn-icons-png.flaticon.com/512/2331/2331966.png',
      'https://cdn-icons-png.flaticon.com/512/3144/3144472.png',
      'https://cdn-icons-png.flaticon.com/512/4213/4213704.png',
    ]
  },
];

const STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400',
];

export default function ElementsPanel({ 
  onAddText, 
  onAddShape, 
  onAddImage, 
  onAddClipart,
  onApplyTemplate,
  canvasWidth,
  canvasHeight,
}) {
  const [activeTab, setActiveTab] = useState('text');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  // Calculate dynamic text presets based on canvas size
  // We use a percentage of the canvas height to ensure text starts at a visible size
  const textPresets = [
    { label: 'Add a heading', fontSize: Math.max(0.5, canvasHeight * 0.12), fontWeight: 'bold' },
    { label: 'Add a subheading', fontSize: Math.max(0.3, canvasHeight * 0.07), fontWeight: 'semibold' },
    { label: 'Add body text', fontSize: Math.max(0.2, canvasHeight * 0.04), fontWeight: 'normal' },
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onAddImage(file_url);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const TEMPLATES = [
    {
      name: 'Sale Banner',
      thumbnail: '🏷️',
      elements: [
        { type: 'shape', shape: 'rect', fill: '#EF4444', x: 0, y: 0, width: canvasWidth, height: canvasHeight },
        { type: 'text', text: 'SALE', fontSize: canvasHeight * 0.35, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', x: canvasWidth * 0.1, y: canvasHeight * 0.15, width: canvasWidth * 0.8, height: canvasHeight * 0.4 },
        { type: 'text', text: 'UP TO 50% OFF', fontSize: canvasHeight * 0.12, fontWeight: 'normal', color: '#FEE2E2', textAlign: 'center', x: canvasWidth * 0.1, y: canvasHeight * 0.6, width: canvasWidth * 0.8, height: canvasHeight * 0.2 },
      ]
    },
    {
      name: 'Grand Opening',
      thumbnail: '🎉',
      elements: [
        { type: 'shape', shape: 'rect', fill: '#1E40AF', x: 0, y: 0, width: canvasWidth, height: canvasHeight },
        { type: 'text', text: 'GRAND OPENING', fontSize: canvasHeight * 0.2, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', x: canvasWidth * 0.05, y: canvasHeight * 0.25, width: canvasWidth * 0.9, height: canvasHeight * 0.25 },
        { type: 'text', text: 'Join Us!', fontSize: canvasHeight * 0.12, fontWeight: 'normal', color: '#93C5FD', textAlign: 'center', x: canvasWidth * 0.1, y: canvasHeight * 0.55, width: canvasWidth * 0.8, height: canvasHeight * 0.15 },
      ]
    },
    {
      name: 'Now Hiring',
      thumbnail: '👔',
      elements: [
        { type: 'shape', shape: 'rect', fill: '#059669', x: 0, y: 0, width: canvasWidth, height: canvasHeight },
        { type: 'text', text: 'NOW HIRING', fontSize: canvasHeight * 0.25, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', x: canvasWidth * 0.05, y: canvasHeight * 0.2, width: canvasWidth * 0.9, height: canvasHeight * 0.3 },
        { type: 'text', text: 'Apply Today!', fontSize: canvasHeight * 0.12, fontWeight: 'normal', color: '#D1FAE5', textAlign: 'center', x: canvasWidth * 0.1, y: canvasHeight * 0.55, width: canvasWidth * 0.8, height: canvasHeight * 0.15 },
      ]
    },
    {
      name: 'Coming Soon',
      thumbnail: '⏰',
      elements: [
        { type: 'shape', shape: 'rect', fill: '#7C3AED', x: 0, y: 0, width: canvasWidth, height: canvasHeight },
        { type: 'text', text: 'COMING SOON', fontSize: canvasHeight * 0.22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', x: canvasWidth * 0.05, y: canvasHeight * 0.3, width: canvasWidth * 0.9, height: canvasHeight * 0.3 },
      ]
    },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 m-3 mb-0">
          <TabsTrigger value="text" className="text-xs">
            <Type className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="images" className="text-xs">
            <Image className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="shapes" className="text-xs">
            <Shapes className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            <LayoutTemplate className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Text Tab */}
          <TabsContent value="text" className="h-full m-0 p-3">
            <ScrollArea className="h-full">
              <h3 className="font-semibold text-gray-900 mb-3">Add Text</h3>
              <div className="space-y-2">
                {textPresets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => onAddText(preset)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <span 
                      className="block"
                      style={{ 
                        fontSize: i === 0 ? '20px' : i === 1 ? '16px' : '14px', 
                        fontWeight: preset.fontWeight 
                      }}
                    >
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Quick Text Styles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['BOLD IMPACT', 'elegant script', 'SALE 50%', 'Call Now!'].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => onAddText({ 
                        label: text, 
                        fontSize: Math.max(0.3, canvasHeight * 0.08), 
                        fontWeight: i === 0 ? 'bold' : 'normal',
                        fontFamily: i === 1 ? 'Georgia' : 'Arial'
                      })}
                      className="p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="h-full m-0 p-3">
            <ScrollArea className="h-full">
              {/* Upload */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Upload Image</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Stock Photos */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Stock Photos</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search photos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STOCK_PHOTOS.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => onAddImage(url)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Clipart */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Graphics & Icons</h3>
                {CLIPART_CATEGORIES.map((category) => (
                  <div key={category.name} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">{category.name}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {category.items.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => onAddClipart(url)}
                          className="aspect-square p-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                          <img src={url} alt="" className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Shapes Tab */}
          <TabsContent value="shapes" className="h-full m-0 p-3">
            <ScrollArea className="h-full">
              <h3 className="font-semibold text-gray-900 mb-3">Basic Shapes</h3>
              <div className="grid grid-cols-3 gap-3">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => onAddShape(shape.id)}
                    className="aspect-square flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <shape.icon className="w-8 h-8 text-gray-600" />
                    <span className="text-xs text-gray-500 mt-2">{shape.name}</span>
                  </button>
                ))}
              </div>

              <h3 className="font-semibold text-gray-900 mt-6 mb-3">Color Blocks</h3>
              <div className="grid grid-cols-4 gap-2">
                {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#1E293B'].map((color) => (
                  <button
                    key={color}
                    onClick={() => onAddShape('rect', color)}
                    className="aspect-square rounded-lg border-2 border-transparent hover:border-gray-400 transition-all"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="h-full m-0 p-3">
            <ScrollArea className="h-full">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Start Templates</h3>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => onApplyTemplate(template)}
                    className="aspect-video flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <span className="text-3xl mb-2">{template.thumbnail}</span>
                    <span className="text-xs text-gray-600">{template.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">AI Design Help</span>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Describe what you want and let AI create it for you
                </p>
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                  Coming Soon
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}