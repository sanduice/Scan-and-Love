import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, ChevronRight, Type, Upload, Image, Loader2,
  Square, Circle, Maximize2, Grid3X3, Trash2, MoveUp, MoveDown,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlertTriangle,
  Palette, Frame, Magnet, Sparkles, X, Save, LogIn
} from 'lucide-react';
import { calculateNameBadgePrice, QUANTITY_TIERS } from '@/components/namebadge/utils';
import { toast } from 'sonner';
import { getSessionId, getUserOrSession } from '@/components/SessionManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import BadgeCanvas from '@/components/namebadge/BadgeCanvas.jsx';
import SizeShapePanel from '@/components/namebadge/SizeShapePanel.jsx';
import BackgroundPanel from '@/components/namebadge/BackgroundPanel.jsx';
import BorderPanel from '@/components/namebadge/BorderPanel.jsx';
import FastenerPanel from '@/components/namebadge/FastenerPanel.jsx';
import DomePanel from '@/components/namebadge/DomePanel.jsx';
import TextOptionsPanel from '@/components/namebadge/TextOptionsPanel.jsx';

const SIZE_DIMENSIONS = {
  '1x3-rectangle': { width: 3, height: 1 },
  '1.5x3-rectangle': { width: 3, height: 1.5 },
  '1.5x3-oval': { width: 3, height: 1.5, isOval: true },
  '2x3-rectangle': { width: 3, height: 2 },
};

const OPTION_TABS = [
  { id: 'size', label: 'Size & Shape', icon: Maximize2 },
  { id: 'background', label: 'Background', icon: Palette },
  { id: 'border', label: 'Border', icon: Frame },
  { id: 'fastener', label: 'Fastener', icon: Magnet },
  { id: 'dome', label: 'Dome', icon: Sparkles },
];

export default function NameBadgeDesigner() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Badge configuration
  const [sizeShape, setSizeShape] = useState('1x3-rectangle');
  const [background, setBackground] = useState('white-plastic');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [border, setBorder] = useState('none');
  const [fastener, setFastener] = useState('magnetic');
  const [dome, setDome] = useState(false);
  const [badgeType, setBadgeType] = useState('standard');

  // Design elements
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [textCount, setTextCount] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [elementToDelete, setElementToDelete] = useState(null);
  const activePlaceholderRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load existing design if editing
  const urlParams = new URLSearchParams(window.location.search);
  const editDesignId = urlParams.get('designId');

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {}
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  React.useEffect(() => {
    if (editDesignId) {
      loadDesign(editDesignId);
    }
  }, [editDesignId]);

  const loadDesign = async (id) => {
    const designs = await base44.entities.NameBadgeDesign.filter({ id });
    if (designs.length > 0) {
      const design = designs[0];
      setSizeShape(design.size_shape || '1x3-rectangle');
      setBackground(design.background || 'white-plastic');
      setBackgroundImage(design.background_image || null);
      setBorder(design.border || 'none');
      setFastener(design.fastener || 'magnetic');
      setDome(design.dome || false);
      setBadgeType(design.badge_type || 'standard');
      const loadedElements = design.elements_json ? JSON.parse(design.elements_json) : [];
      setElements(loadedElements);
      setTextCount(design.text_fields_count || 0);
    }
  };

  // Initialize from URL params if not editing an existing design
  React.useEffect(() => {
    if (!editDesignId) {
      const style = urlParams.get('style');
      const size = urlParams.get('size');
      const borderParam = urlParams.get('border');
      const fastenerParam = urlParams.get('fastener');
      const domeParam = urlParams.get('dome');
      const typeParam = urlParams.get('type');

      if (typeParam) setBadgeType(typeParam);

      // 1. Set Background
      if (style === 'white') setBackground('white-plastic');
      else if (style === 'silver-metallic') setBackground('silver-metallic');
      else if (style === 'gold-metallic') setBackground('gold-metallic');
      else if (style === 'silver') setBackground('silver-plastic');
      else if (style === 'gold') setBackground('gold-plastic');
      else if (style === 'wood') setBackground('wood-grain');
      else if (style === 'bling') setBackground('bling-silver');
      else if (style === 'chalkboard') setBackground('chalkboard');
      else if (style === 'glossy') setBackground('glossy-white');
      else if (style === 'color') setBackground('blue-plastic');

      // 2. Set Size
      if (size === '1x3') setSizeShape('1x3-rectangle');
      else if (size === '1.5x3') setSizeShape('1.5x3-rectangle');
      else if (size === 'oval') setSizeShape('1.5x3-oval');
      else if (size === '2x3') setSizeShape('2x3-rectangle');

      // 3. Set Options
      if (borderParam) setBorder(borderParam);
      if (fastenerParam) setFastener(fastenerParam);
      if (domeParam === 'true') setDome(true);

      // Executive defaults
      if (typeParam === 'executive') {
        if (!borderParam || borderParam === 'none') setBorder('silver'); // Default border for executive
        if (style === 'white') setBackground('silver-metallic'); // Default background if not specified
        setDome(false); // No dome allowed
      }

      // 4. Add Default Elements (Logo Placeholder + Text)
      // Wait for sizeShape state to settle or calculate dimensions immediately for initial placement
      const initialDimensions = size === '1.5x3' || size === 'oval' 
        ? { width: 3, height: 1.5 } 
        : size === '2x3' 
          ? { width: 3, height: 2 }
          : { width: 3, height: 1 }; // Default 1x3

      const initialElements = [
        // Logo Placeholder
        {
          id: Date.now(),
          type: 'logo-placeholder', // Special type for behavior
          text: 'Your Logo Here',
          x: 0.5, // Left side
          y: initialDimensions.height / 2,
          width: 0.75,
          height: 0.75,
          isPlaceholder: true
        },
        // Default Text
        {
          id: Date.now() + 1,
          type: 'text',
          text: 'Employee Name',
          isVariable: true,
          fieldIndex: 0,
          x: 1.8, // Right side/Center
          y: initialDimensions.height / 2,
          fontSize: 20 / 72,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          color: '#000000',
        }
      ];
      
      setElements(initialElements);
      setTextCount(1);
    }
  }, [editDesignId]);

  const dimensions = SIZE_DIMENSIONS[sizeShape];

  const getPrice = (qty = 1) => {
    const { unitPrice } = calculateNameBadgePrice({
      sizeShape,
      background,
      border,
      fastener,
      dome,
      quantity: qty
    });
    return unitPrice;
  };

  const addTextElement = () => {
    if (textCount >= 4) {
      toast.error('Maximum 4 text lines allowed');
      return;
    }
    const newElement = {
      id: Date.now(),
      type: 'text',
      text: 'Your Text',
      isVariable: true,
      fieldIndex: textCount,
      x: dimensions.width / 2,
      y: 0.3 + (textCount * 0.25),
      fontSize: 18 / 72, // 18pt default
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      color: '#000000',
    };
    setElements([...elements, newElement]);
    setTextCount(textCount + 1);
    setSelectedElement(newElement.id);
  };

  const addLogoElement = async (file, replaceId = null) => {
    try {
      const toastId = toast.loading('Uploading logo...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      toast.dismiss(toastId);

      setElements(prevElements => {
          // If replacing a placeholder, try to maintain its position (or center it there)
          let positionProps = {
              x: dimensions.width / 2,
              y: dimensions.height / 2,
              width: 0.75,
              height: 0.75
          };

          if (replaceId) {
              const placeholder = prevElements.find(e => e.id === replaceId);
              if (placeholder) {
                  positionProps = {
                      x: placeholder.x,
                      y: placeholder.y,
                      width: placeholder.width,
                      height: placeholder.height
                  };
              }
          }

          const newElement = {
            id: Date.now(),
            type: 'image',
            src: file_url,
            ...positionProps
          };

          setSelectedElement(newElement.id);

          if (replaceId) {
              return prevElements.map(el => el.id === replaceId ? newElement : el);
          } else {
              return [...prevElements, newElement];
          }
      });

      toast.success('Logo uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload logo');
    }
  };

  const addClipart = (url) => {
    const newElement = {
      id: Date.now(),
      type: 'clipart',
      src: url,
      x: 0.2,
      y: dimensions.height / 2,
      width: 0.3,
      height: 0.3,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const confirmDeleteElement = (id) => {
    setElementToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const deleteElement = () => {
    if (!elementToDelete) return;
    const el = elements.find(e => e.id === elementToDelete);
    if (el?.type === 'text' && el.isVariable) {
      setTextCount(Math.max(0, textCount - 1));
    }
    setElements(elements.filter(e => e.id !== elementToDelete));
    setSelectedElement(null);
    setDeleteConfirmOpen(false);
    setElementToDelete(null);
    toast.success('Element deleted');
  };

  const moveElement = (id, direction) => {
    const index = elements.findIndex(el => el.id === id);
    if (direction === 'up' && index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      setElements(newElements);
    } else if (direction === 'down' && index > 0) {
      const newElements = [...elements];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      setElements(newElements);
    }
  };

  const generateThumbnail = () => {
    // Generate a simple SVG thumbnail for the badge design
    const dim = SIZE_DIMENSIONS[sizeShape];
    const scale = 100;
    const width = dim.width * scale;
    const height = dim.height * scale;
    const isOval = dim.isOval;
    
    const bgColors = {
      'white-plastic': '#FFFFFF',
      'black-plastic': '#1a1a1a',
      'gold-plastic': '#D4AF37',
      'silver-plastic': '#C0C0C0',
      'gold-metallic': '#FFD700',
      'silver-metallic': '#E8E8E8',
      'rose-gold': '#B76E79',
    };
    
    const borderColors = {
      'none': null,
      'gold': '#D4AF37',
      'silver': '#C0C0C0',
      'black': '#000000',
      'rose-gold': '#B76E79',
    };
    
    const bgColor = bgColors[background] || '#FFFFFF';
    const borderColor = borderColors[border];
    
    let elementsContent = elements.map(el => {
      if (el.type === 'text') {
        const x = el.x * scale;
        const y = el.y * scale;
        const fontSize = el.fontSize * scale;
        return `<text x="${x}" y="${y}" fill="${el.color || '#000'}" font-size="${fontSize}" font-family="${el.fontFamily || 'Arial'}" font-weight="${el.fontWeight || 'normal'}" text-anchor="middle" dominant-baseline="middle">${el.text}</text>`;
      } else if (el.type === 'image' || el.type === 'clipart') {
        const x = (el.x - el.width / 2) * scale;
        const y = (el.y - el.height / 2) * scale;
        const w = el.width * scale;
        const h = el.height * scale;
        return `<image href="${el.src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" />`;
      }
      return '';
    }).join('');
    
    const shape = isOval 
      ? `<ellipse cx="${width/2}" cy="${height/2}" rx="${width/2 - 2}" ry="${height/2 - 2}" fill="${bgColor}" ${borderColor ? `stroke="${borderColor}" stroke-width="3"` : ''} />`
      : `<rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="6" fill="${bgColor}" ${borderColor ? `stroke="${borderColor}" stroke-width="3"` : ''} />`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${backgroundImage ? `<image href="${backgroundImage}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#badgeClip)" />` : ''}
      <defs><clipPath id="badgeClip">${shape}</clipPath></defs>
      ${shape}
      ${elementsContent}
    </svg>`;
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const handleFinishDesigning = async () => {
    if (textCount === 0) {
      toast.error('Please add at least one text field for names');
      return;
    }

    // Require login to proceed to checkout
    if (!user) {
      toast.info('Please sign in to continue with your order');
      // Store design data temporarily in sessionStorage
      sessionStorage.setItem('pendingBadgeDesign', JSON.stringify({
        sizeShape, background, backgroundImage, border, fastener, dome,
        elements, textCount
      }));
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsSaving(true);
    try {
      const thumbnail = generateThumbnail();
      let designId;
      const designData = {
        name: 'Custom Badge',
        size_shape: sizeShape,
        background,
        background_image: backgroundImage,
        border,
        fastener,
        dome,
        badge_type: badgeType,
        elements_json: JSON.stringify(elements),
        text_fields_count: textCount,
        thumbnail_url: thumbnail,
        is_draft: false,
      };

      if (editDesignId) {
        await base44.entities.NameBadgeDesign.update(editDesignId, designData);
        designId = editDesignId;
      } else {
        const design = await base44.entities.NameBadgeDesign.create(designData);
        designId = design.id;
      }

      navigate(createPageUrl('NameBadgeNames') + `?designId=${designId}`);
    } catch (err) {
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    // Require login to save drafts
    if (!user) {
      toast.info('Please sign in to save your design');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsSavingDraft(true);
    try {
      const thumbnail = generateThumbnail();
      const designData = {
        name: 'Draft Badge Design',
        size_shape: sizeShape,
        background,
        background_image: backgroundImage,
        border,
        fastener,
        dome,
        elements_json: JSON.stringify(elements),
        text_fields_count: textCount,
        thumbnail_url: thumbnail,
        is_draft: true,
      };

      if (editDesignId) {
        await base44.entities.NameBadgeDesign.update(editDesignId, designData);
        toast.success('Draft saved!');
      } else {
        const design = await base44.entities.NameBadgeDesign.create(designData);
        window.history.replaceState({}, '', `${window.location.pathname}?designId=${design.id}`);
        toast.success('Draft saved!');
      }
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSignIn = () => {
    // Save current design first, then redirect to login
    handleSaveDraft().then(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  const getOptionSummary = (tabId) => {
    switch (tabId) {
      case 'size':
        return sizeShape.replace(/-/g, ' ').replace('rectangle', 'Rect').replace('oval', 'Oval');
      case 'background':
        return background.replace(/-/g, ' ').split(' ')[0];
      case 'border':
        return border === 'none' ? 'None' : border.charAt(0).toUpperCase() + border.slice(1);
      case 'fastener':
        return fastener.charAt(0).toUpperCase() + fastener.slice(1).replace('-', ' ');
      case 'dome':
        return dome ? 'Yes' : 'No';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Name Badge Designer</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Draft
              </Button>
              {!user && !isCheckingAuth && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignIn}
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
              )}
              {user && (
                <span className="text-sm text-gray-500">
                  Signed in as {user.full_name || user.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white">
              <span className="font-medium">1. Design Your Badge</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-600">
              <span className="font-medium">2. Add Names</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-600">
              <span className="font-medium">3. Complete Order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Options Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-3">
            {OPTION_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                  activePanel === tab.id 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-500">{getOptionSummary(tab.id)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {/* Add buttons */}
              <div className="flex justify-center gap-3 mb-6">
                <Button onClick={addTextElement} className="bg-orange-500 hover:bg-orange-600">
                  <Type className="w-4 h-4 mr-2" />
                  Add Text Line
                </Button>
                <label>
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && addLogoElement(e.target.files[0])}
                  />
                </label>
              </div>

              {/* Hidden file input for placeholder click */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Capture ID before clearing
                    const targetId = activePlaceholderRef.current;
                    addLogoElement(file, targetId);
                  }
                  // Always reset
                  activePlaceholderRef.current = null;
                  e.target.value = '';
                }}
              />

              {/* Badge Canvas */}
              <BadgeCanvas
                sizeShape={sizeShape}
                background={background}
                backgroundImage={backgroundImage}
                border={border}
                elements={elements}
                selectedElement={selectedElement}
                onSelectElement={(id) => {
                  const el = elements.find(e => e.id === id);
                  if (el && el.isPlaceholder) {
                    setSelectedElement(id);
                    activePlaceholderRef.current = id;
                    // Small timeout to ensure stable state and event loop
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 50);
                  } else {
                    setSelectedElement(id);
                  }
                }}
                onUpdateElement={updateElement}
                badgeType={badgeType}
              />

              <p className="text-center text-sm text-gray-500 mt-4">
                Click on text to select and edit. Drag elements to reposition.
              </p>
            </div>

            {/* Pricing Calculator */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Volume Pricing Calculator</h3>
              
              {/* Pricing Table */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {QUANTITY_TIERS.map((tier) => {
                   const label = tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`;
                   const save = tier.discount > 0 ? `${Math.round(tier.discount * 100)}%` : '';
                   const price = getPrice(tier.min);

                   return (
                      <div 
                        key={label}
                        className="text-center p-2 rounded-lg border bg-gray-50"
                      >
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className="font-bold text-green-600">${price.toFixed(2)}</div>
                        {save && (
                          <div className="text-xs text-orange-600 font-medium">Save {save}</div>
                        )}
                      </div>
                   );
                })}
              </div>

              {/* Option Add-ons */}
              <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Selected Options:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>• {fastener.replace('-', ' ')} {fastener === 'magnetic' ? '(+$1.00)' : fastener === 'pocket-clip' ? '(+$0.75)' : fastener === 'military-clutch' || fastener === 'swivel-clip' ? '(+$0.50)' : '(included)'}</span>
                  <span>• {border !== 'none' ? `${border} border (+$${border === 'rose-gold' ? '0.75' : border === 'black' ? '0.25' : '0.50'})` : 'No border'}</span>
                  {dome && <span>• Dome coating (+$1.50)</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    From ${getPrice().toFixed(2)} each
                  </p>
                  <p className="text-sm text-gray-500">Final price calculated when you add names</p>
                </div>
                <Button 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-lg px-8"
                  onClick={handleFinishDesigning}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Continue to Add Names
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Element Options */}
          <div className="lg:col-span-1">
            {selectedEl ? (
              <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    {selectedEl.type === 'text' ? 'Edit Text' : 'Edit Element'}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => confirmDeleteElement(selectedEl.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>

                {selectedEl.type === 'text' && (
                  <TextOptionsPanel
                    element={selectedEl}
                    onUpdate={(updates) => updateElement(selectedEl.id, updates)}
                  />
                )}

                {(selectedEl.type === 'image' || selectedEl.type === 'clipart') && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Size</Label>
                      <Input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={selectedEl.width}
                        onChange={(e) => updateElement(selectedEl.id, { 
                          width: parseFloat(e.target.value),
                          height: parseFloat(e.target.value)
                        })}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => moveElement(selectedEl.id, 'down')}>
                        <MoveDown className="w-4 h-4 mr-1" /> Send Back
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => moveElement(selectedEl.id, 'up')}>
                        <MoveUp className="w-4 h-4 mr-1" /> Bring Front
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
                <div className="text-center text-gray-500">
                  <Type className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No element selected</p>
                  <p className="text-sm mt-1">Click on an element to edit it, or add a new text line above.</p>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Current Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size</span>
                      <span className="font-medium">{sizeShape.replace(/-/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Background</span>
                      <span className="font-medium capitalize">{background.replace(/-/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Border</span>
                      <span className="font-medium capitalize">{border}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fastener</span>
                      <span className="font-medium capitalize">{fastener.replace(/-/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dome Coating</span>
                      <span className="font-medium">{dome ? 'Yes (+$1.50)' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Text Fields</span>
                      <span className="font-medium">{textCount} of 4</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option Panels - Side Sheet */}
      <Sheet open={activePanel !== null} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="left" className="w-[400px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {activePanel && OPTION_TABS.find(t => t.id === activePanel)?.icon && 
                React.createElement(OPTION_TABS.find(t => t.id === activePanel).icon, { className: "w-5 h-5" })}
              {activePanel && OPTION_TABS.find(t => t.id === activePanel)?.label}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            {activePanel === 'size' && (
              <SizeShapePanel value={sizeShape} onChange={setSizeShape} />
            )}
            {activePanel === 'background' && (
              <BackgroundPanel 
                value={background} 
                onChange={setBackground}
                backgroundImage={backgroundImage}
                onBackgroundImageChange={setBackgroundImage}
                badgeType={badgeType}
              />
            )}
            {activePanel === 'border' && (
              <BorderPanel value={border} onChange={setBorder} badgeType={badgeType} />
            )}
            {activePanel === 'fastener' && (
              <FastenerPanel value={fastener} onChange={setFastener} />
            )}
            {activePanel === 'dome' && (
              <DomePanel value={dome} onChange={setDome} badgeType={badgeType} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Delete Element?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this element? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteElement} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}