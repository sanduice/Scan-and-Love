import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import {
  Type, Image, Shapes, Upload, Loader2, Search, Pin,
  Square, Circle, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SHAPES = [
  { id: 'rect', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'rounded-rect', name: 'Rounded', icon: Square },
];

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

const MENU_ITEMS = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'shapes', label: 'Shapes', icon: Shapes },
  { id: 'elements', label: 'Elements', icon: LayoutGrid },
  { id: 'upload', label: 'Upload', icon: Upload },
];

export default function CanvaSidebar({ 
  onAddText, 
  onAddShape, 
  onAddImage, 
  onAddClipart,
  canvasWidth,
  canvasHeight,
}) {
  const [activeItem, setActiveItem] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Calculate dynamic text presets based on canvas size
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

  const handleItemHover = useCallback((itemId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveItem(itemId);
    setIsHovering(true);
  }, []);

  const handleItemClick = useCallback((itemId) => {
    setActiveItem(itemId);
    setIsHovering(true);
  }, []);

  const handleDrawerLeave = useCallback(() => {
    if (!isPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false);
      }, 150);
    }
  }, [isPinned]);

  const handleIconBarLeave = useCallback(() => {
    if (!isPinned && !isHovering) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false);
      }, 150);
    }
  }, [isPinned, isHovering]);

  const showDrawer = activeItem && (isHovering || isPinned);

  const getActiveLabel = () => {
    const item = MENU_ITEMS.find(m => m.id === activeItem);
    return item?.label || '';
  };

  const renderDrawerContent = () => {
    switch (activeItem) {
      case 'text':
        return (
          <div className="p-4">
            <div className="space-y-2">
              {textPresets.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => onAddText(preset)}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span 
                    className="block text-foreground"
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
              <h4 className="font-medium text-muted-foreground text-sm mb-2">Quick Text Styles</h4>
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
                    className="p-3 text-sm border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'shapes':
        return (
          <div className="p-4">
            <h4 className="font-medium text-muted-foreground text-sm mb-3">Basic Shapes</h4>
            <div className="grid grid-cols-3 gap-3">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <shape.icon className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">{shape.name}</span>
                </button>
              ))}
            </div>

            <h4 className="font-medium text-muted-foreground text-sm mt-6 mb-3">Color Blocks</h4>
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
          </div>
        );

      case 'elements':
        return (
          <div className="p-4">
            <h4 className="font-medium text-muted-foreground text-sm mb-3">Graphics & Icons</h4>
            {CLIPART_CATEGORIES.map((category) => (
              <div key={category.name} className="mb-4">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">{category.name}</h5>
                <div className="grid grid-cols-4 gap-2">
                  {category.items.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => onAddClipart(url)}
                      className="aspect-square p-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <img src={url} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <h4 className="font-medium text-muted-foreground text-sm mt-6 mb-3">Stock Photos</h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="p-4">
            <h4 className="font-medium text-muted-foreground text-sm mb-3">Upload Image</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-32 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-foreground font-medium">Click to upload</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                </div>
              )}
            </Button>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> For best results, use high-resolution images (300 DPI recommended for print).
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-full">
      {/* Icon Bar */}
      <div 
        className="w-[70px] bg-[#F2F3F6] flex flex-col py-2 h-full"
        onMouseLeave={handleIconBarLeave}
      >
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onMouseEnter={() => handleItemHover(item.id)}
            onClick={() => handleItemClick(item.id)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 gap-1 transition-all mx-1 rounded-xl",
              activeItem === item.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Drawer Panel - Absolute positioned overlay */}
      <div 
        className={cn(
          "absolute left-[70px] top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-200 overflow-hidden flex flex-col z-50",
          showDrawer ? "w-[280px] opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleDrawerLeave}
      >
        {/* Drawer Header with Pin */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-foreground">{getActiveLabel()}</h3>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-colors",
              isPinned && "text-primary bg-primary/10"
            )}
            onClick={() => setIsPinned(!isPinned)}
          >
            <Pin 
              className={cn(
                "w-4 h-4 transition-transform",
                isPinned && "rotate-45"
              )} 
            />
          </Button>
        </div>

        {/* Drawer Content */}
        <ScrollArea className="flex-1">
          {renderDrawerContent()}
        </ScrollArea>
      </div>
    </div>
  );
}
