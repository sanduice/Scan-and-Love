import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import {
  Type, Image, Shapes, Upload, Loader2, Search, Pin,
  Square, Circle, LayoutGrid, Triangle, Star, Hexagon, 
  Minus, ArrowRight, Diamond, Heart, Pentagon, Octagon,
  ArrowUp, ArrowDown, ArrowLeft, MoveHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Font categories for the text tab
const FONT_FAMILIES = [
  // Sans-Serif
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Quicksand', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'Source Sans Pro', category: 'sans-serif' },
  { name: 'Comfortaa', category: 'sans-serif' },
  // Serif
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Cinzel', category: 'serif' },
  // Display
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Oswald', category: 'display' },
  { name: 'Anton', category: 'display' },
  { name: 'Archivo Black', category: 'display' },
  { name: 'Staatliches', category: 'display' },
  { name: 'Righteous', category: 'display' },
  // Script/Handwritten
  { name: 'Dancing Script', category: 'script' },
  { name: 'Pacifico', category: 'script' },
  { name: 'Great Vibes', category: 'script' },
  { name: 'Sacramento', category: 'script' },
  { name: 'Lobster', category: 'script' },
  { name: 'Satisfy', category: 'script' },
  { name: 'Shadows Into Light', category: 'script' },
  { name: 'Permanent Marker', category: 'script' },
  { name: 'Abril Fatface', category: 'display' },
];

// Pre-designed text style combos
const TEXT_COMBOS = [
  { name: 'Bold Impact', preview: 'BOLD', fontFamily: 'Bebas Neue', fontWeight: 'normal', color: '#000000' },
  { name: 'Elegant Script', preview: 'Elegant', fontFamily: 'Great Vibes', fontWeight: 'normal', color: '#8B5CF6' },
  { name: 'Modern Clean', preview: 'Modern', fontFamily: 'Montserrat', fontWeight: '600', color: '#3B82F6' },
  { name: 'Retro Vintage', preview: 'RETRO', fontFamily: 'Abril Fatface', fontWeight: 'normal', color: '#F97316' },
  { name: 'Playful Fun', preview: 'Fun!', fontFamily: 'Pacifico', fontWeight: 'normal', color: '#EC4899' },
  { name: 'Corporate Pro', preview: 'Pro', fontFamily: 'Open Sans', fontWeight: '700', color: '#1E293B' },
  { name: 'Sale Promo', preview: 'SALE', fontFamily: 'Anton', fontWeight: 'normal', color: '#EF4444' },
  { name: 'Handwritten', preview: 'Hello', fontFamily: 'Shadows Into Light', fontWeight: 'normal', color: '#10B981' },
];

// Enhanced shapes with clip-paths
const SHAPES = [
  // Basic shapes
  { id: 'rect', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'rounded-rect', name: 'Rounded', icon: Square },
  // New shapes
  { id: 'triangle', name: 'Triangle', icon: Triangle },
  { id: 'star', name: 'Star', icon: Star },
  { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
  { id: 'pentagon', name: 'Pentagon', icon: Pentagon },
  { id: 'diamond', name: 'Diamond', icon: Diamond },
  { id: 'heart', name: 'Heart', icon: Heart },
  { id: 'octagon', name: 'Octagon', icon: Octagon },
];

// Lines & Arrows
const LINES_ARROWS = [
  { id: 'line-h', name: 'Line', icon: Minus },
  { id: 'line-v', name: 'Vertical', icon: Minus, rotate: 90 },
  { id: 'arrow-right', name: 'Arrow →', icon: ArrowRight },
  { id: 'arrow-left', name: 'Arrow ←', icon: ArrowLeft },
  { id: 'arrow-up', name: 'Arrow ↑', icon: ArrowUp },
  { id: 'arrow-down', name: 'Arrow ↓', icon: ArrowDown },
  { id: 'double-arrow', name: 'Double ↔', icon: MoveHorizontal },
];

// Speech bubbles and callout shapes
const SPEECH_BUBBLES = [
  // Speech bubbles with tails
  { id: 'speech-round-bl', name: 'Round (BL)', svg: 'M20,4 C28.84,4 36,10.27 36,18 C36,25.73 28.84,32 20,32 L10,32 L14,26 C8.5,24 4,21.5 4,18 C4,10.27 11.16,4 20,4 Z' },
  { id: 'speech-round-br', name: 'Round (BR)', svg: 'M20,4 C11.16,4 4,10.27 4,18 C4,25.73 11.16,32 20,32 L30,32 L26,26 C31.5,24 36,21.5 36,18 C36,10.27 28.84,4 20,4 Z' },
  { id: 'speech-round-bc', name: 'Round (BC)', svg: 'M20,2 C31,2 38,9 38,18 C38,27 31,34 20,34 L24,34 L20,42 L16,34 L20,34 C9,34 2,27 2,18 C2,9 9,2 20,2 Z' },
  { id: 'speech-rect-bl', name: 'Rect (BL)', svg: 'M4,4 L36,4 L36,28 L14,28 L6,38 L10,28 L4,28 Z' },
  { id: 'speech-rect-br', name: 'Rect (BR)', svg: 'M4,4 L36,4 L36,28 L30,28 L34,38 L26,28 L4,28 Z' },
  { id: 'speech-rect-bc', name: 'Rect (BC)', svg: 'M4,4 L36,4 L36,26 L24,26 L20,36 L16,26 L4,26 Z' },
  { id: 'speech-rect-fold', name: 'Folded', svg: 'M4,4 L32,4 L36,8 L36,36 L4,36 Z M32,4 L32,8 L36,8' },
  // Thought/cloud bubbles
  { id: 'thought-cloud', name: 'Thought', svg: 'M30,18 C32,14 32,8 26,6 C24,2 18,2 14,4 C10,2 4,4 4,10 C2,12 2,18 6,20 C4,24 6,28 12,28 L12,32 L8,36 L12,32 C14,30 18,30 20,28 L28,28 C34,28 36,22 30,18 Z' },
  { id: 'cloud-bubble', name: 'Cloud', svg: 'M28,26 C32,26 34,22 32,18 C36,16 36,10 30,8 C30,4 24,2 20,4 C16,0 8,2 8,8 C4,8 2,14 6,18 C2,20 4,26 10,26 Z' },
  { id: 'cloud-bumpy', name: 'Bumpy', svg: 'M10,28 C4,28 2,22 6,18 C2,14 4,8 10,8 C10,2 18,0 22,4 C26,0 34,2 34,8 C38,8 40,14 36,18 C40,22 38,28 32,28 Z' },
  // Callout shapes
  { id: 'callout-left', name: 'Call Left', svg: 'M12,4 L36,4 L36,32 L12,32 L4,18 Z' },
  { id: 'callout-right', name: 'Call Right', svg: 'M4,4 L28,4 L36,18 L28,32 L4,32 Z' },
  // Banners & Ribbons
  { id: 'ribbon-wave', name: 'Wave', svg: 'M0,8 L4,0 L4,8 L36,8 L36,0 L40,8 L40,32 L36,40 L36,32 L4,32 L4,40 L0,32 Z' },
  { id: 'ribbon-banner', name: 'Banner', svg: 'M0,4 L40,4 L40,28 L34,28 L40,40 L30,28 L10,28 L0,40 L6,28 L0,28 Z' },
  { id: 'ribbon-scroll', name: 'Scroll', svg: 'M6,8 L34,8 L38,4 L38,12 L34,8 L34,32 L38,28 L38,36 L34,32 L6,32 L2,36 L2,28 L6,32 L6,8 L2,12 L2,4 Z' },
  { id: 'badge-shield', name: 'Shield', svg: 'M4,4 L36,4 L36,24 L20,36 L4,24 Z' },
  // Brackets & Frames
  { id: 'bracket-left', name: 'Bracket L', svg: 'M16,4 L8,4 L8,16 L4,20 L8,24 L8,36 L16,36 L16,32 L12,32 L12,22 L8,20 L12,18 L12,8 L16,8 Z' },
  { id: 'bracket-curly', name: 'Curly', svg: 'M14,4 L10,4 C8,4 6,6 6,8 L6,16 C6,18 4,20 2,20 C4,20 6,22 6,24 L6,32 C6,34 8,36 10,36 L14,36 L14,32 L12,32 C10,32 10,30 10,28 L10,22 C10,20 8,18 6,18 C8,18 10,16 10,14 L10,8 C10,6 10,4 12,4 L14,4 Z' },
  { id: 'bracket-round', name: 'Round', svg: 'M14,4 C8,4 4,10 4,20 C4,30 8,36 14,36 L14,32 C10,32 8,28 8,20 C8,12 10,8 14,8 Z' },
  // Decorative frames
  { id: 'frame-scallop', name: 'Scallop', svg: 'M20,2 C22,2 24,4 24,6 C26,4 30,4 32,6 C34,4 38,4 38,8 C40,10 40,14 38,16 C40,18 40,22 38,24 C40,26 40,30 38,32 C38,36 34,36 32,34 C30,36 26,36 24,34 C22,36 18,36 16,34 C14,36 10,36 8,34 C6,36 2,36 2,32 C0,30 0,26 2,24 C0,22 0,18 2,16 C0,14 0,10 2,8 C2,4 6,4 8,6 C10,4 14,4 16,6 C18,4 18,2 20,2 Z' },
  { id: 'frame-ticket', name: 'Ticket', svg: 'M4,8 C4,6 6,4 8,4 L32,4 C34,4 36,6 36,8 L36,14 C34,14 32,16 32,18 C32,20 34,22 36,22 L36,28 C36,30 34,32 32,32 L8,32 C6,32 4,30 4,28 L4,22 C6,22 8,20 8,18 C8,16 6,14 4,14 Z' },
  { id: 'starburst', name: 'Starburst', svg: 'M20,0 L23,14 L36,8 L26,18 L40,20 L26,22 L36,32 L23,26 L20,40 L17,26 L4,32 L14,22 L0,20 L14,18 L4,8 L17,14 Z' },
];

// Expanded clipart categories
const CLIPART_CATEGORIES = [
  {
    name: 'Business',
    items: [
      'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      'https://cdn-icons-png.flaticon.com/512/1995/1995574.png',
      'https://cdn-icons-png.flaticon.com/512/4213/4213726.png',
      'https://cdn-icons-png.flaticon.com/512/3281/3281289.png',
      'https://cdn-icons-png.flaticon.com/512/2910/2910791.png',
      'https://cdn-icons-png.flaticon.com/512/3062/3062634.png',
      'https://cdn-icons-png.flaticon.com/512/2936/2936690.png',
      'https://cdn-icons-png.flaticon.com/512/3176/3176292.png',
    ]
  },
  {
    name: 'Arrows & Pointers',
    items: [
      'https://cdn-icons-png.flaticon.com/512/545/545682.png',
      'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
      'https://cdn-icons-png.flaticon.com/512/1828/1828743.png',
      'https://cdn-icons-png.flaticon.com/512/1828/1828940.png',
      'https://cdn-icons-png.flaticon.com/512/2989/2989988.png',
      'https://cdn-icons-png.flaticon.com/512/271/271228.png',
      'https://cdn-icons-png.flaticon.com/512/318/318476.png',
      'https://cdn-icons-png.flaticon.com/512/130/130906.png',
    ]
  },
  {
    name: 'Sale & Promo',
    items: [
      'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
      'https://cdn-icons-png.flaticon.com/512/2331/2331966.png',
      'https://cdn-icons-png.flaticon.com/512/3144/3144472.png',
      'https://cdn-icons-png.flaticon.com/512/4213/4213704.png',
      'https://cdn-icons-png.flaticon.com/512/1170/1170576.png',
      'https://cdn-icons-png.flaticon.com/512/4221/4221586.png',
      'https://cdn-icons-png.flaticon.com/512/3176/3176298.png',
      'https://cdn-icons-png.flaticon.com/512/726/726476.png',
    ]
  },
  {
    name: 'Social Media',
    items: [
      'https://cdn-icons-png.flaticon.com/512/733/733547.png',
      'https://cdn-icons-png.flaticon.com/512/733/733558.png',
      'https://cdn-icons-png.flaticon.com/512/733/733579.png',
      'https://cdn-icons-png.flaticon.com/512/733/733585.png',
      'https://cdn-icons-png.flaticon.com/512/3670/3670051.png',
      'https://cdn-icons-png.flaticon.com/512/3536/3536505.png',
      'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      'https://cdn-icons-png.flaticon.com/512/4494/4494477.png',
    ]
  },
  {
    name: 'Food & Restaurant',
    items: [
      'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
      'https://cdn-icons-png.flaticon.com/512/924/924514.png',
      'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
      'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
      'https://cdn-icons-png.flaticon.com/512/706/706164.png',
      'https://cdn-icons-png.flaticon.com/512/2718/2718224.png',
      'https://cdn-icons-png.flaticon.com/512/3480/3480618.png',
      'https://cdn-icons-png.flaticon.com/512/2515/2515183.png',
    ]
  },
  {
    name: 'Celebration',
    items: [
      'https://cdn-icons-png.flaticon.com/512/3656/3656988.png',
      'https://cdn-icons-png.flaticon.com/512/3656/3656951.png',
      'https://cdn-icons-png.flaticon.com/512/2415/2415212.png',
      'https://cdn-icons-png.flaticon.com/512/3656/3656868.png',
      'https://cdn-icons-png.flaticon.com/512/3097/3097913.png',
      'https://cdn-icons-png.flaticon.com/512/1048/1048949.png',
      'https://cdn-icons-png.flaticon.com/512/2469/2469402.png',
      'https://cdn-icons-png.flaticon.com/512/3656/3656855.png',
    ]
  },
  {
    name: 'Nature',
    items: [
      'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
      'https://cdn-icons-png.flaticon.com/512/628/628283.png',
      'https://cdn-icons-png.flaticon.com/512/2917/2917242.png',
      'https://cdn-icons-png.flaticon.com/512/1146/1146869.png',
      'https://cdn-icons-png.flaticon.com/512/1146/1146799.png',
      'https://cdn-icons-png.flaticon.com/512/2917/2917563.png',
      'https://cdn-icons-png.flaticon.com/512/3262/3262024.png',
      'https://cdn-icons-png.flaticon.com/512/979/979585.png',
    ]
  },
  {
    name: 'Travel',
    items: [
      'https://cdn-icons-png.flaticon.com/512/201/201623.png',
      'https://cdn-icons-png.flaticon.com/512/2942/2942017.png',
      'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      'https://cdn-icons-png.flaticon.com/512/3079/3079155.png',
      'https://cdn-icons-png.flaticon.com/512/2933/2933245.png',
      'https://cdn-icons-png.flaticon.com/512/2991/2991150.png',
      'https://cdn-icons-png.flaticon.com/512/2995/2995024.png',
      'https://cdn-icons-png.flaticon.com/512/2503/2503508.png',
    ]
  },
];

// Stock photos organized by category
const STOCK_PHOTOS = [
  // Business & Office
  { url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400', category: 'business' },
  { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', category: 'business' },
  { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400', category: 'business' },
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400', category: 'business' },
  { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400', category: 'business' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', category: 'business' },
  // Nature
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400', category: 'nature' },
  { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', category: 'nature' },
  { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400', category: 'nature' },
  { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400', category: 'nature' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400', category: 'nature' },
  { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400', category: 'nature' },
  // Food
  { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', category: 'food' },
  { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', category: 'food' },
  { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', category: 'food' },
  { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', category: 'food' },
  { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', category: 'food' },
  { url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', category: 'food' },
  // People
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', category: 'people' },
  { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', category: 'people' },
  { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', category: 'people' },
  { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', category: 'people' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', category: 'people' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', category: 'people' },
  // Abstract
  { url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400', category: 'abstract' },
  { url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400', category: 'abstract' },
  { url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400', category: 'abstract' },
  { url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400', category: 'abstract' },
  { url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=400', category: 'abstract' },
  { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', category: 'abstract' },
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
  const [selectedFontCategory, setSelectedFontCategory] = useState('all');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('all');
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

  // Filter fonts by category
  const filteredFonts = selectedFontCategory === 'all' 
    ? FONT_FAMILIES 
    : FONT_FAMILIES.filter(f => f.category === selectedFontCategory);

  // Filter photos by category
  const filteredPhotos = selectedPhotoCategory === 'all'
    ? STOCK_PHOTOS
    : STOCK_PHOTOS.filter(p => p.category === selectedPhotoCategory);

  const renderDrawerContent = () => {
    switch (activeItem) {
      case 'text':
        return (
          <div className="p-4">
            {/* Add Text Presets */}
            <div className="space-y-2 mb-6">
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

            {/* Font Families */}
            <div className="mb-6">
              <h4 className="font-medium text-foreground text-sm mb-3">Font Families</h4>
              
              {/* Category Filter */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {['all', 'sans-serif', 'serif', 'display', 'script'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFontCategory(cat)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors capitalize",
                      selectedFontCategory === cat 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              {/* Font Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {filteredFonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => onAddText({ 
                      label: font.name.split(' ')[0], 
                      fontSize: Math.max(0.4, canvasHeight * 0.08), 
                      fontWeight: 'normal',
                      fontFamily: font.name
                    })}
                    className="p-2 text-sm border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left truncate"
                    style={{ fontFamily: font.name }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Style Combos */}
            <div>
              <h4 className="font-medium text-foreground text-sm mb-3">Text Style Combos</h4>
              <div className="grid grid-cols-2 gap-2">
                {TEXT_COMBOS.map((combo, i) => (
                  <button
                    key={i}
                    onClick={() => onAddText({ 
                      label: combo.preview, 
                      fontSize: Math.max(0.4, canvasHeight * 0.1), 
                      fontWeight: combo.fontWeight,
                      fontFamily: combo.fontFamily,
                      color: combo.color
                    })}
                    className="p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                    title={combo.name}
                  >
                    <span 
                      style={{ 
                        fontFamily: combo.fontFamily, 
                        fontWeight: combo.fontWeight,
                        color: combo.color,
                        fontSize: '16px'
                      }}
                    >
                      {combo.preview}
                    </span>
                    <span className="block text-[10px] text-muted-foreground mt-1">
                      {combo.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'shapes':
        return (
          <div className="p-4">
            {/* Basic Shapes */}
            <h4 className="font-medium text-foreground text-sm mb-3">Basic Shapes</h4>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex flex-col items-center justify-center p-2 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <shape.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">{shape.name}</span>
                </button>
              ))}
            </div>

            {/* Speech Bubbles & Callouts */}
            <h4 className="font-medium text-foreground text-sm mb-3">Speech Bubbles & Callouts</h4>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {SPEECH_BUBBLES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex flex-col items-center justify-center p-2 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <svg viewBox="0 0 40 40" className="w-6 h-6 text-muted-foreground fill-current">
                    <path d={shape.svg} />
                  </svg>
                  <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">{shape.name}</span>
                </button>
              ))}
            </div>

            {/* Lines & Arrows */}
            <h4 className="font-medium text-foreground text-sm mb-3">Lines & Arrows</h4>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {LINES_ARROWS.map((line) => (
                <button
                  key={line.id}
                  onClick={() => onAddShape(line.id)}
                  className="aspect-square flex flex-col items-center justify-center p-2 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={line.name}
                >
                  <line.icon 
                    className="w-5 h-5 text-muted-foreground" 
                    style={{ transform: line.rotate ? `rotate(${line.rotate}deg)` : undefined }}
                  />
                  <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">{line.name}</span>
                </button>
              ))}
            </div>

            {/* Color Blocks */}
            <h4 className="font-medium text-foreground text-sm mb-3">Color Blocks</h4>
            <div className="grid grid-cols-8 gap-1.5">
              {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', 
                '#1E293B', '#64748B', '#FFFFFF', '#F1F5F9'].map((color) => (
                <button
                  key={color}
                  onClick={() => onAddShape('rect', color)}
                  className={cn(
                    "aspect-square rounded-md border-2 hover:scale-110 transition-all",
                    color === '#FFFFFF' ? "border-gray-300" : "border-transparent hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        );

      case 'elements':
        return (
          <div className="p-4">
            {/* Graphics & Icons */}
            <h4 className="font-medium text-foreground text-sm mb-3">Graphics & Icons</h4>
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

            {/* Stock Photos */}
            <h4 className="font-medium text-foreground text-sm mt-6 mb-3">Stock Photos</h4>
            
            {/* Photo Category Filter */}
            <div className="flex gap-1 mb-3 flex-wrap">
              {['all', 'business', 'nature', 'food', 'people', 'abstract'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedPhotoCategory(cat)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors capitalize",
                    selectedPhotoCategory === cat 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => onAddImage(photo.url)}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="p-4">
            <h4 className="font-medium text-foreground text-sm mb-3">Upload Image</h4>
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
          showDrawer ? "w-[300px] opacity-100" : "w-0 opacity-0 pointer-events-none"
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