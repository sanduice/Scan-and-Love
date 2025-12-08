import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, Save, ShoppingCart, Undo, Redo, ZoomIn, ZoomOut,
  Loader2, Download, FileDown, Grid3X3, Eye, Settings,
  Minus, Plus, Share2
} from 'lucide-react';
import SocialShare from '@/components/SocialShare';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import CanvasWorkspace from '@/components/designer/CanvasWorkspace';
import ElementsPanel from '@/components/designer/ElementsPanel';
import DesignToolbar from '@/components/designer/DesignToolbar';
import { generateThumbnail, generateThumbnailWithImages, generateSVG, downloadSVG, downloadPNG, generateArtworkDataURL } from '@/components/designer/CanvasExporter';
import { AlertTriangle } from 'lucide-react';

import { usePricing } from '@/components/pricing/PricingCalculator';

const PRODUCT_DEFAULTS = {
  'vinyl-banner': { material: '13 oz Vinyl', minWidth: 12, maxWidth: 192, minHeight: 12, maxHeight: 120 },
  'yard-sign': { material: 'Coroplast 4mm', minWidth: 6, maxWidth: 48, minHeight: 6, maxHeight: 36 },
  'foam-board': { material: '3/16 Foam Board', minWidth: 8, maxWidth: 48, minHeight: 8, maxHeight: 96 },
  'pull-up-banner': { material: 'Premium Vinyl', minWidth: 24, maxWidth: 48, minHeight: 60, maxHeight: 96 },
  'retractable-banner': { material: 'Premium Vinyl', minWidth: 24, maxWidth: 60, minHeight: 78, maxHeight: 92 },
  'plastic-sign': { material: '3mm PVC (Sintra)', minWidth: 4, maxWidth: 96, minHeight: 4, maxHeight: 96 },
  'pvc-sign': { material: '3mm PVC (Sintra)', minWidth: 4, maxWidth: 96, minHeight: 4, maxHeight: 96 },
  'a-frame-sign': { material: 'Coroplast', minWidth: 18, maxWidth: 36, minHeight: 24, maxHeight: 48 },
  'aluminum-sign': { material: 'Aluminum .040', minWidth: 6, maxWidth: 96, minHeight: 6, maxHeight: 48 },
  'feather-flag': { material: 'Polyester Flag', minWidth: 20, maxWidth: 40, minHeight: 80, maxHeight: 200 },
  'table-throw': { material: 'Polyester Fabric', minWidth: 60, maxWidth: 160, minHeight: 60, maxHeight: 100 },
  'floor-decal': { material: 'Anti-Slip Vinyl', minWidth: 6, maxWidth: 600, minHeight: 6, maxHeight: 52 },
  'vinyl-lettering': { material: 'Standard Vinyl', minWidth: 2, maxWidth: 1200, minHeight: 2, maxHeight: 48 },
  'static-cling': { material: 'White Static Cling', minWidth: 4, maxWidth: 1200, minHeight: 4, maxHeight: 52 },
  'transfer-sticker': { material: 'Standard Vinyl', minWidth: 1, maxWidth: 12, minHeight: 1, maxHeight: 12 },
  'pop-up-display': { material: 'Tension Fabric', minWidth: 80, maxWidth: 240, minHeight: 80, maxHeight: 100 },
  'step-and-repeat': { material: '13oz Matte Vinyl', minWidth: 48, maxWidth: 120, minHeight: 48, maxHeight: 120 },
  'die-cut-sticker': { material: 'White Vinyl', minWidth: 1, maxWidth: 12, minHeight: 1, maxHeight: 12 },
  'mesh-banner': { material: '8oz Mesh Vinyl', minWidth: 12, maxWidth: 1200, minHeight: 12, maxHeight: 120 },
  'fabric-banner': { material: 'Polyester Fabric', minWidth: 12, maxWidth: 1200, minHeight: 12, maxHeight: 96 },
  'a-frame-sign': { material: 'Standard A-Frame', minWidth: 24, maxWidth: 24, minHeight: 36, maxHeight: 36 },
  'x-banner': { material: '13oz Vinyl', minWidth: 24, maxWidth: 32, minHeight: 63, maxHeight: 70 },
  'car-magnet': { material: '30mil Magnet', minWidth: 9, maxWidth: 72, minHeight: 9, maxHeight: 24 },
  'acrylic-sign': { material: 'Clear Acrylic', minWidth: 6, maxWidth: 96, minHeight: 6, maxHeight: 48 },
  'canvas-print': { material: 'Standard Canvas', minWidth: 8, maxWidth: 60, minHeight: 8, maxHeight: 60 },
  'window-perf': { material: 'Perforated Vinyl', minWidth: 12, maxWidth: 1200, minHeight: 12, maxHeight: 58 },
};

export default function DesignTool() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const productType = urlParams.get('product') || 'vinyl-banner';
  const initialWidth = Number(urlParams.get('width')) || 72;
  const initialHeight = Number(urlParams.get('height')) || 36;
  const initialSizeKey = urlParams.get('sizeKey') || null;
  const initialMaterial = urlParams.get('material') ? decodeURIComponent(urlParams.get('material')) : null;
  const designId = urlParams.get('designId');

  // Fetch product configuration dynamically
  const { data: productData = [] } = useQuery({
    queryKey: ['product-config', productType],
    queryFn: () => base44.entities.Product.filter({ slug: productType }),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const product = productData[0];
  
  const productConfig = useMemo(() => {
    const defaults = PRODUCT_DEFAULTS[productType] || PRODUCT_DEFAULTS['vinyl-banner'];
    if (product) {
      return {
        ...defaults,
        minWidth: product.min_width || defaults.minWidth,
        maxWidth: product.max_width || defaults.maxWidth,
        minHeight: product.min_height || defaults.minHeight,
        maxHeight: product.max_height || defaults.maxHeight,
        material: product.material_options?.[0]?.name || defaults.material,
        materials: product.material_options || [],
      };
    }
    return defaults;
  }, [product, productType]);

  const [canvasWidth, setCanvasWidth] = useState(initialWidth);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [sizeKey, setSizeKey] = useState(initialSizeKey);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showBleed, setShowBleed] = useState(true);

  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSizeDialog, setShowSizeDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [designName, setDesignName] = useState('My Design');
  const [savedDesignId, setSavedDesignId] = useState(designId || null);

  const [options, setOptions] = useState({
    material: initialMaterial || productConfig.material,
    printSides: 'Single Sided',
    finish: 'Welded Hem',
    grommets: 'Every 2-3 ft',
  });

  // Update options if productConfig loads later and we didn't have an initial material
  useEffect(() => {
    if (!initialMaterial && productConfig.material && options.material !== productConfig.material) {
      setOptions(prev => ({ ...prev, material: productConfig.material }));
    }
  }, [productConfig.material, initialMaterial]);

  const [showTemplateWarning, setShowTemplateWarning] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Use dynamic pricing hook
  const pricingData = usePricing(productType, options.material, { 
    width: canvasWidth, 
    height: canvasHeight, 
    quantity,
    sizeKey
  });

  // Load existing design
  useEffect(() => {
    if (designId) {
      loadDesign(designId);
    }
  }, [designId]);

  const loadDesign = async (id) => {
    const designs = await base44.entities.SavedDesign.filter({ id });
    if (designs.length > 0) {
      const design = designs[0];
      setCanvasWidth(design.width);
      setCanvasHeight(design.height);
      try {
        const loadedElements = design.elements_json ? JSON.parse(design.elements_json) : [];
        setElements(loadedElements);
        setHistory([loadedElements]);
      } catch (e) {
        setElements([]);
      }
      setDesignName(design.name || 'My Design');
      if (design.quantity) setQuantity(design.quantity);
    }
  };

  const saveToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
      setSelectedElement(null);
      setEditingTextId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
      setSelectedElement(null);
      setEditingTextId(null);
    }
  };

  const addElement = (element) => {
    const newElement = {
      id: Date.now(),
      ...element,
      x: element.x ?? canvasWidth * 0.2,
      y: element.y ?? canvasHeight * 0.3,
      rotation: element.rotation ?? 0,
      locked: false,
      visible: true,
      opacity: 1,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id, updates) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
  };

  const updateElementWithHistory = (id, updates) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  const deleteElement = (id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    if (selectedElement === id) setSelectedElement(null);
  };

  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      addElement({
        ...element,
        id: undefined,
        x: element.x + 2,
        y: element.y + 2,
      });
    }
  };

  const moveLayerUp = (id) => {
    const index = elements.findIndex(el => el.id === id);
    if (index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      setElements(newElements);
      saveToHistory(newElements);
    }
  };

  const moveLayerDown = (id) => {
    const index = elements.findIndex(el => el.id === id);
    if (index > 0) {
      const newElements = [...elements];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      setElements(newElements);
      saveToHistory(newElements);
    }
  };

  // Add handlers
  const handleAddText = (preset) => {
    addElement({
      type: 'text',
      text: preset.label || 'Your Text',
      fontSize: preset.fontSize || 4,
      fontFamily: preset.fontFamily || 'Arial',
      fontWeight: preset.fontWeight || 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      color: '#000000',
      width: canvasWidth * 0.6,
      height: preset.fontSize * 2 || 8,
    });
  };

  const handleAddShape = (shape, color) => {
    addElement({
      type: 'shape',
      shape,
      fill: color || '#3B82F6',
      stroke: 'none',
      strokeWidth: 0,
      width: canvasWidth * 0.25,
      height: shape === 'circle' ? canvasWidth * 0.25 : canvasHeight * 0.25,
    });
  };

  const handleAddImage = (url) => {
    addElement({
      type: 'image',
      src: url,
      width: Math.min(20, canvasWidth * 0.4),
      height: Math.min(15, canvasHeight * 0.4),
    });
  };

  const handleAddClipart = (url) => {
    addElement({
      type: 'clipart',
      src: url,
      width: Math.min(10, canvasWidth * 0.15),
      height: Math.min(10, canvasHeight * 0.25),
    });
  };

  const handleApplyTemplate = (template) => {
    // If there are existing elements, show warning first
    if (elements.length > 0) {
      setPendingTemplate(template);
      setShowTemplateWarning(true);
      return;
    }
    applyTemplateConfirmed(template);
  };

  const handleBackClick = () => {
    if (elements.length > 0) {
      setShowExitWarning(true);
    } else {
      navigateBack();
    }
  };

  const navigateBack = () => {
    if (productType) {
      navigate(`${createPageUrl('ProductDetail')}?slug=${productType}`);
    } else {
      navigate(createPageUrl('Home'));
    }
  };

  const applyTemplateConfirmed = (template) => {
    const newElements = template.elements.map((el, i) => ({
      ...el,
      id: Date.now() + i,
      locked: false,
      visible: true,
      opacity: 1,
    }));
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(null);
    setShowTemplateWarning(false);
    setPendingTemplate(null);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleStartTextEdit = (id) => setEditingTextId(id);
  const handleTextEditChange = (id, newText) => updateElement(id, { text: newText });
  const handleEndTextEdit = () => {
    if (editingTextId) saveToHistory(elements);
    setEditingTextId(null);
  };

  // Price calculation wrapper using hook
  const pricing = useMemo(() => {
    let total = parseFloat(pricingData.total) || 0;
    
    // Apply modifiers locally since hook handles base price
    if (options.printSides === 'Double Sided') total *= 1.5;
    
    // Fallback min price if DB returns 0 (safety net)
    if (total === 0) {
       const sqft = (canvasWidth * canvasHeight) / 144;
       total = Math.max(25, sqft * 3 * quantity);
    }

    return {
      total: total.toFixed(2),
      unitPrice: (total / quantity).toFixed(2),
      sqft: pricingData.sqft?.toFixed(2) || ((canvasWidth * canvasHeight) / 144).toFixed(2),
    };
  }, [pricingData, options.printSides, quantity, canvasWidth, canvasHeight]);

  const createThumbnail = () => generateThumbnailWithImages(elements, canvasWidth, canvasHeight);

  const handleSave = async () => {
    // Check if user is logged in
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      toast.info('Please sign in to save your design');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsSaving(true);
    try {
      // Use async versions that embed images as base64
      const thumbnail = await createThumbnail();
      const artworkDataUrl = await generateArtworkDataURL(elements, canvasWidth, canvasHeight, 150);

      const designData = {
        name: designName,
        product_type: productType,
        width: canvasWidth,
        height: canvasHeight,
        elements_json: JSON.stringify(elements),
        options_json: JSON.stringify(options),
        quantity,
        unit_price: parseFloat(pricing.unitPrice),
        thumbnail_url: thumbnail,
        artwork_url: artworkDataUrl,
        material: options.material,
        finish: options.finish,
      };

      if (savedDesignId) {
        await base44.entities.SavedDesign.update(savedDesignId, designData);
      } else {
        const result = await base44.entities.SavedDesign.create(designData);
        setSavedDesignId(result.id);
        window.history.replaceState({}, '', `${window.location.pathname}?product=${productType}&width=${canvasWidth}&height=${canvasHeight}&designId=${result.id}`);
      }
      toast.success('Design saved!');
      setShowSaveDialog(false);
    } catch (err) {
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (elements.length === 0) {
      toast.error('Please add some elements to your design first');
      return;
    }

    // Check if user is logged in
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      toast.info('Please sign in to add to cart');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsAddingToCart(true);
    try {
      // Use async versions that embed images as base64
      const thumbnail = await createThumbnail();
      const artworkDataUrl = await generateArtworkDataURL(elements, canvasWidth, canvasHeight, 150);
      const designData = {
        name: designName || 'My Design',
        product_type: productType,
        width: canvasWidth,
        height: canvasHeight,
        elements_json: JSON.stringify(elements),
        options_json: JSON.stringify(options),
        quantity,
        unit_price: parseFloat(pricing.unitPrice),
        is_in_cart: true,
        thumbnail_url: thumbnail,
        artwork_url: artworkDataUrl,
        material: options.material,
        finish: options.finish,
      };

      if (savedDesignId) {
        await base44.entities.SavedDesign.update(savedDesignId, designData);
      } else {
        const result = await base44.entities.SavedDesign.create(designData);
        setSavedDesignId(result.id);
      }
      toast.success('Added to cart!');
      navigate(createPageUrl('Cart'));
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDownload = async (format) => {
    if (format === 'svg') {
      downloadSVG(elements, canvasWidth, canvasHeight, 150, `${designName}.svg`);
    } else if (format === 'png') {
      await downloadPNG(elements, canvasWidth, canvasHeight, 150, `${designName}.png`);
    }
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackClick}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Back</span>
            </button>

            <div className="h-5 w-px bg-gray-200" />

            <button
              onClick={() => setShowSizeDialog(true)}
              className="flex items-center gap-2 text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span className="font-medium">{canvasWidth}" × {canvasHeight}"</span>
              <Settings className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-gray-200" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex === 0}>
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Center - Zoom */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(400, zoom + 25))}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Quantity & Price */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                <span className="text-sm text-gray-600">Qty:</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-xl font-bold text-green-600">${pricing.total}</div>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200" />

            {/* Download */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => handleDownload('png')}>
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download PNG</TooltipContent>
            </Tooltip>

            {/* Share */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Design</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Share this design with others. They can view and edit a copy of it.
                  </p>
                  <SocialShare title={`Check out my design: ${designName}`} />
                </div>
              </DialogContent>
            </Dialog>

            {/* Save */}
            <Button variant="outline" onClick={() => setShowSaveDialog(true)} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>

            {/* Add to Cart */}
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              Add to Cart
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Elements */}
          <ElementsPanel
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onAddImage={handleAddImage}
            onAddClipart={handleAddClipart}
            onApplyTemplate={handleApplyTemplate}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* Canvas Area */}
          <div className="flex-1 relative">
            <CanvasWorkspace
              width={canvasWidth}
              height={canvasHeight}
              zoom={zoom}
              setZoom={setZoom}
              elements={elements}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              updateElement={updateElement}
              onStartTextEdit={handleStartTextEdit}
              editingTextId={editingTextId}
              onTextEditChange={handleTextEditChange}
              onEndTextEdit={handleEndTextEdit}
              showGrid={showGrid}
              showBleed={showBleed}
            />

            {/* Floating Toolbar */}
            {selectedEl && (
              <DesignToolbar
                element={selectedEl}
                updateElement={updateElementWithHistory}
                deleteElement={deleteElement}
                duplicateElement={duplicateElement}
                moveLayerUp={moveLayerUp}
                moveLayerDown={moveLayerDown}
              />
            )}

            {/* Bottom Toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showBleed ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowBleed(!showBleed)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Bleed Area</TooltipContent>
              </Tooltip>
              <div className="w-px h-4 bg-gray-200" />
              {[50, 100, 150, 200].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    zoom === z ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Size Dialog */}
        <Dialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Canvas Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width (inches)</Label>
                  <Input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(Math.max(productConfig.minWidth, Math.min(productConfig.maxWidth, Number(e.target.value))))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Height (inches)</Label>
                  <Input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Math.max(productConfig.minHeight, Math.min(productConfig.maxHeight, Number(e.target.value))))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-1"
                />
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span>{pricing.sqft} sq ft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit Price:</span>
                  <span>${pricing.unitPrice}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">${pricing.total}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSizeDialog(false)} className="bg-blue-600 hover:bg-blue-700">
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Design</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>Design Name</Label>
              <Input
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="My Custom Banner"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Warning Dialog */}
        <Dialog open={showTemplateWarning} onOpenChange={setShowTemplateWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Replace Current Design?
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Applying this template will replace your current design. All your work will be lost.
              </p>
              <p className="text-gray-600 mt-2">
                Are you sure you want to continue?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowTemplateWarning(false);
                setPendingTemplate(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => pendingTemplate && applyTemplateConfirmed(pendingTemplate)} 
                className="bg-amber-500 hover:bg-amber-600"
              >
                Yes, Replace Design
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Exit Warning Dialog */}
        <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Exit Design Tool?
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                You have unsaved changes. If you leave now, your progress may be lost.
              </p>
              <p className="text-gray-600 mt-2">
                Are you sure you want to exit?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExitWarning(false)}>
                Stay
              </Button>
              <Button 
                onClick={() => {
                  setShowExitWarning(false);
                  navigateBack();
                }} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Exit Without Saving
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}