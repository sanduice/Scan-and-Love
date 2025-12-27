import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, Save, ShoppingCart, Undo, Redo,
  Loader2, Download, Eye, Settings,
  Minus, Plus, Share2, Layers, X, ChevronDown,
  Image as ImageIcon, FileText, FileCode
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import LayersPanel from '@/components/designer/LayersPanel';
import PageThumbnails from '@/components/designer/PageThumbnails';
import SocialShare from '@/components/SocialShare';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import CanvasWorkspace from '@/components/designer/CanvasWorkspace';
import CanvaSidebar from '@/components/designer/CanvaSidebar';
import DesignToolbar from '@/components/designer/DesignToolbar';
import { generateThumbnail, generateThumbnailWithImages, generateSVG, downloadSVG, downloadPNG, downloadPDF, downloadMultiPagePDF, generateArtworkDataURL } from '@/components/designer/CanvasExporter';
import { parseSvgToElements } from '@/components/designer/SvgParser';
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
  
  'x-banner': { material: '13oz Vinyl', minWidth: 24, maxWidth: 32, minHeight: 63, maxHeight: 70 },
  'car-magnet': { material: '30mil Magnet', minWidth: 9, maxWidth: 72, minHeight: 9, maxHeight: 24 },
  'acrylic-sign': { material: 'Clear Acrylic', minWidth: 6, maxWidth: 96, minHeight: 6, maxHeight: 48 },
  'canvas-print': { material: 'Standard Canvas', minWidth: 8, maxWidth: 60, minHeight: 8, maxHeight: 60 },
  'window-perf': { material: 'Perforated Vinyl', minWidth: 12, maxWidth: 1200, minHeight: 12, maxHeight: 58 },
};

export default function DesignTool() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const initialProductType = urlParams.get('product') || 'vinyl-banner';
  const initialWidth = Number(urlParams.get('width')) || 72;
  const initialHeight = Number(urlParams.get('height')) || 36;
  const initialSizeKey = urlParams.get('sizeKey') || null;
  const initialMaterial = urlParams.get('material') ? decodeURIComponent(urlParams.get('material')) : null;
  const initialQuantity = Number(urlParams.get('quantity')) || 1;
  const initialProductOptions = urlParams.get('productOptions') 
    ? JSON.parse(decodeURIComponent(urlParams.get('productOptions'))) 
    : null;
  const designId = urlParams.get('designId');
  const templateId = urlParams.get('templateId');
  const editTemplateId = urlParams.get('editTemplateId');
  
  // Template editing mode
  const isTemplateEditMode = !!editTemplateId;
  const [templateEditData, setTemplateEditData] = useState(null);
  
  // Dynamic product type - can be updated from saved design
  const [productType, setProductType] = useState(initialProductType);
  
  // Saved unit price - used to restore exact pricing from saved design
  const [savedUnitPrice, setSavedUnitPrice] = useState(null);

  // Fetch product configuration dynamically
  const { data: productData = [] } = useQuery({
    queryKey: ['product-config', productType],
    queryFn: () => base44.entities.Product.filter({ slug: productType }),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !isTemplateEditMode && !!productType, // Skip product fetch in template edit mode
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
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedPresetPrice, setSelectedPresetPrice] = useState(null);
  const [passedProductOptions, setPassedProductOptions] = useState(initialProductOptions);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showBleed, setShowBleed] = useState(true);
  
  // Temp state for Canvas Settings dialog (deferred apply)
  const [tempCanvasWidth, setTempCanvasWidth] = useState(initialWidth);
  const [tempCanvasHeight, setTempCanvasHeight] = useState(initialHeight);
  const [tempQuantity, setTempQuantity] = useState(initialQuantity);

  // Multi-page state
  const [pages, setPages] = useState([
    { id: 'front', label: 'Front Side', elements: [] }
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  
  // Derived elements for current page
  const elements = pages[activePageIndex]?.elements || [];
  
  // Wrapper to update elements for current page
  const setElements = useCallback((newElementsOrUpdater) => {
    setPages(prev => prev.map((page, i) => {
      if (i !== activePageIndex) return page;
      const newElements = typeof newElementsOrUpdater === 'function' 
        ? newElementsOrUpdater(page.elements) 
        : newElementsOrUpdater;
      return { ...page, elements: newElements };
    }));
  }, [activePageIndex]);

  const [selectedElement, setSelectedElement] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [history, setHistory] = useState([[{ id: 'front', label: 'Front Side', elements: [] }]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastSavedPages, setLastSavedPages] = useState(null); // Track saved state for exit warning

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

  // Sync temp state when Canvas Settings dialog opens
  useEffect(() => {
    if (showSizeDialog) {
      setTempCanvasWidth(canvasWidth);
      setTempCanvasHeight(canvasHeight);
      setTempQuantity(quantity);
    }
  }, [showSizeDialog, canvasWidth, canvasHeight, quantity]);

  const [showTemplateWarning, setShowTemplateWarning] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showTemplateSettingsDialog, setShowTemplateSettingsDialog] = useState(false);
  const [showPricingDrawer, setShowPricingDrawer] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    tags: [],
    is_active: true,
  });
  const [tagInput, setTagInput] = useState('');

  // Fetch categories for template settings
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isTemplateEditMode,
  });

  // Build category tree for dropdown
  const buildCategoryTree = (cats, parentId = null, level = 0) => {
    return cats
      .filter(c => c.parent_id === parentId)
      .map(c => ({
        ...c,
        level,
        children: buildCategoryTree(cats, c.id, level + 1)
      }));
  };

  const flattenCategories = (tree) => {
    let result = [];
    for (const cat of tree) {
      result.push(cat);
      if (cat.children?.length) {
        result = result.concat(flattenCategories(cat.children));
      }
    }
    return result;
  };

  const flatCategories = useMemo(() => {
    const tree = buildCategoryTree(categories);
    return flattenCategories(tree);
  }, [categories]);

  // Update template form data when template is loaded
  useEffect(() => {
    if (templateEditData) {
      setTemplateFormData({
        name: templateEditData.name || '',
        description: templateEditData.description || '',
        category_id: templateEditData.category_id || '',
        tags: templateEditData.tags || [],
        is_active: templateEditData.is_active ?? true,
      });
    }
  }, [templateEditData]);

  // Use dynamic pricing hook
  const pricingData = usePricing(productType, options.material, { 
    width: canvasWidth, 
    height: canvasHeight, 
    quantity,
    sizeKey
  });

  // Detect preset price when product or dimensions change
  useEffect(() => {
    if (product?.preset_sizes && Array.isArray(product.preset_sizes)) {
      const matchingPreset = product.preset_sizes.find(
        p => p.is_active !== false && 
             parseFloat(p.width) === canvasWidth && 
             parseFloat(p.height) === canvasHeight
      );
      setSelectedPresetPrice(matchingPreset?.price ?? null);
    } else {
      setSelectedPresetPrice(null);
    }
  }, [product, canvasWidth, canvasHeight]);

  // Load existing design
  useEffect(() => {
    if (designId) {
      loadDesign(designId);
    }
  }, [designId]);

  // Load template for editing (admin mode)
  useEffect(() => {
    if (editTemplateId) {
      loadTemplateForEditing(editTemplateId);
    } else if (templateId && !designId) {
      loadTemplate(templateId);
    }
  }, [editTemplateId, templateId]);

  const loadTemplateForEditing = async (id) => {
    try {
      const { data: template, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!template) {
        toast.error('Template not found');
        navigate('/admin?tab=templates');
        return;
      }

      // Store template metadata for saving later
      setTemplateEditData(template);
      setDesignName(template.name || 'Template');

      let loadedPages = null;

      // Check for multi-page format first (new format)
      if (template.design_data?.pages && template.design_data.pages.length > 0) {
        loadedPages = template.design_data.pages;
      }
      // Fall back to single-page elements format (backwards compatibility)
      else if (template.design_data?.elements && template.design_data.elements.length > 0) {
        loadedPages = [{ id: 'front', label: 'Front Side', elements: template.design_data.elements }];
      }
      // If no design_data, try parsing source file URL (SVG)
      else if (template.source_file_url) {
        const fileUrl = template.source_file_url;
        const isSvg = fileUrl.toLowerCase().includes('.svg') || 
                      fileUrl.includes('image/svg') ||
                      template.file_type === 'vector';

        let templateElements = [];
        if (isSvg) {
          toast.info('Parsing SVG template...', { duration: 2000 });
          try {
            templateElements = await parseSvgToElements(fileUrl, canvasWidth, canvasHeight);
            toast.success(`Parsed ${templateElements.length} elements from template!`);
          } catch (parseError) {
            console.error('SVG parsing failed, falling back to image:', parseError);
            templateElements = [{
              id: Date.now(),
              type: 'image',
              src: fileUrl,
              x: 0,
              y: 0,
              width: canvasWidth,
              height: canvasHeight,
              rotation: 0,
              locked: false,
              visible: true,
              opacity: 1,
              name: 'Template Image'
            }];
          }
        } else {
          templateElements = [{
            id: Date.now(),
            type: 'image',
            src: fileUrl,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            rotation: 0,
            locked: false,
            visible: true,
            opacity: 1,
            name: 'Template Image'
          }];
        }
        loadedPages = [{ id: 'front', label: 'Front Side', elements: templateElements }];
      }

      // Apply loaded pages
      if (loadedPages && loadedPages.length > 0) {
        setPages(loadedPages);
        setActivePageIndex(0);
        setHistory([loadedPages]);
        setHistoryIndex(0);
        setLastSavedPages(JSON.stringify(loadedPages)); // Mark as saved state
      }

      toast.success(`Editing template: "${template.name}"`);
    } catch (err) {
      console.error('Error loading template for editing:', err);
      toast.error('Failed to load template');
    }
  };

  const loadTemplate = async (id) => {
    try {
      const { data: template, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!template) {
        toast.error('Template not found');
        return;
      }

      let templateElements = [];

      // Apply template design data to canvas if available
      if (template.design_data?.elements && template.design_data.elements.length > 0) {
        templateElements = template.design_data.elements;
      }
      // If template has a source file URL (SVG), parse it into editable elements
      else if (template.source_file_url) {
        const fileUrl = template.source_file_url;
        const isSvg = fileUrl.toLowerCase().includes('.svg') || 
                      fileUrl.includes('image/svg') ||
                      template.file_type === 'vector';

        if (isSvg) {
          toast.info('Parsing SVG template...', { duration: 2000 });
          try {
            templateElements = await parseSvgToElements(fileUrl, canvasWidth, canvasHeight);
            toast.success(`Parsed ${templateElements.length} elements from template!`);
          } catch (parseError) {
            console.error('SVG parsing failed, falling back to image:', parseError);
            // Fallback: add as single editable image
            templateElements = [{
              id: Date.now(),
              type: 'image',
              src: fileUrl,
              x: 0,
              y: 0,
              width: canvasWidth,
              height: canvasHeight,
              rotation: 0,
              locked: false,
              visible: true,
              opacity: 1,
              name: 'Template Image'
            }];
          }
        } else {
          // Non-SVG files: add as editable image element
          templateElements = [{
            id: Date.now(),
            type: 'image',
            src: fileUrl,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            rotation: 0,
            locked: false,
            visible: true,
            opacity: 1,
            name: 'Template Image'
          }];
        }
      }

      if (templateElements.length > 0) {
        const newPages = [{ id: 'front', label: 'Front Side', elements: templateElements }];
        setPages(newPages);
        setActivePageIndex(0);
        setHistory([newPages]);
        setHistoryIndex(0);
        setLastSavedPages(JSON.stringify(newPages)); // Mark as saved state
      }

      // Set design name from template
      if (template.name) {
        setDesignName(`${template.name} - Custom`);
      }

      toast.success(`Template "${template.name}" loaded!`);
    } catch (err) {
      console.error('Error loading template:', err);
      toast.error('Failed to load template');
    }
  };

  const loadDesign = async (id) => {
    const designs = await base44.entities.SavedDesign.filter({ id });
    if (designs.length > 0) {
      const design = designs[0];
      setCanvasWidth(design.width || canvasWidth);
      setCanvasHeight(design.height || canvasHeight);
      
      // Restore product type from saved design
      if (design.product_type) {
        setProductType(design.product_type);
      }
      
      // Restore saved unit price (for exact price restoration)
      if (design.unit_price) {
        setSavedUnitPrice(parseFloat(design.unit_price));
      }
      
      try {
        // Load from design_data (jsonb column)
        let loadedPages;
        const designData = design.design_data;
        
        if (designData?.pages && Array.isArray(designData.pages) && designData.pages.length > 0) {
          // New multi-page format
          loadedPages = designData.pages;
        } else if (designData?.elements && Array.isArray(designData.elements)) {
          // Single-page elements format (backwards compatibility)
          loadedPages = [{ id: 'front', label: 'Front Side', elements: designData.elements }];
        } else {
          loadedPages = [{ id: 'front', label: 'Front Side', elements: [] }];
        }
        
        setPages(loadedPages);
        setActivePageIndex(0);
        setHistory([loadedPages]);
        setHistoryIndex(0);
        setLastSavedPages(JSON.stringify(loadedPages)); // Mark as saved state
        
        // Restore options from options_json if available
        if (design.options_json && typeof design.options_json === 'object') {
          setOptions(prev => ({ ...prev, ...design.options_json }));
        }
        
        // Restore passed product options if available
        if (design.options_json?.productOptions) {
          setPassedProductOptions(design.options_json.productOptions);
        }
      } catch (e) {
        console.error('Error loading design:', e);
        setPages([{ id: 'front', label: 'Front Side', elements: [] }]);
      }
      setDesignName(design.name || 'My Design');
      if (design.quantity) setQuantity(design.quantity);
    }
  };

  const saveToHistory = useCallback((newElementsOrPages, isPages = false) => {
    if (isPages) {
      // Save entire pages state
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newElementsOrPages)));
        return newHistory.slice(-50);
      });
    } else {
      // Save current page elements - create new pages array with updated elements
      setPages(currentPages => {
        const newPages = currentPages.map((page, i) => 
          i === activePageIndex ? { ...page, elements: newElementsOrPages } : page
        );
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newPages)));
          return newHistory.slice(-50);
        });
        return currentPages; // Don't actually update pages here, just save to history
      });
    }
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex, activePageIndex]);

  // Detect Mac vs Windows/Linux for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const prevPages = history[historyIndex - 1];
      setPages(JSON.parse(JSON.stringify(prevPages)));
      setSelectedElement(null);
      setEditingTextId(null);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextPages = history[historyIndex + 1];
      setPages(JSON.parse(JSON.stringify(nextPages)));
      setSelectedElement(null);
      setEditingTextId(null);
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts for undo/redo (cross-platform)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if editing text or typing in an input/textarea
      if (editingTextId || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Detect modifier key: Cmd on Mac, Ctrl on Windows/Linux
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (!modifier) return;
      
      // Undo: Ctrl+Z (Windows) or Cmd+Z (Mac)
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Y (Windows) or Ctrl+Shift+Z (Windows/Mac) or Cmd+Shift+Z (Mac)
      if ((e.key === 'y' && !isMac) || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTextId, isMac, undo, redo]);

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

  const bringToFront = (id) => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1 || index === elements.length - 1) return;
    const newElements = [...elements];
    const [element] = newElements.splice(index, 1);
    newElements.push(element);
    setElements(newElements);
    saveToHistory(newElements);
  };

  const sendToBack = (id) => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1 || index === 0) return;
    const newElements = [...elements];
    const [element] = newElements.splice(index, 1);
    newElements.unshift(element);
    setElements(newElements);
    saveToHistory(newElements);
  };

  const alignToCanvas = (id, alignment) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    let updates = {};
    switch (alignment) {
      case 'left':
        updates = { x: 0 };
        break;
      case 'center-h':
        updates = { x: (canvasWidth - element.width) / 2 };
        break;
      case 'right':
        updates = { x: canvasWidth - element.width };
        break;
      case 'top':
        updates = { y: 0 };
        break;
      case 'center-v':
        updates = { y: (canvasHeight - element.height) / 2 };
        break;
      case 'bottom':
        updates = { y: canvasHeight - element.height };
        break;
    }
    updateElementWithHistory(id, updates);
  };

  // Add handlers
  const handleAddText = (preset) => {
    addElement({
      type: 'text',
      text: preset.label || 'Your Text',
      fontSize: preset.fontSize || 4,
      fontFamily: preset.fontFamily || 'Inter',
      fontWeight: preset.fontWeight || 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      color: preset.color || '#000000',
      width: canvasWidth * 0.6,
      height: preset.fontSize * 2 || 8,
    });
  };

  const handleAddShape = (shape, color, svgPath, svgViewBox) => {
    // Handle line shapes with different dimensions
    const isLine = shape.startsWith('line-') || shape === 'double-arrow';
    const isArrowShape = shape.startsWith('arrow-');
    const isVertical = shape === 'line-v' || shape === 'arrow-up' || shape === 'arrow-down' || 
                       shape === 'arrow-simple-up' || shape === 'arrow-simple-down' ||
                       shape === 'arrow-block-up' || shape === 'arrow-block-down' ||
                       shape === 'arrow-vertical';
    const isSpeechBubble = shape.startsWith('speech-') || shape.startsWith('thought-') || shape.startsWith('cloud-');
    const isCallout = shape.startsWith('callout-');
    const isRibbon = shape.startsWith('ribbon-') || shape === 'badge-shield' || shape === 'badge-ribbon';
    const isBracket = shape.startsWith('bracket-') || shape.startsWith('frame-');
    const isStarburst = shape === 'starburst' || shape === 'star-burst' || shape === 'seal-star';
    const isFlowchart = shape.startsWith('flow-') || shape.startsWith('pie-');
    const isBlob = shape.startsWith('blob-') || shape.startsWith('organic-') || shape.startsWith('abstract-') || 
                   shape.startsWith('squiggle-') || shape.startsWith('wave-') || shape.startsWith('geo-') ||
                   shape === 'zigzag-arrow' || shape === 'arch-rounded' || shape.startsWith('half-ring-');
    const isStar = shape.startsWith('star-') || shape === 'star-sparkle';
    const isHeart = shape.startsWith('heart-');
    const isFlower = shape.startsWith('flower-');
    const isChevron = shape.startsWith('chevron-');
    const isWeather = ['cloud', 'sun', 'sun-rays', 'moon-crescent', 'lightning', 'snowflake', 'raindrop'].includes(shape);
    const isMiscDeco = ['location-pin', 'smiley', 'cross-plus', 'cross-x', 'checkmark', 'clover'].includes(shape);
    
    // Use the smaller dimension for proportional shapes to prevent distortion
    const minDimension = Math.min(canvasWidth, canvasHeight);
    
    let width, height;
    if (isLine) {
      if (isVertical) {
        width = 0.5;
        height = canvasHeight * 0.3;
      } else {
        width = canvasWidth * 0.3;
        height = 0.5;
      }
    } else if (isArrowShape || isChevron) {
      width = minDimension * 0.15;
      height = minDimension * 0.1;
    } else if (isSpeechBubble) {
      width = minDimension * 0.5;
      height = minDimension * 0.35;
    } else if (isCallout) {
      width = minDimension * 0.35;
      height = minDimension * 0.25;
    } else if (isRibbon) {
      // Ribbons are intentionally wider
      width = canvasWidth * 0.5;
      height = minDimension * 0.15;
    } else if (isBracket) {
      // Brackets are intentionally taller
      width = minDimension * 0.1;
      height = canvasHeight * 0.3;
    } else if (isStarburst || isStar || isHeart || isFlower || isWeather || isMiscDeco) {
      width = minDimension * 0.25;
      height = minDimension * 0.25;
    } else if (isFlowchart) {
      width = minDimension * 0.25;
      height = minDimension * 0.2;
    } else if (isBlob) {
      // Use viewBox to determine aspect ratio if available
      if (svgViewBox) {
        const [, , vbWidth, vbHeight] = svgViewBox.split(' ').map(Number);
        const aspectRatio = vbWidth / vbHeight;
        const baseSize = minDimension * 0.35;
        if (aspectRatio > 1) {
          width = baseSize;
          height = baseSize / aspectRatio;
        } else if (aspectRatio < 1) {
          height = baseSize;
          width = baseSize * aspectRatio;
        } else {
          width = baseSize;
          height = baseSize;
        }
      } else {
        width = minDimension * 0.3;
        height = minDimension * 0.3;
      }
    } else if (shape === 'circle' || shape === 'hexagon' ||
               shape === 'pentagon' || shape === 'octagon' || shape === 'diamond') {
      width = minDimension * 0.25;
      height = minDimension * 0.25;
    } else {
      // Default rectangle - proportional square
      width = minDimension * 0.3;
      height = minDimension * 0.3;
    }
    
    addElement({
      type: 'shape',
      shape,
      fill: color || '#3B82F6',
      stroke: 'none',
      strokeWidth: 0,
      width,
      height,
      svgPath,
      svgViewBox,
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

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const totalElements = pages.reduce((sum, page) => sum + page.elements.length, 0);
    if (totalElements === 0) return false;
    if (lastSavedPages === null) return true; // Never saved
    return JSON.stringify(pages) !== lastSavedPages;
  }, [pages, lastSavedPages]);

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true);
    } else {
      navigateBack();
    }
  };

  const navigateBack = () => {
    // If editing a template, go back to admin templates
    if (isTemplateEditMode) {
      navigate('/admin?tab=templates');
      return;
    }
    
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
    let unitPrice = 0;
    let total = 0;

    // PRIORITY 0: Use saved unit price when loading existing design (for exact restoration)
    if (savedUnitPrice !== null && savedDesignId) {
      unitPrice = savedUnitPrice;
      total = unitPrice * quantity;
    }
    // PRIORITY 1: Use preset size price if available (non-custom sizes)
    else if (selectedPresetPrice !== null && selectedPresetPrice !== undefined && sizeKey !== 'custom') {
      unitPrice = parseFloat(selectedPresetPrice);
      total = unitPrice * quantity;
    }
    // PRIORITY 1.5: Custom size - always use price_per_sqft if available
    else if (sizeKey === 'custom' && product?.price_per_sqft > 0) {
      const sqft = (canvasWidth * canvasHeight) / 144;
      unitPrice = sqft * product.price_per_sqft;
      total = unitPrice * quantity;
    }
    // PRIORITY 2: Use per_sqft pricing if product uses that mode
    else if (product?.pricing_type === 'per_sqft' && product?.price_per_sqft > 0) {
      const sqft = (canvasWidth * canvasHeight) / 144;
      unitPrice = sqft * product.price_per_sqft;
      total = unitPrice * quantity;
    }
    // PRIORITY 3: Fall back to usePricing hook data
    else {
      total = parseFloat(pricingData.total) || 0;
      unitPrice = parseFloat(pricingData.unitPrice) || (total / quantity);
      
      // Fallback min price if DB returns 0 (safety net)
      if (total === 0) {
        const sqft = (canvasWidth * canvasHeight) / 144;
        total = Math.max(25, sqft * 3 * quantity);
        unitPrice = total / quantity;
      }
    }

    // Apply modifiers (Double Sided, etc.) - only if not using savedUnitPrice
    // (savedUnitPrice already includes modifiers from when design was saved)
    if (!savedUnitPrice || !savedDesignId) {
      if (options.printSides === 'Double Sided') {
        total *= 1.5;
        unitPrice *= 1.5;
      }
    }

    // Store base unit price BEFORE adding product options
    const baseUnitPrice = unitPrice;

    // Apply product options prices from passed options (e.g., pole pockets, grommets)
    if (!savedUnitPrice || !savedDesignId) {
      if (passedProductOptions && typeof passedProductOptions === 'object') {
        Object.values(passedProductOptions).forEach(option => {
          if (option && typeof option === 'object' && option.price) {
            const optionPrice = parseFloat(option.price) || 0;
            if (optionPrice > 0) {
              // Option price is per unit
              total += optionPrice * quantity;
              unitPrice += optionPrice;
            }
          }
        });
      }
    }

    // Determine pricing source
    let pricingSource = 'calculated';
    if (savedUnitPrice !== null && savedDesignId) {
      pricingSource = 'saved';
    } else if (selectedPresetPrice !== null && selectedPresetPrice !== undefined && sizeKey !== 'custom') {
      pricingSource = 'preset';
    } else if ((sizeKey === 'custom' && product?.price_per_sqft > 0) || (product?.pricing_type === 'per_sqft' && product?.price_per_sqft > 0)) {
      pricingSource = 'sqft';
    }

    return {
      total: total.toFixed(2),
      unitPrice: unitPrice.toFixed(2),
      baseUnitPrice: baseUnitPrice.toFixed(2),
      sqft: pricingData.sqft?.toFixed(2) || ((canvasWidth * canvasHeight) / 144).toFixed(2),
      source: pricingSource,
    };
  }, [pricingData, options.printSides, quantity, canvasWidth, canvasHeight, selectedPresetPrice, product, passedProductOptions, savedUnitPrice, savedDesignId, sizeKey]);

  // Temp pricing for Canvas Settings dialog preview (uses temp values)
  const tempPricing = useMemo(() => {
    if (!showSizeDialog) return null;
    
    const sqft = (tempCanvasWidth * tempCanvasHeight) / 144;
    const presetSizes = product?.preset_sizes || [];
    
    // Check if temp dimensions match a preset
    const matchingPreset = presetSizes.find(ps => 
      ps.width === tempCanvasWidth && ps.height === tempCanvasHeight
    );
    
    let unitPrice = 0;
    let source = 'calculated';
    
    // If dimensions match current preset and it has custom price
    if (matchingPreset?.price && product?.pricing_type === 'custom') {
      unitPrice = parseFloat(matchingPreset.price);
      source = 'preset';
    } 
    // Otherwise use per sqft calculation
    else if (product?.price_per_sqft > 0) {
      unitPrice = sqft * product.price_per_sqft;
      source = 'sqft';
    }
    // Fallback
    else {
      unitPrice = sqft * 3; // Fallback rate
    }
    
    // Apply modifiers
    if (options.printSides === 'Double Sided') {
      unitPrice *= 1.5;
    }
    
    // Apply option prices
    if (passedProductOptions && typeof passedProductOptions === 'object') {
      Object.values(passedProductOptions).forEach(option => {
        if (option && typeof option === 'object' && option.price) {
          unitPrice += parseFloat(option.price) || 0;
        }
      });
    }
    
    return {
      sqft: sqft.toFixed(2),
      unitPrice: unitPrice.toFixed(2),
      total: (unitPrice * tempQuantity).toFixed(2),
      source
    };
  }, [showSizeDialog, tempCanvasWidth, tempCanvasHeight, tempQuantity, product, options.printSides, passedProductOptions]);

  // Always use front page (pages[0]) for thumbnail to ensure consistency
  const createThumbnail = () => generateThumbnailWithImages(pages[0]?.elements || [], canvasWidth, canvasHeight);

  // Save template (admin template edit mode)
  const saveTemplate = async () => {
    if (!templateEditData?.id) {
      toast.error('No template loaded');
      return;
    }

    setIsSaving(true);
    try {
      // Generate new thumbnail
      const thumbnail = await createThumbnail();

      // Update design_templates table - save ALL pages, not just current, plus metadata
      const { error } = await supabase
        .from('design_templates')
        .update({
          name: templateFormData.name || templateEditData.name,
          description: templateFormData.description,
          category_id: templateFormData.category_id || null,
          tags: templateFormData.tags,
          is_active: templateFormData.is_active,
          sizes: [{ width: canvasWidth, height: canvasHeight, unit: 'inches' }],
          design_data: { 
            pages, // Save all pages for multi-page support
            elements: pages[0]?.elements || [] // Keep backwards compatibility
          },
          thumbnail_url: thumbnail,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateEditData.id);

      if (error) throw error;
      
      setLastSavedPages(JSON.stringify(pages)); // Mark as saved
      toast.success('Template saved successfully!');
    } catch (err) {
      console.error('Failed to save template:', err);
      toast.error('Failed to save template: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

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

      const designPayload = {
        name: designName,
        product_type: productType,
        width: canvasWidth,
        height: canvasHeight,
        design_data: {
          pages,
          elements: pages[0]?.elements || [], // backwards compatibility
        },
        options_json: {
          ...options,
          productOptions: passedProductOptions,
          sizeKey,
        },
        quantity,
        unit_price: parseFloat(pricing.unitPrice),
        thumbnail_url: thumbnail,
        artwork_url: artworkDataUrl,
        material: options.material,
        finish: options.finish,
      };

      if (savedDesignId) {
        await base44.entities.SavedDesign.update(savedDesignId, designPayload);
      } else {
        const result = await base44.entities.SavedDesign.create(designPayload);
        setSavedDesignId(result.id);
        window.history.replaceState({}, '', `${window.location.pathname}?product=${productType}&width=${canvasWidth}&height=${canvasHeight}&designId=${result.id}`);
      }
      setLastSavedPages(JSON.stringify(pages)); // Mark as saved
      
      // Invalidate saved designs cache so Account page shows updated list
      queryClient.invalidateQueries({ queryKey: ['user-designs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-designs'] });
      
      toast.success('Design saved!');
      setShowSaveDialog(false);
    } catch (err) {
      console.error('Failed to save design:', err);
      toast.error(err.message || 'Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async () => {
    const totalElements = pages.reduce((sum, page) => sum + page.elements.length, 0);
    if (totalElements === 0) {
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
      const designPayload = {
        name: designName || 'My Design',
        product_type: productType,
        width: canvasWidth,
        height: canvasHeight,
        design_data: {
          pages,
          elements: pages[0]?.elements || [], // backwards compatibility
        },
        options_json: {
          ...options,
          productOptions: passedProductOptions,
          sizeKey,
        },
        quantity,
        unit_price: parseFloat(pricing.unitPrice),
        is_in_cart: true,
        thumbnail_url: thumbnail,
        artwork_url: artworkDataUrl,
        material: options.material,
        finish: options.finish,
      };

      if (savedDesignId) {
        await base44.entities.SavedDesign.update(savedDesignId, designPayload);
      } else {
        const result = await base44.entities.SavedDesign.create(designPayload);
        setSavedDesignId(result.id);
      }
      
      // Invalidate saved designs cache
      queryClient.invalidateQueries({ queryKey: ['user-designs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-designs'] });
      
      toast.success('Added to cart!');
      navigate(createPageUrl('Cart'));
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDownload = async (format) => {
    const loadingToast = toast.loading(`Generating ${format.toUpperCase()}...`, {
      description: pages.length > 1 ? `Processing ${pages.length} pages` : undefined
    });
    
    try {
      // PDF: export all pages into a single multi-page PDF
      if (format === 'pdf') {
        await downloadMultiPagePDF(pages, canvasWidth, canvasHeight, 150, `${designName}.pdf`);
        toast.dismiss(loadingToast);
        toast.success(`Downloaded PDF with ${pages.length} page(s)`);
        return;
      }
      
      // SVG/PNG: export each page separately
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageSuffix = pages.length > 1 ? `_${page.label.replace(/\s/g, '_')}` : '';
        const filename = `${designName}${pageSuffix}`;
        
        if (format === 'svg') {
          await downloadSVG(page.elements, canvasWidth, canvasHeight, 150, `${filename}.svg`);
        } else if (format === 'png') {
          await downloadPNG(page.elements, canvasWidth, canvasHeight, 150, `${filename}.png`);
        }
      }
      toast.dismiss(loadingToast);
      toast.success(`Downloaded ${pages.length} page(s) as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Download failed:', err);
      toast.dismiss(loadingToast);
      toast.error('Failed to download. Please try again.');
    }
  };

  // Multi-page management
  const handleAddPage = (type) => {
    if (pages.length >= 2) {
      toast.error('Maximum 2 sides allowed for banners');
      return;
    }
    
    const newPage = {
      id: 'back',
      label: 'Back Side',
      elements: type === 'duplicate' 
        ? pages[0].elements.map(el => ({ ...el, id: Date.now() + Math.random() }))
        : []
    };
    
    const newPages = [...pages, newPage];
    setPages(newPages);
    setActivePageIndex(1);
    saveToHistory(newPages, true);
    toast.success('Back side added');
  };

  const handleDeletePage = (pageIndex) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the only page');
      return;
    }
    
    const newPages = pages.filter((_, i) => i !== pageIndex);
    setPages(newPages);
    
    // Adjust active index if needed
    if (activePageIndex >= newPages.length) {
      setActivePageIndex(Math.max(0, newPages.length - 1));
    }
    
    saveToHistory(newPages, true);
    toast.success('Page deleted');
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#F2F3F6] overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackClick}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">
                {isTemplateEditMode ? 'Back to Templates' : 'Back'}
              </span>
            </button>

            <div className="h-5 w-px bg-gray-200" />

            {/* Template Mode Indicator */}
            {isTemplateEditMode && (
              <>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Editing Template
                </div>
                <div className="h-5 w-px bg-gray-200" />
              </>
            )}

            <button
              onClick={() => isTemplateEditMode ? setShowTemplateSettingsDialog(true) : setShowSizeDialog(true)}
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
                <TooltipContent>Undo ({isMac ? '⌘Z' : 'Ctrl+Z'})</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo ({isMac ? '⌘⇧Z' : 'Ctrl+Y'})</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Spacer for center alignment */}
          <div className="w-32" />

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Quantity & Price - Only show in normal mode */}
            {!isTemplateEditMode && (
              <>
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

                  <div 
                    className="text-right cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setShowPricingDrawer(true)}
                  >
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-xl font-bold text-green-600 underline decoration-dashed underline-offset-2">${pricing.total}</div>
                    <div className="text-[10px] text-muted-foreground">Click for details</div>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200" />
              </>
            )}

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload('png')}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Download as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDownload('svg')}>
                  <FileCode className="w-4 h-4 mr-2" />
                  Download as SVG (Vector)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share - Only in normal mode */}
            {!isTemplateEditMode && (
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
            )}

            {/* Save / Save Template Button */}
            {isTemplateEditMode ? (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={saveTemplate} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Template
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Canva-style Sidebar */}
          <CanvaSidebar
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onAddImage={handleAddImage}
            onAddClipart={handleAddClipart}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          {/* Canvas Area - shrinks when layers panel is open */}
          <div className="flex-1 relative transition-all duration-300 ease-in-out">
            <CanvasWorkspace
              width={canvasWidth}
              height={canvasHeight}
              zoom={zoom}
              setZoom={setZoom}
              elements={elements}
              setElements={setElements}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              updateElement={updateElement}
              onStartTextEdit={handleStartTextEdit}
              editingTextId={editingTextId}
              onTextEditChange={handleTextEditChange}
              onEndTextEdit={handleEndTextEdit}
              showGrid={showGrid}
              showBleed={showBleed}
              saveToHistory={saveToHistory}
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
                bringToFront={bringToFront}
                sendToBack={sendToBack}
                alignToCanvas={alignToCanvas}
              />
            )}

            {/* Bottom Left - Page Thumbnails */}
            <div className="absolute bottom-4 left-4 z-10">
              <PageThumbnails 
                pages={pages}
                activePageIndex={activePageIndex}
                onPageSelect={(index) => {
                  setActivePageIndex(index);
                  setSelectedElement(null);
                  setEditingTextId(null);
                }}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            </div>
            {/* Bottom Right - Zoom Slider + Layers Toggle */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-lg border">
              {/* Zoom Slider */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setZoom(Math.max(25, zoom - 10))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
                <Slider
                  value={[zoom]}
                  onValueChange={(v) => setZoom(v[0])}
                  min={25}
                  max={400}
                  step={5}
                  className="w-28"
                />
                <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setZoom(Math.min(400, zoom + 10))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
              </div>
              
              <div className="w-px h-6 bg-gray-200" />
              
              {/* Layers Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showLayersPanel ? 'default' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowLayersPanel(!showLayersPanel)}
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Layers Panel</TooltipContent>
              </Tooltip>
            </div>

          </div>

          {/* Right - Inline Layers Panel (push layout, not overlay) */}
          {showLayersPanel && (
            <div className="w-72 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out">
              {/* Header */}
              <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Layers</span>
                  <span className="text-sm text-gray-500">{elements.length} items</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setShowLayersPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Layer content */}
              <div className="flex-1 overflow-y-auto">
                <LayersPanel
                  elements={elements}
                  selectedElement={selectedElement}
                  setSelectedElement={setSelectedElement}
                  setElements={setElements}
                  updateElement={updateElement}
                  deleteElement={deleteElement}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  saveToHistory={saveToHistory}
                />
              </div>
            </div>
          )}
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
                    value={tempCanvasWidth}
                    onChange={(e) => setTempCanvasWidth(Math.max(productConfig.minWidth, Math.min(productConfig.maxWidth, Number(e.target.value))))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Height (inches)</Label>
                  <Input
                    type="number"
                    value={tempCanvasHeight}
                    onChange={(e) => setTempCanvasHeight(Math.max(productConfig.minHeight, Math.min(productConfig.maxHeight, Number(e.target.value))))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-1"
                />
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{tempPricing?.sqft || pricing.sqft} sq ft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Unit Price {tempPricing?.source === 'preset' ? '(custom)' : tempPricing?.source === 'sqft' ? '(per sq ft)' : ''}:
                  </span>
                  <span>${tempPricing?.unitPrice || pricing.unitPrice}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">${tempPricing?.total || pricing.total}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowSizeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Check if dimensions changed from a preset size
                  const presetSizes = product?.preset_sizes || [];
                  const originalPreset = presetSizes.find(ps => ps.key === sizeKey);
                  
                  // Detect if user modified preset dimensions
                  const dimensionsChanged = originalPreset && 
                    (tempCanvasWidth !== originalPreset.width || tempCanvasHeight !== originalPreset.height);
                  
                  // Check if new dimensions match any preset
                  const matchingPreset = presetSizes.find(ps => 
                    ps.width === tempCanvasWidth && ps.height === tempCanvasHeight
                  );
                  
                  // Apply changes
                  setCanvasWidth(tempCanvasWidth);
                  setCanvasHeight(tempCanvasHeight);
                  setQuantity(tempQuantity);
                  
                  // If dimensions changed from preset and don't match another preset, switch to custom pricing
                  if (dimensionsChanged && !matchingPreset) {
                    setSizeKey('custom');
                    setSelectedPresetPrice(null);
                    toast.info('Switched to custom size pricing');
                  } else if (matchingPreset) {
                    // If dimensions match a preset, use that preset's pricing
                    setSizeKey(matchingPreset.key);
                    if (matchingPreset.price && product?.pricing_type === 'custom') {
                      setSelectedPresetPrice(parseFloat(matchingPreset.price));
                    }
                  }
                  
                  // Clear saved unit price if size changed (force recalculation)
                  if (tempCanvasWidth !== canvasWidth || tempCanvasHeight !== canvasHeight) {
                    setSavedUnitPrice(null);
                  }
                  
                  setShowSizeDialog(false);
                }} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Settings Dialog (for template edit mode) */}
        <Dialog open={showTemplateSettingsDialog} onOpenChange={setShowTemplateSettingsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              {/* Template Name */}
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sale Banner Template"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={templateFormData.category_id || 'none'} 
                  onValueChange={(v) => setTemplateFormData(prev => ({ ...prev, category_id: v === 'none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {flatCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'—'.repeat(cat.level)} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Canvas Size */}
              <div className="space-y-2">
                <Label>Canvas Size</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Width (inches)</span>
                    <Input
                      type="number"
                      value={canvasWidth}
                      onChange={(e) => setCanvasWidth(Math.max(1, Number(e.target.value)))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Height (inches)</span>
                    <Input
                      type="number"
                      value={canvasHeight}
                      onChange={(e) => setCanvasHeight(Math.max(1, Number(e.target.value)))}
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateFormData.description || ''}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this template..."
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim() && !templateFormData.tags.includes(tagInput.trim())) {
                          setTemplateFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
                          setTagInput('');
                        }
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (tagInput.trim() && !templateFormData.tags.includes(tagInput.trim())) {
                        setTemplateFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
                        setTagInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {templateFormData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {templateFormData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="pr-1">
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => setTemplateFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} 
                          className="ml-1 p-0.5 hover:bg-muted rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Make available in design tool</p>
                </div>
                <Switch
                  checked={templateFormData.is_active}
                  onCheckedChange={(checked) => setTemplateFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setShowTemplateSettingsDialog(false)}>Cancel</Button>
              <Button 
                onClick={async () => {
                  if (!templateEditData?.id) {
                    toast.error('No template loaded');
                    return;
                  }
                  try {
                    const { error } = await supabase
                      .from('design_templates')
                      .update({
                        name: templateFormData.name || templateEditData.name,
                        description: templateFormData.description,
                        category_id: templateFormData.category_id || null,
                        tags: templateFormData.tags,
                        is_active: templateFormData.is_active,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', templateEditData.id);
                    if (error) throw error;
                    toast.success('Template settings saved!');
                    setShowTemplateSettingsDialog(false);
                  } catch (err) {
                    console.error('Failed to save template settings:', err);
                    toast.error('Failed to save: ' + err.message);
                  }
                }} 
                className="bg-primary hover:bg-primary/90"
              >
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

        {/* Pricing Summary Drawer */}
        <Sheet open={showPricingDrawer} onOpenChange={setShowPricingDrawer}>
          <SheetContent side="right" className="w-[400px] sm:w-[450px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Pricing Summary</SheetTitle>
              <SheetDescription>
                Breakdown of your order pricing
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {/* Product Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Product</h3>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{product?.name || productType}</p>
                    <p className="text-sm text-muted-foreground">
                      {canvasWidth}" × {canvasHeight}" ({pricing.sqft} sq ft)
                    </p>
                    {sizeKey && (
                      <Badge variant="outline" className="mt-1">{sizeKey}</Badge>
                    )}
                  </div>
                  <span className="font-medium">${pricing.baseUnitPrice}</span>
                </div>
              </div>

              {/* Product Options - Only show proper option objects with id and title */}
              {(() => {
                // Filter to only valid option objects (have id and title properties)
                const validOptions = passedProductOptions ? Object.entries(passedProductOptions).filter(([key, option]) => 
                  option && 
                  typeof option === 'object' && 
                  option.id && 
                  option.title
                ) : [];
                
                const totalOptionsPrice = validOptions.reduce((sum, [key, option]) => {
                  return sum + (option.price ? parseFloat(option.price) : 0);
                }, 0);
                
                // Helper to get option group name from product options
                const getOptionGroupName = (optionId) => {
                  if (!product?.product_options) return null;
                  const optionGroup = product.product_options.find(opt => opt.id === optionId);
                  return optionGroup?.name || null;
                };
                
                return (
                  <>
                    {validOptions.length > 0 && (
                      <div className="border-b pb-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                          Product Options
                        </h3>
                        <div className="space-y-2">
                          {validOptions.map(([key, option]) => {
                            const optionName = getOptionGroupName(key) || key;
                            const hasPrice = option.price && parseFloat(option.price) > 0;
                            
                            return (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {optionName}
                                </span>
                                <span className="font-medium flex items-center gap-2">
                                  <span>{option.title}</span>
                                  {hasPrice && (
                                    <span className="text-green-600">+${parseFloat(option.price).toFixed(2)}</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Unit Price Subtotal */}
                    <div className="border-b pb-4 bg-muted/30 -mx-6 px-6 py-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Unit Price</span>
                        <span className="font-semibold text-lg">${pricing.unitPrice}</span>
                      </div>
                      {totalOptionsPrice > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Base ${pricing.baseUnitPrice} + Options ${totalOptionsPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Print Options */}
              {options.material && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    Print Options
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material</span>
                      <span>{options.material}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium text-lg">× {quantity}</span>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${pricing.total}
                  </span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}