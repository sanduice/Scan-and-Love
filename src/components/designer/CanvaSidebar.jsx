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

// Basic Arrows - 30+ directional/block/curved arrows
const BASIC_ARROWS = [
  // Simple directional arrows
  { id: 'arrow-simple-right', name: 'Simple →', svg: 'M5,18 L25,18 L25,12 L35,20 L25,28 L25,22 L5,22 Z' },
  { id: 'arrow-simple-left', name: 'Simple ←', svg: 'M35,18 L15,18 L15,12 L5,20 L15,28 L15,22 L35,22 Z' },
  { id: 'arrow-simple-up', name: 'Simple ↑', svg: 'M18,35 L18,15 L12,15 L20,5 L28,15 L22,15 L22,35 Z' },
  { id: 'arrow-simple-down', name: 'Simple ↓', svg: 'M18,5 L18,25 L12,25 L20,35 L28,25 L22,25 L22,5 Z' },
  // Block arrows (thick filled)
  { id: 'arrow-block-right', name: 'Block →', svg: 'M2,14 L24,14 L24,6 L38,20 L24,34 L24,26 L2,26 Z' },
  { id: 'arrow-block-left', name: 'Block ←', svg: 'M38,14 L16,14 L16,6 L2,20 L16,34 L16,26 L38,26 Z' },
  { id: 'arrow-block-up', name: 'Block ↑', svg: 'M14,38 L14,16 L6,16 L20,2 L34,16 L26,16 L26,38 Z' },
  { id: 'arrow-block-down', name: 'Block ↓', svg: 'M14,2 L14,24 L6,24 L20,38 L34,24 L26,24 L26,2 Z' },
  // Multi-directional
  { id: 'arrow-4way', name: '4-Way', svg: 'M20,2 L26,10 L22,10 L22,18 L30,18 L30,14 L38,20 L30,26 L30,22 L22,22 L22,30 L26,30 L20,38 L14,30 L18,30 L18,22 L10,22 L10,26 L2,20 L10,14 L10,18 L18,18 L18,10 L14,10 Z' },
  { id: 'arrow-horizontal', name: 'H-Arrow', svg: 'M2,20 L10,14 L10,18 L30,18 L30,14 L38,20 L30,26 L30,22 L10,22 L10,26 Z' },
  { id: 'arrow-vertical', name: 'V-Arrow', svg: 'M20,2 L26,10 L22,10 L22,30 L26,30 L20,38 L14,30 L18,30 L18,10 L14,10 Z' },
  // Bent/corner arrows
  { id: 'arrow-bent-right', name: 'Bent →', svg: 'M4,4 L4,20 L8,20 L8,8 L28,8 L28,4 L36,12 L28,20 L28,12 L4,12 Z' },
  { id: 'arrow-bent-left', name: 'Bent ←', svg: 'M36,4 L36,20 L32,20 L32,8 L12,8 L12,4 L4,12 L12,20 L12,12 L36,12 Z' },
  { id: 'arrow-bent-up', name: 'Bent ↑', svg: 'M36,36 L20,36 L20,32 L32,32 L32,12 L28,12 L36,4 L36,12 L36,4 L36,12 L28,12 L32,12 L32,36 Z M20,36 L20,12 L28,12 L20,4 L12,12 L20,12 Z' },
  { id: 'arrow-corner-up', name: 'Corner ↑', svg: 'M4,36 L4,32 L28,32 L28,12 L24,12 L32,4 L40,12 L36,12 L36,36 Z' },
  { id: 'arrow-corner-down', name: 'Corner ↓', svg: 'M4,4 L4,8 L28,8 L28,28 L24,28 L32,36 L40,28 L36,28 L36,4 Z' },
  // Curved arrows
  { id: 'arrow-uturn-right', name: 'U-Turn →', svg: 'M8,32 L8,16 Q8,8 16,8 L24,8 Q32,8 32,16 L32,22 L28,22 L32,30 L36,22 L32,22 L32,16 Q32,12 28,12 L12,12 Q12,12 12,16 L12,32 Z' },
  { id: 'arrow-uturn-left', name: 'U-Turn ←', svg: 'M32,32 L32,16 Q32,8 24,8 L16,8 Q8,8 8,16 L8,22 L12,22 L8,30 L4,22 L8,22 L8,16 Q8,12 12,12 L28,12 Q28,12 28,16 L28,32 Z' },
  { id: 'arrow-circular', name: 'Circular', svg: 'M20,4 L24,10 L22,10 A8,8 0 1 1 10,20 L16,20 A2,2 0 1 0 18,14 L18,10 L14,10 Z' },
  { id: 'arrow-refresh', name: 'Refresh', svg: 'M34,20 Q34,12 26,8 L26,4 L18,10 L26,16 L26,12 Q30,14 30,20 Q30,26 24,30 L24,34 Q34,30 34,20 Z M6,20 Q6,28 14,32 L14,36 L22,30 L14,24 L14,28 Q10,26 10,20 Q10,14 16,10 L16,6 Q6,10 6,20 Z' },
  // Chevrons
  { id: 'chevron-right', name: 'Chevron →', svg: 'M8,4 L28,20 L8,36 L14,20 Z' },
  { id: 'chevron-left', name: 'Chevron ←', svg: 'M32,4 L12,20 L32,36 L26,20 Z' },
  { id: 'chevron-double', name: 'Double >', svg: 'M4,4 L18,20 L4,36 L10,20 Z M18,4 L32,20 L18,36 L24,20 Z' },
  { id: 'chevron-triple', name: 'Triple >', svg: 'M2,6 L12,20 L2,34 L6,20 Z M12,6 L22,20 L12,34 L16,20 Z M22,6 L32,20 L22,34 L26,20 Z' },
  // Pentagon/tag arrows
  { id: 'arrow-pentagon', name: 'Pentagon', svg: 'M4,8 L30,8 L38,20 L30,32 L4,32 Z' },
  { id: 'arrow-tag', name: 'Tag', svg: 'M4,8 L30,8 L38,20 L30,32 L4,32 L10,20 Z' },
  { id: 'arrow-notched', name: 'Notched', svg: 'M4,4 L30,4 L38,20 L30,36 L4,36 L12,20 Z' },
  // Striped arrow
  { id: 'arrow-striped', name: 'Striped', svg: 'M4,16 L4,24 L10,24 L10,16 Z M14,16 L14,24 L20,24 L20,16 Z M24,16 L24,24 L28,24 L28,12 L36,20 L28,28 L28,16 Z' },
];

// Stars & Decorations - 30+ stars/flowers/weather icons
const STARS_DECORATIONS = [
  // Stars
  { id: 'star-4point', name: '4-Point', svg: 'M20,2 L24,16 L38,20 L24,24 L20,38 L16,24 L2,20 L16,16 Z' },
  { id: 'star-5point', name: '5-Point', svg: 'M20,2 L24,14 L38,14 L27,22 L31,36 L20,28 L9,36 L13,22 L2,14 L16,14 Z' },
  { id: 'star-6point', name: '6-Point', svg: 'M20,2 L24,14 L36,8 L28,18 L36,28 L24,24 L20,38 L16,24 L4,28 L12,18 L4,8 L16,14 Z' },
  { id: 'star-8point', name: '8-Point', svg: 'M20,2 L23,13 L32,6 L27,16 L38,20 L27,24 L32,34 L23,27 L20,38 L17,27 L8,34 L13,24 L2,20 L13,16 L8,6 L17,13 Z' },
  { id: 'star-12point', name: '12-Point', svg: 'M20,2 L22,11 L28,4 L26,13 L36,10 L30,17 L38,20 L30,23 L36,30 L26,27 L28,36 L22,29 L20,38 L18,29 L12,36 L14,27 L4,30 L10,23 L2,20 L10,17 L4,10 L14,13 L12,4 L18,11 Z' },
  { id: 'star-burst', name: 'Starburst', svg: 'M20,0 L23,14 L36,8 L26,18 L40,20 L26,22 L36,32 L23,26 L20,40 L17,26 L4,32 L14,22 L0,20 L14,18 L4,8 L17,14 Z' },
  { id: 'star-sparkle', name: 'Sparkle', svg: 'M20,4 L22,16 L34,14 L24,20 L34,26 L22,24 L20,36 L18,24 L6,26 L16,20 L6,14 L18,16 Z' },
  // Flowers
  { id: 'flower-4petal', name: '4-Petal', svg: 'M20,4 Q26,12 20,20 Q28,14 36,20 Q28,26 20,20 Q26,28 20,36 Q14,28 20,20 Q12,26 4,20 Q12,14 20,20 Q14,12 20,4 Z' },
  { id: 'flower-5petal', name: '5-Petal', svg: 'M20,4 Q24,12 20,20 Q30,12 34,18 Q26,22 20,20 Q28,28 24,34 Q18,26 20,20 Q10,28 6,22 Q14,18 20,20 Q8,14 10,6 Q18,14 20,20 Z' },
  { id: 'flower-6petal', name: '6-Petal', svg: 'M20,2 Q24,10 20,20 Q30,8 36,14 Q26,18 20,20 Q32,24 32,32 Q22,26 20,20 Q24,32 18,36 Q16,26 20,20 Q8,32 4,26 Q14,22 20,20 Q4,16 6,8 Q16,14 20,20 Z' },
  { id: 'flower-8petal', name: '8-Petal', svg: 'M20,2 Q22,12 20,20 Q28,8 34,10 Q24,16 20,20 Q34,16 36,22 Q24,22 20,20 Q32,28 28,34 Q22,24 20,20 Q24,34 18,36 Q18,24 20,20 Q10,32 6,28 Q16,22 20,20 Q4,24 4,16 Q16,18 20,20 Q6,10 12,6 Q18,16 20,20 Z' },
  { id: 'flower-tulip', name: 'Tulip', svg: 'M20,4 Q28,8 28,18 Q28,28 20,32 Q12,28 12,18 Q12,8 20,4 Z M18,32 L18,38 L22,38 L22,32' },
  // Hearts
  { id: 'heart-simple', name: 'Heart', svg: 'M20,36 L6,22 Q2,16 6,10 Q10,4 16,8 L20,14 L24,8 Q30,4 34,10 Q38,16 34,22 Z' },
  { id: 'heart-rounded', name: 'Heart 2', svg: 'M20,34 Q8,24 8,16 Q8,8 14,8 Q20,8 20,14 Q20,8 26,8 Q32,8 32,16 Q32,24 20,34 Z' },
  { id: 'heart-double', name: 'Double ♥', svg: 'M12,28 L4,18 Q2,14 4,10 Q6,6 10,8 L12,12 L14,8 Q18,6 20,10 Q22,14 20,18 Z M28,28 L20,18 Q18,14 20,10 Q22,6 26,8 L28,12 L30,8 Q34,6 36,10 Q38,14 36,18 Z' },
  // Weather & Nature
  { id: 'cloud', name: 'Cloud', svg: 'M32,28 L10,28 Q4,28 4,22 Q4,18 8,16 Q6,12 10,10 Q14,8 18,10 Q20,4 28,6 Q34,8 34,14 Q38,16 38,22 Q38,28 32,28 Z' },
  { id: 'sun', name: 'Sun', svg: 'M20,12 Q24,12 26,16 Q28,20 26,24 Q24,28 20,28 Q16,28 14,24 Q12,20 14,16 Q16,12 20,12 Z M20,4 L20,8 M20,32 L20,36 M4,20 L8,20 M32,20 L36,20 M8,8 L11,11 M29,29 L32,32 M32,8 L29,11 M11,29 L8,32' },
  { id: 'sun-rays', name: 'Sun Rays', svg: 'M20,10 A10,10 0 1 0 20,30 A10,10 0 1 0 20,10 M20,2 L20,6 M20,34 L20,38 M2,20 L6,20 M34,20 L38,20 M6,6 L10,10 M30,30 L34,34 M34,6 L30,10 M10,30 L6,34' },
  { id: 'moon-crescent', name: 'Moon', svg: 'M24,4 Q14,6 10,16 Q6,26 14,34 Q4,30 4,20 Q4,8 16,4 Q20,4 24,4 Z' },
  { id: 'lightning', name: 'Lightning', svg: 'M24,2 L14,18 L20,18 L12,38 L28,20 L22,20 Z' },
  { id: 'snowflake', name: 'Snowflake', svg: 'M20,2 L20,38 M4,11 L36,29 M36,11 L4,29 M20,8 L16,4 M20,8 L24,4 M20,32 L16,36 M20,32 L24,36 M10,14 L6,12 M10,14 L8,10 M30,14 L32,10 M30,14 L34,12 M10,26 L6,28 M10,26 L8,30 M30,26 L34,28 M30,26 L32,30' },
  { id: 'raindrop', name: 'Raindrop', svg: 'M20,4 Q8,20 8,28 Q8,36 20,36 Q32,36 32,28 Q32,20 20,4 Z' },
  // Misc Decorations
  { id: 'location-pin', name: 'Pin', svg: 'M20,2 Q8,2 8,14 Q8,26 20,38 Q32,26 32,14 Q32,2 20,2 Z M20,10 Q24,10 24,14 Q24,18 20,18 Q16,18 16,14 Q16,10 20,10 Z' },
  { id: 'smiley', name: 'Smiley', svg: 'M20,4 Q36,4 36,20 Q36,36 20,36 Q4,36 4,20 Q4,4 20,4 Z M12,16 Q14,14 16,16 Q14,18 12,16 Z M24,16 Q26,14 28,16 Q26,18 24,16 Z M12,26 Q16,30 20,30 Q24,30 28,26' },
  { id: 'cross-plus', name: 'Plus', svg: 'M16,4 L24,4 L24,16 L36,16 L36,24 L24,24 L24,36 L16,36 L16,24 L4,24 L4,16 L16,16 Z' },
  { id: 'cross-x', name: 'X Mark', svg: 'M8,4 L20,16 L32,4 L36,8 L24,20 L36,32 L32,36 L20,24 L8,36 L4,32 L16,20 L4,8 Z' },
  { id: 'checkmark', name: 'Check', svg: 'M4,20 L14,30 L36,8 L32,4 L14,22 L8,16 Z' },
  { id: 'clover', name: 'Clover', svg: 'M20,8 Q26,4 30,10 Q34,16 28,20 Q34,24 30,30 Q26,36 20,32 Q14,36 10,30 Q6,24 12,20 Q6,16 10,10 Q14,4 20,8 Z M18,32 L18,38 L22,38 L22,32' },
];

// Flowchart Symbols - 25+ standard diagram shapes
const FLOWCHART_SHAPES = [
  // Basic flow shapes
  { id: 'flow-process', name: 'Process', svg: 'M4,8 L36,8 L36,32 L4,32 Z' },
  { id: 'flow-decision', name: 'Decision', svg: 'M20,4 L38,20 L20,36 L2,20 Z' },
  { id: 'flow-terminal', name: 'Terminal', svg: 'M10,8 L30,8 Q38,8 38,20 Q38,32 30,32 L10,32 Q2,32 2,20 Q2,8 10,8 Z' },
  { id: 'flow-data', name: 'Data', svg: 'M8,8 L36,8 L32,32 L4,32 Z' },
  { id: 'flow-document', name: 'Document', svg: 'M4,6 L36,6 L36,30 Q28,26 20,30 Q12,34 4,30 Z' },
  { id: 'flow-multi-doc', name: 'Multi-Doc', svg: 'M8,2 L38,2 L38,26 Q32,22 26,26 Q20,30 14,26 Z M6,6 L6,30 Q12,26 18,30 Q24,34 30,30 L30,6 M4,10 L4,34 Q10,30 16,34' },
  // Database & Storage
  { id: 'flow-database', name: 'Database', svg: 'M4,10 Q4,4 20,4 Q36,4 36,10 L36,30 Q36,36 20,36 Q4,36 4,30 Z M4,10 Q4,16 20,16 Q36,16 36,10' },
  { id: 'flow-cylinder', name: 'Cylinder', svg: 'M4,8 Q4,2 20,2 Q36,2 36,8 L36,32 Q36,38 20,38 Q4,38 4,32 Z M4,8 Q4,14 20,14 Q36,14 36,8' },
  { id: 'flow-disk', name: 'Disk', svg: 'M20,4 Q36,4 36,10 L36,30 Q36,36 20,36 Q4,36 4,30 L4,10 Q4,4 20,4 Z M4,10 L36,10' },
  // Special process
  { id: 'flow-predefined', name: 'Predefined', svg: 'M4,8 L36,8 L36,32 L4,32 Z M8,8 L8,32 M32,8 L32,32' },
  { id: 'flow-manual', name: 'Manual', svg: 'M2,8 L38,8 L34,32 L6,32 Z' },
  { id: 'flow-preparation', name: 'Preparation', svg: 'M10,8 L30,8 L38,20 L30,32 L10,32 L2,20 Z' },
  { id: 'flow-internal', name: 'Internal', svg: 'M4,4 L36,4 L36,36 L4,36 Z M8,4 L8,36 M32,4 L32,36 M4,8 L36,8 M4,32 L36,32' },
  // Connectors
  { id: 'flow-connector', name: 'Connector', svg: 'M20,4 Q36,4 36,20 Q36,36 20,36 Q4,36 4,20 Q4,4 20,4 Z' },
  { id: 'flow-off-page', name: 'Off-Page', svg: 'M4,4 L36,4 L36,28 L20,36 L4,28 Z' },
  { id: 'flow-summing', name: 'Summing', svg: 'M20,4 Q36,4 36,20 Q36,36 20,36 Q4,36 4,20 Q4,4 20,4 Z M4,20 L36,20 M20,4 L20,36' },
  // Special shapes
  { id: 'flow-delay', name: 'Delay', svg: 'M4,8 L28,8 Q36,8 36,20 Q36,32 28,32 L4,32 Z' },
  { id: 'flow-display', name: 'Display', svg: 'M8,8 Q2,20 8,32 L28,32 Q36,32 36,20 Q36,8 28,8 Z' },
  { id: 'flow-merge', name: 'Merge', svg: 'M4,4 L36,4 L20,36 Z' },
  { id: 'flow-extract', name: 'Extract', svg: 'M20,4 L36,36 L4,36 Z' },
  { id: 'flow-sort', name: 'Sort', svg: 'M20,4 L36,20 L20,36 L4,20 Z M4,20 L36,20' },
  { id: 'flow-collate', name: 'Collate', svg: 'M4,4 L36,4 L4,36 L36,36 Z' },
  // Pie/Chart sections
  { id: 'pie-half', name: 'Half Pie', svg: 'M20,4 A16,16 0 0 1 20,36 Z' },
  { id: 'pie-quarter', name: 'Quarter', svg: 'M20,20 L20,4 A16,16 0 0 1 36,20 Z' },
  { id: 'pie-3quarter', name: '3/4 Pie', svg: 'M20,20 L20,4 A16,16 0 1 1 4,20 Z' },
];

// Atypical/Colorful Shapes - 25+ organic blobs with preset colors
const ATYPICAL_SHAPES = [
  // Organic blobs
  { id: 'blob-1', name: 'Blob 1', svg: 'M28,6 Q38,10 36,22 Q34,34 22,36 Q10,38 6,26 Q2,14 14,8 Q26,2 28,6 Z', color: '#60A5FA' },
  { id: 'blob-2', name: 'Blob 2', svg: 'M32,12 Q40,24 30,34 Q20,44 10,32 Q0,20 12,10 Q24,0 32,12 Z', color: '#A3E635' },
  { id: 'blob-3', name: 'Blob 3', svg: 'M26,4 Q40,8 38,24 Q36,40 20,38 Q4,36 2,20 Q0,4 16,2 Q26,0 26,4 Z', color: '#C084FC' },
  { id: 'blob-4', name: 'Blob 4', svg: 'M30,8 Q42,18 34,32 Q26,46 12,36 Q-2,26 8,12 Q18,-2 30,8 Z', color: '#FBBF24' },
  { id: 'blob-5', name: 'Blob 5', svg: 'M24,6 Q36,12 34,26 Q32,40 18,38 Q4,36 6,22 Q8,8 24,6 Z', color: '#94A3B8' },
  { id: 'blob-6', name: 'Blob 6', svg: 'M28,4 Q44,12 38,28 Q32,44 16,40 Q0,36 4,20 Q8,4 28,4 Z', color: '#F87171' },
  { id: 'blob-7', name: 'Blob 7', svg: 'M20,2 Q34,6 36,20 Q38,34 24,38 Q10,42 4,28 Q-2,14 12,6 Q20,-2 20,2 Z', color: '#38BDF8' },
  { id: 'blob-8', name: 'Blob 8', svg: 'M26,8 Q38,16 32,32 Q26,48 10,38 Q-6,28 6,14 Q18,0 26,8 Z', color: '#4ADE80' },
  // Abstract decorative shapes
  { id: 'abstract-flower', name: 'A-Flower', svg: 'M20,8 Q26,2 32,8 Q38,14 32,20 Q38,26 32,32 Q26,38 20,32 Q14,38 8,32 Q2,26 8,20 Q2,14 8,8 Q14,2 20,8 Z', color: '#EC4899' },
  { id: 'abstract-star', name: 'A-Star', svg: 'M20,4 L24,14 L34,14 L26,22 L30,34 L20,26 L10,34 L14,22 L6,14 L16,14 Z', color: '#F97316' },
  { id: 'abstract-clover', name: 'A-Clover', svg: 'M20,16 Q26,10 32,16 Q38,22 32,28 Q26,34 20,28 Q14,34 8,28 Q2,22 8,16 Q14,10 20,16 Z M20,28 L20,38', color: '#22C55E' },
  { id: 'abstract-plus', name: 'A-Plus', svg: 'M14,2 L26,2 Q28,2 28,4 L28,14 L38,14 Q40,14 40,16 L40,24 Q40,26 38,26 L28,26 L28,36 Q28,38 26,38 L14,38 Q12,38 12,36 L12,26 L2,26 Q0,26 0,24 L0,16 Q0,14 2,14 L12,14 L12,4 Q12,2 14,2 Z', color: '#FBBF24' },
  // Squiggles & Waves
  { id: 'squiggle-wave', name: 'Wave', svg: 'M2,20 Q8,10 14,20 Q20,30 26,20 Q32,10 38,20 L38,28 Q32,38 26,28 Q20,18 14,28 Q8,38 2,28 Z', color: '#8B5CF6' },
  { id: 'squiggle-s', name: 'S-Curve', svg: 'M8,4 Q26,4 26,16 Q26,28 8,28 Q26,28 26,36 L32,36 Q14,36 14,24 Q14,12 32,12 Q14,12 14,4 Z', color: '#14B8A6' },
  // Rounded organic forms
  { id: 'organic-oval', name: 'Organic O', svg: 'M20,4 Q36,6 38,20 Q40,34 22,38 Q6,40 2,24 Q-2,10 16,4 Q20,2 20,4 Z', color: '#60A5FA' },
  { id: 'organic-pill', name: 'Pill', svg: 'M12,8 L28,8 Q38,8 38,20 Q38,32 28,32 L12,32 Q2,32 2,20 Q2,8 12,8 Z', color: '#4ADE80' },
  { id: 'organic-pebble', name: 'Pebble', svg: 'M18,4 Q32,2 36,14 Q40,26 28,36 Q16,46 6,32 Q-4,18 10,8 Q18,0 18,4 Z', color: '#FB923C' },
  // Speech & dialog
  { id: 'speech-modern', name: 'Modern', svg: 'M6,6 Q6,2 20,2 Q34,2 34,6 L34,24 Q34,28 20,28 L14,28 L8,36 L10,28 Q6,28 6,24 Z', color: '#3B82F6' },
  // Banners & badges
  { id: 'badge-ribbon', name: 'Badge', svg: 'M8,4 L32,4 Q36,4 36,8 L36,28 L32,24 L28,28 L24,24 L20,28 L16,24 L12,28 L8,24 L4,28 L4,8 Q4,4 8,4 Z', color: '#EF4444' },
  { id: 'seal-star', name: 'Seal', svg: 'M20,2 L23,12 L34,10 L26,18 L36,26 L25,26 L22,38 L20,28 L18,38 L15,26 L4,26 L14,18 L6,10 L17,12 Z', color: '#F59E0B' },
  // Abstract patterns
  { id: 'zigzag-arrow', name: 'Zigzag', svg: 'M2,20 L10,10 L18,20 L26,10 L34,20 L30,20 L26,16 L18,26 L10,16 L6,20 Z', color: '#06B6D4' },
  { id: 'wave-double', name: 'Waves', svg: 'M2,14 Q8,8 14,14 Q20,20 26,14 Q32,8 38,14 L38,18 Q32,24 26,18 Q20,12 14,18 Q8,24 2,18 Z M2,24 Q8,18 14,24 Q20,30 26,24 Q32,18 38,24 L38,28 Q32,34 26,28 Q20,22 14,28 Q8,34 2,28 Z', color: '#8B5CF6' },
  // Geometric abstract
  { id: 'geo-hexagon', name: 'Geo Hex', svg: 'M20,2 L36,11 L36,29 L20,38 L4,29 L4,11 Z M20,10 L28,15 L28,25 L20,30 L12,25 L12,15 Z', color: '#10B981' },
  { id: 'geo-diamond', name: 'Geo Dia', svg: 'M20,2 L38,20 L20,38 L2,20 Z M20,10 L30,20 L20,30 L10,20 Z', color: '#6366F1' },
  // Arch shapes
  { id: 'arch-rounded', name: 'Arch', svg: 'M4,18 A16,16 0 0 1 36,18 L36,38 L4,38 Z', color: '#43A363' },
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
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <shape.icon className="w-7 h-7 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Basic Arrows */}
            <h4 className="font-medium text-foreground text-sm mb-3">Basic Arrows</h4>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {BASIC_ARROWS.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-muted-foreground fill-current">
                    <path d={shape.svg} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Stars & Decorations */}
            <h4 className="font-medium text-foreground text-sm mb-3">Stars & Decorations</h4>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {STARS_DECORATIONS.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-muted-foreground fill-current">
                    <path d={shape.svg} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Flowchart Symbols */}
            <h4 className="font-medium text-foreground text-sm mb-3">Flowchart Symbols</h4>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {FLOWCHART_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-muted-foreground fill-current">
                    <path d={shape.svg} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Atypical Colorful Shapes */}
            <h4 className="font-medium text-foreground text-sm mb-3">Colorful Shapes</h4>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {ATYPICAL_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id, shape.color, shape.svg)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8" style={{ fill: shape.color }}>
                    <path d={shape.svg} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Speech Bubbles & Callouts */}
            <h4 className="font-medium text-foreground text-sm mb-3">Speech Bubbles & Callouts</h4>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {SPEECH_BUBBLES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onAddShape(shape.id)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={shape.name}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-muted-foreground fill-current">
                    <path d={shape.svg} />
                  </svg>
                </button>
              ))}
            </div>

            {/* Lines & Arrows */}
            <h4 className="font-medium text-foreground text-sm mb-3">Lines & Arrows</h4>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {LINES_ARROWS.map((line) => (
                <button
                  key={line.id}
                  onClick={() => onAddShape(line.id)}
                  className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  title={line.name}
                >
                  <line.icon 
                    className="w-7 h-7 text-muted-foreground" 
                    style={{ transform: line.rotate ? `rotate(${line.rotate}deg)` : undefined }}
                  />
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