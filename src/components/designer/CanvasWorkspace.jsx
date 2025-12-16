import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCw, ArrowUpToLine, ArrowDownToLine, Crosshair, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle, Copy, Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Main Canvas Workspace - Canva-style infinite canvas with pan/zoom
export default function CanvasWorkspace({
  width,
  height,
  zoom,
  setZoom,
  elements,
  setElements,
  selectedElement,
  setSelectedElement,
  updateElement,
  onStartTextEdit,
  editingTextId,
  onTextEditChange,
  onEndTextEdit,
  showGrid,
  showBleed,
  saveToHistory,
}) {
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0, rotation: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [alignmentGuides, setAlignmentGuides] = useState({ showVertical: false, showHorizontal: false });
  
  // Multi-select and marquee selection state
  const [selectedElements, setSelectedElements] = useState([]);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });
  const [groupDragStart, setGroupDragStart] = useState({});
  
  // Keep refs for immediate access during drag operations
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const PIXELS_PER_INCH = 10;
  const scale = (zoom / 100) * PIXELS_PER_INCH;
  const canvasPixelWidth = width * scale;
  const canvasPixelHeight = height * scale;
  const bleedSize = 0.25 * scale;

  // Calculate off-canvas elements and their directions
  const offCanvasInfo = useMemo(() => {
    const offElements = elements.filter(el => 
      (el.x + el.width < 0) || (el.x > width) || 
      (el.y + el.height < 0) || (el.y > height)
    );
    
    let hasLeft = false, hasRight = false, hasTop = false, hasBottom = false;
    offElements.forEach(el => {
      if (el.x + el.width < 0) hasLeft = true;
      if (el.x > width) hasRight = true;
      if (el.y + el.height < 0) hasTop = true;
      if (el.y > height) hasBottom = true;
    });
    
    return { offElements, hasLeft, hasRight, hasTop, hasBottom };
  }, [elements, width, height]);

  const bringAllToCanvas = useCallback(() => {
    const newElements = elements.map(el => {
      const isOff = (el.x + el.width < 0) || (el.x > width) || 
                    (el.y + el.height < 0) || (el.y > height);
      if (isOff) {
        return {
          ...el,
          x: (width - el.width) / 2,
          y: (height - el.height) / 2,
        };
      }
      return el;
    });
    setElements(newElements);
    if (saveToHistory) saveToHistory(newElements);
  }, [elements, width, height, setElements, saveToHistory]);

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(prev => Math.max(25, Math.min(400, prev + delta)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleElementMouseDown = useCallback((e, elementId) => {
    if (e.button === 2) return; // Right-click handled separately
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    // Allow event propagation for locked elements (for marquee over them)
    if (element.locked) return;
    
    e.stopPropagation();
    if (editingTextId === elementId) return;

    // Shift+click = toggle selection (add/remove from multi-select)
    if (e.shiftKey) {
      setSelectedElements(prev => {
        if (prev.includes(elementId)) {
          const newSelection = prev.filter(id => id !== elementId);
          if (newSelection.length === 1) {
            setSelectedElement(newSelection[0]);
          } else if (newSelection.length === 0) {
            setSelectedElement(null);
          }
          return newSelection;
        } else {
          setSelectedElement(elementId);
          return [...prev, elementId];
        }
      });
    } else {
      // Check if clicking on an already selected element in a group
      const isInCurrentSelection = selectedElements.includes(elementId);
      if (isInCurrentSelection && selectedElements.length > 1) {
        // Start group drag without changing selection
      } else {
        // Normal click = single select
        setSelectedElement(elementId);
        setSelectedElements([elementId]);
      }
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Store start positions for all selected elements (for group drag)
    const currentSelection = e.shiftKey ? 
      (selectedElements.includes(elementId) ? selectedElements : [...selectedElements, elementId]) :
      (selectedElements.includes(elementId) && selectedElements.length > 1 ? selectedElements : [elementId]);
    
    const startPositions = {};
    currentSelection.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (el) {
        startPositions[id] = { x: el.x, y: el.y };
      }
    });
    setGroupDragStart(startPositions);
    
    setElementStart({ 
      x: element.x, 
      y: element.y, 
      width: element.width, 
      height: element.height,
      rotation: element.rotation || 0
    });
  }, [elements, editingTextId, setSelectedElement, selectedElements]);

  const handleContextMenu = useCallback((e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId,
    });
  }, [setSelectedElement]);

  const handleBringToFront = useCallback(() => {
    if (!contextMenu?.elementId) return;
    const index = elements.findIndex(el => el.id === contextMenu.elementId);
    if (index === -1 || index === elements.length - 1) {
      setContextMenu(null);
      return;
    }
    const newElements = [...elements];
    const [element] = newElements.splice(index, 1);
    newElements.push(element);
    setElements(newElements);
    if (saveToHistory) saveToHistory(newElements);
    setContextMenu(null);
  }, [contextMenu, elements, setElements, saveToHistory]);

  const handleSendToBack = useCallback(() => {
    if (!contextMenu?.elementId) return;
    const index = elements.findIndex(el => el.id === contextMenu.elementId);
    if (index === -1 || index === 0) {
      setContextMenu(null);
      return;
    }
    const newElements = [...elements];
    const [element] = newElements.splice(index, 1);
    newElements.unshift(element);
    setElements(newElements);
    if (saveToHistory) saveToHistory(newElements);
    setContextMenu(null);
  }, [contextMenu, elements, setElements, saveToHistory]);

  const handleCenterOnCanvas = useCallback(() => {
    if (!contextMenu?.elementId) return;
    const element = elements.find(el => el.id === contextMenu.elementId);
    if (!element) {
      setContextMenu(null);
      return;
    }
    const newX = (width - element.width) / 2;
    const newY = (height - element.height) / 2;
    updateElement(contextMenu.elementId, { x: newX, y: newY });
    // Save to history after centering
    if (saveToHistory) {
      const newElements = elements.map(el => 
        el.id === contextMenu.elementId ? { ...el, x: newX, y: newY } : el
      );
      saveToHistory(newElements);
    }
    setContextMenu(null);
  }, [contextMenu, elements, updateElement, width, height, saveToHistory]);

  // Floating toolbar actions
  const handleDuplicate = useCallback(() => {
    if (!selectedElement) return;
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;
    
    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    if (saveToHistory) saveToHistory(newElements);
  }, [selectedElement, elements, setElements, setSelectedElement, saveToHistory]);

  const handleToggleLock = useCallback(() => {
    if (!selectedElement) return;
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;
    
    updateElement(selectedElement, { locked: !element.locked });
    const newElements = elements.map(el => 
      el.id === selectedElement ? { ...el, locked: !element.locked } : el
    );
    if (saveToHistory) saveToHistory(newElements);
    if (!element.locked) {
      setSelectedElement(null);
      setSelectedElements([]);
    }
  }, [selectedElement, elements, updateElement, setSelectedElement, saveToHistory]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElement) return;
    const newElements = elements.filter(el => el.id !== selectedElement);
    setElements(newElements);
    setSelectedElement(null);
    setSelectedElements([]);
    if (saveToHistory) saveToHistory(newElements);
  }, [selectedElement, elements, setElements, setSelectedElement, saveToHistory]);

  const handleDoubleClick = useCallback((e, elementId) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element?.type === 'text' && onStartTextEdit) {
      onStartTextEdit(elementId);
    }
  }, [elements, onStartTextEdit]);

  const handleResizeStart = useCallback((e, elementId, handle) => {
    e.stopPropagation();
    e.preventDefault();
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: element.x, 
      y: element.y, 
      width: element.width, 
      height: element.height,
      fontSize: element.type === 'text' ? (element.fontSize || 1) : null
    });
  }, [elements, setSelectedElement]);

  const handleRotateStart = useCallback((e, elementId) => {
    e.stopPropagation();
    e.preventDefault();
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    setIsRotating(true);
    setSelectedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: element.x, 
      y: element.y, 
      width: element.width, 
      height: element.height,
      rotation: element.rotation || 0 
    });
  }, [elements, setSelectedElement]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Handle marquee selection
      if (isMarqueeSelecting) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - panOffset.x - 64) / scale;
        const y = (e.clientY - rect.top - panOffset.y - 64) / scale;
        setMarqueeEnd({ x, y });
        return;
      }

      if (!isDragging && !isResizing && !isRotating) return;

      const element = elements.find(el => el.id === selectedElement);
      if (!element) return;

      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        // Check if we're doing a group drag (multiple elements selected)
        const activeSelection = selectedElements.length > 1 ? selectedElements : [selectedElement];
        
        if (activeSelection.length > 1 && Object.keys(groupDragStart).length > 0) {
          // Group drag - move all selected elements
          activeSelection.forEach(id => {
            const startPos = groupDragStart[id];
            if (startPos) {
              updateElement(id, { 
                x: startPos.x + dx, 
                y: startPos.y + dy 
              });
            }
          });
          setAlignmentGuides({ showVertical: false, showHorizontal: false });
        } else {
          // Single element drag with alignment guides
          let newX = elementStart.x + dx;
          let newY = elementStart.y + dy;
          
          // Calculate element center
          const elementCenterX = newX + element.width / 2;
          const elementCenterY = newY + element.height / 2;
          
          // Canvas center
          const canvasCenterX = width / 2;
          const canvasCenterY = height / 2;
          
          // Snap threshold (in inches)
          const threshold = 0.15;
          
          // Check alignment
          const isHorizontallyCentered = Math.abs(elementCenterX - canvasCenterX) < threshold;
          const isVerticallyCentered = Math.abs(elementCenterY - canvasCenterY) < threshold;
          
          // Snap to center if within threshold
          if (isHorizontallyCentered) {
            newX = canvasCenterX - element.width / 2;
          }
          if (isVerticallyCentered) {
            newY = canvasCenterY - element.height / 2;
          }
          
          setAlignmentGuides({
            showVertical: isHorizontallyCentered,
            showHorizontal: isVerticallyCentered,
          });
          
          updateElement(selectedElement, { x: newX, y: newY });
        }
      } else if (isResizing && resizeHandle) {
        let newWidth = elementStart.width;
        let newHeight = elementStart.height;
        let newX = elementStart.x;
        let newY = elementStart.y;

        const aspectRatio = elementStart.width / elementStart.height;
        const shiftKey = e.shiftKey;

        if (resizeHandle.includes('e')) newWidth = Math.max(1, elementStart.width + dx);
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(1, elementStart.width - dx);
          newX = elementStart.x + dx;
        }
        if (resizeHandle.includes('s')) newHeight = Math.max(1, elementStart.height + dy);
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(1, elementStart.height - dy);
          newY = elementStart.y + dy;
        }

        // Maintain aspect ratio with shift
        if (shiftKey && (element.type === 'image' || element.type === 'clipart')) {
          if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        // Scale font size proportionally for text elements ONLY with corner handles
        const isCornerHandle = ['nw', 'ne', 'sw', 'se'].includes(resizeHandle);
        
        if (element.type === 'text' && elementStart.fontSize && isCornerHandle) {
          const scaleX = newWidth / elementStart.width;
          const scaleY = newHeight / elementStart.height;
          const scaleFactor = Math.max(scaleX, scaleY);
          const newFontSize = Math.max(0.1, elementStart.fontSize * scaleFactor);
          updateElement(selectedElement, { width: newWidth, height: newHeight, x: newX, y: newY, fontSize: newFontSize });
        } else {
          updateElement(selectedElement, { width: newWidth, height: newHeight, x: newX, y: newY });
        }
      } else if (isRotating) {
        // Get canvas element position for accurate rotation calculation
        const canvasRect = containerRef.current?.getBoundingClientRect();
        if (!canvasRect) return;
        
        // Calculate element center in screen coordinates (accounting for pan offset and scale)
        const elementCenterX = canvasRect.left + canvasRect.width / 2 + panOffset.x + 
          (elementStart.x + elementStart.width / 2 - width / 2) * scale;
        const elementCenterY = canvasRect.top + canvasRect.height / 2 + panOffset.y + 
          (elementStart.y + elementStart.height / 2 - height / 2) * scale;
        
        // Calculate angle from element center to mouse position
        const angle = Math.atan2(e.clientY - elementCenterY, e.clientX - elementCenterX) * (180 / Math.PI) + 90;
        
        // Normalize rotation to 0-360 degrees for smooth continuous rotation
        let newRotation = ((angle % 360) + 360) % 360;
        
        // Optional: Snap to 15° increments when Shift is held for precise angles
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        
        updateElement(selectedElement, { rotation: newRotation });
      }
    };

    const handleMouseUp = (e) => {
      // Handle marquee selection completion
      if (isMarqueeSelecting) {
        const minX = Math.min(marqueeStart.x, marqueeEnd.x);
        const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
        const minY = Math.min(marqueeStart.y, marqueeEnd.y);
        const maxY = Math.max(marqueeStart.y, marqueeEnd.y);
        
        // Only select if the marquee has some size
        if (Math.abs(maxX - minX) > 0.5 || Math.abs(maxY - minY) > 0.5) {
          // Find all unlocked elements within the marquee rectangle
          const selectedIds = elements
            .filter(el => {
              if (el.locked) return false; // Skip locked elements
              
              // Check if element overlaps with marquee rectangle
              const elLeft = el.x;
              const elRight = el.x + el.width;
              const elTop = el.y;
              const elBottom = el.y + el.height;
              
              return elLeft < maxX && elRight > minX && 
                     elTop < maxY && elBottom > minY;
            })
            .map(el => el.id);
          
          if (selectedIds.length > 0) {
            if (e?.shiftKey) {
              // Additive selection with Shift
              setSelectedElements(prev => [...new Set([...prev, ...selectedIds])]);
            } else {
              setSelectedElements(selectedIds);
            }
            if (selectedIds.length === 1) {
              setSelectedElement(selectedIds[0]);
            } else {
              setSelectedElement(selectedIds[selectedIds.length - 1]);
            }
          }
        }
        
        setIsMarqueeSelecting(false);
        setMarqueeStart({ x: 0, y: 0 });
        setMarqueeEnd({ x: 0, y: 0 });
        return;
      }
      
      // Save to history when drag/resize/rotate operation completes
      if ((isDragging || isResizing || isRotating) && selectedElement && saveToHistory) {
        saveToHistory(elements);
      }
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeHandle(null);
      setIsPanning(false);
      setAlignmentGuides({ showVertical: false, showHorizontal: false });
      setGroupDragStart({});
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, isPanning, isMarqueeSelecting, selectedElement, selectedElements, dragStart, elementStart, resizeHandle, panStart, elements, scale, width, height, updateElement, groupDragStart, marqueeStart, marqueeEnd, panOffset, saveToHistory]);

  const handleCanvasClick = (e) => {
    // Don't clear selection if clicking on resize handles, rotate handle, or context menu
    if (e.target.closest('[data-resize-handle]') || e.target.closest('[data-rotate-handle]')) {
      return;
    }
    
    // Don't clear if clicking on an element
    if (e.target.closest('[data-element-id]')) {
      return;
    }
    
    // Clear selection when clicking on workspace background, canvas, or any non-element area
    if (!e.shiftKey) {
      setSelectedElement(null);
      setSelectedElements([]);
    }
    if (editingTextId && onEndTextEdit) {
      onEndTextEdit();
    }
  };

  const handleCanvasMouseDown = (e) => {
    // Check if clicking on canvas background (not on an element)
    const isOnElement = e.target.closest('[data-element-id]');
    const isOnResizeHandle = e.target.closest('[data-resize-handle]');
    const isOnRotateHandle = e.target.closest('[data-rotate-handle]');
    
    if (isOnElement || isOnResizeHandle || isOnRotateHandle) {
      return;
    }
    
    if (e.target === e.currentTarget || e.target.closest('[data-canvas-bg]')) {
      // Middle mouse or Alt+Click = panning
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }
      
      // Left click without Alt = start marquee selection
      if (e.button === 0) {
        // Close context menu
        setContextMenu(null);
        
        // Clear selection unless Shift is held
        if (!e.shiftKey) {
          setSelectedElements([]);
          setSelectedElement(null);
        }
        
        // Get position relative to canvas
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = (e.clientX - rect.left - panOffset.x - 64) / scale;
        const y = (e.clientY - rect.top - panOffset.y - 64) / scale;
        
        setIsMarqueeSelecting(true);
        setMarqueeStart({ x, y });
        setMarqueeEnd({ x, y });
      }
    }
  };

  // Keyboard shortcuts for delete and escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if editing text or typing in an input
      if (editingTextId || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Delete or Backspace = delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const toDelete = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
        if (toDelete.length > 0) {
          const newElements = elements.filter(el => !toDelete.includes(el.id));
          setElements(newElements);
          setSelectedElement(null);
          setSelectedElements([]);
          if (saveToHistory) saveToHistory(newElements);
        }
      }
      
      // Escape = clear selection
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setSelectedElements([]);
        setContextMenu(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTextId, selectedElement, selectedElements, elements, setElements, saveToHistory]);

  const renderElement = (element) => {
    const isSelected = selectedElement === element.id || selectedElements.includes(element.id);
    const isPrimarySelected = selectedElement === element.id;
    const isEditing = editingTextId === element.id;
    const elementIndex = elements.indexOf(element);

    const style = {
      position: 'absolute',
      left: element.x * scale,
      top: element.y * scale,
      width: element.width * scale,
      height: element.height * scale,
      transform: `rotate(${element.rotation || 0}deg)`,
      cursor: element.locked ? 'default' : isEditing ? 'text' : 'move',
      opacity: element.visible === false ? 0.3 : 1,
      // Keep element at its natural z-index position
      zIndex: elementIndex + 1,
      transformOrigin: 'center center',
    };

    let content = null;

    if (element.type === 'text') {
      if (isEditing) {
        content = (
          <textarea
            autoFocus
            value={element.text}
            onChange={(e) => onTextEditChange(element.id, e.target.value)}
            onBlur={() => onEndTextEdit()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full h-full resize-none border-none outline-none bg-white/95 p-1"
            style={{
              fontSize: element.fontSize * scale,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              color: element.color,
              textAlign: element.textAlign,
              lineHeight: element.lineHeight || 1.2,
            }}
          />
        );
      } else {
        content = (
          <div
            className="w-full h-full flex items-center overflow-hidden select-none p-0.5 break-words"
            style={{
              justifyContent: element.textAlign === 'center' ? 'center' : 
                             element.textAlign === 'right' ? 'flex-end' : 'flex-start',
              fontSize: element.fontSize * scale,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              color: element.color,
              textAlign: element.textAlign,
              lineHeight: element.lineHeight || 1.2,
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              textShadow: element.textShadow || 'none',
              WebkitTextStroke: element.textStroke || 'none',
              pointerEvents: 'none',
            }}
          >
            {element.text}
          </div>
        );
      }
    } else if (element.type === 'image' || element.type === 'clipart') {
      content = (
        <img
          src={element.src}
          alt=""
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{
            filter: element.filter || 'none',
            opacity: element.opacity ?? 1,
          }}
          draggable={false}
        />
      );
    } else if (element.type === 'shape') {
      // Clip-path definitions for complex shapes
      const SHAPE_CLIP_PATHS = {
        // Basic shapes
        triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        heart: 'polygon(50% 85%, 15% 55%, 5% 35%, 10% 15%, 25% 5%, 40% 10%, 50% 25%, 60% 10%, 75% 5%, 90% 15%, 95% 35%, 85% 55%)',
        octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        // Basic arrows (from lucide icons)
        'arrow-right': 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
        'arrow-left': 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)',
        'arrow-up': 'polygon(50% 0%, 100% 40%, 80% 40%, 80% 100%, 20% 100%, 20% 40%, 0% 40%)',
        'arrow-down': 'polygon(20% 0%, 80% 0%, 80% 60%, 100% 60%, 50% 100%, 0% 60%, 20% 60%)',
        'double-arrow': 'polygon(0% 50%, 15% 20%, 15% 40%, 85% 40%, 85% 20%, 100% 50%, 85% 80%, 85% 60%, 15% 60%, 15% 80%)',
        // Basic Arrows - Simple directional
        'arrow-simple-right': 'polygon(12% 45%, 62% 45%, 62% 30%, 88% 50%, 62% 70%, 62% 55%, 12% 55%)',
        'arrow-simple-left': 'polygon(88% 45%, 38% 45%, 38% 30%, 12% 50%, 38% 70%, 38% 55%, 88% 55%)',
        'arrow-simple-up': 'polygon(45% 88%, 45% 38%, 30% 38%, 50% 12%, 70% 38%, 55% 38%, 55% 88%)',
        'arrow-simple-down': 'polygon(45% 12%, 45% 62%, 30% 62%, 50% 88%, 70% 62%, 55% 62%, 55% 12%)',
        // Block arrows
        'arrow-block-right': 'polygon(5% 35%, 60% 35%, 60% 15%, 95% 50%, 60% 85%, 60% 65%, 5% 65%)',
        'arrow-block-left': 'polygon(95% 35%, 40% 35%, 40% 15%, 5% 50%, 40% 85%, 40% 65%, 95% 65%)',
        'arrow-block-up': 'polygon(35% 95%, 35% 40%, 15% 40%, 50% 5%, 85% 40%, 65% 40%, 65% 95%)',
        'arrow-block-down': 'polygon(35% 5%, 35% 60%, 15% 60%, 50% 95%, 85% 60%, 65% 60%, 65% 5%)',
        // Multi-directional arrows
        'arrow-4way': 'polygon(50% 5%, 65% 25%, 55% 25%, 55% 45%, 75% 45%, 75% 35%, 95% 50%, 75% 65%, 75% 55%, 55% 55%, 55% 75%, 65% 75%, 50% 95%, 35% 75%, 45% 75%, 45% 55%, 25% 55%, 25% 65%, 5% 50%, 25% 35%, 25% 45%, 45% 45%, 45% 25%, 35% 25%)',
        'arrow-horizontal': 'polygon(5% 50%, 25% 35%, 25% 45%, 75% 45%, 75% 35%, 95% 50%, 75% 65%, 75% 55%, 25% 55%, 25% 65%)',
        'arrow-vertical': 'polygon(50% 5%, 65% 25%, 55% 25%, 55% 75%, 65% 75%, 50% 95%, 35% 75%, 45% 75%, 45% 25%, 35% 25%)',
        // Bent/corner arrows
        'arrow-bent-right': 'polygon(10% 10%, 10% 50%, 20% 50%, 20% 20%, 70% 20%, 70% 10%, 90% 30%, 70% 50%, 70% 30%, 10% 30%)',
        'arrow-bent-left': 'polygon(90% 10%, 90% 50%, 80% 50%, 80% 20%, 30% 20%, 30% 10%, 10% 30%, 30% 50%, 30% 30%, 90% 30%)',
        'arrow-bent-up': 'polygon(90% 90%, 50% 90%, 50% 80%, 80% 80%, 80% 30%, 70% 30%, 90% 10%, 90% 30%, 70% 30%)',
        'arrow-corner-up': 'polygon(10% 90%, 10% 80%, 70% 80%, 70% 30%, 60% 30%, 80% 10%, 100% 30%, 90% 30%, 90% 90%)',
        'arrow-corner-down': 'polygon(10% 10%, 10% 20%, 70% 20%, 70% 70%, 60% 70%, 80% 90%, 100% 70%, 90% 70%, 90% 10%)',
        // Curved arrows
        'arrow-uturn-right': 'polygon(20% 80%, 20% 40%, 30% 30%, 50% 30%, 70% 30%, 80% 40%, 80% 55%, 70% 55%, 80% 75%, 90% 55%, 80% 55%, 80% 40%, 70% 30%, 30% 30%, 30% 80%)',
        'arrow-uturn-left': 'polygon(80% 80%, 80% 40%, 70% 30%, 50% 30%, 30% 30%, 20% 40%, 20% 55%, 30% 55%, 20% 75%, 10% 55%, 20% 55%, 20% 40%, 30% 30%, 70% 30%, 70% 80%)',
        'arrow-circular': 'polygon(50% 10%, 60% 25%, 55% 25%, 70% 50%, 55% 75%, 60% 75%, 50% 90%, 40% 75%, 45% 75%, 30% 50%, 45% 25%, 40% 25%)',
        'arrow-refresh': 'polygon(85% 50%, 75% 30%, 75% 40%, 60% 40%, 50% 50%, 60% 60%, 75% 60%, 75% 70%, 85% 50%, 15% 50%, 25% 70%, 25% 60%, 40% 60%, 50% 50%, 40% 40%, 25% 40%, 25% 30%, 15% 50%)',
        // Chevrons
        'chevron-right': 'polygon(20% 10%, 70% 50%, 20% 90%, 35% 50%)',
        'chevron-left': 'polygon(80% 10%, 30% 50%, 80% 90%, 65% 50%)',
        'chevron-double': 'polygon(10% 10%, 45% 50%, 10% 90%, 25% 50%, 45% 10%, 80% 50%, 45% 90%, 60% 50%)',
        'chevron-triple': 'polygon(5% 15%, 30% 50%, 5% 85%, 15% 50%, 30% 15%, 55% 50%, 30% 85%, 40% 50%, 55% 15%, 80% 50%, 55% 85%, 65% 50%)',
        // Pentagon/tag arrows
        'arrow-pentagon': 'polygon(10% 20%, 75% 20%, 95% 50%, 75% 80%, 10% 80%)',
        'arrow-tag': 'polygon(10% 20%, 75% 20%, 95% 50%, 75% 80%, 10% 80%, 25% 50%)',
        'arrow-notched': 'polygon(10% 10%, 75% 10%, 95% 50%, 75% 90%, 10% 90%, 30% 50%)',
        'arrow-striped': 'polygon(10% 40%, 10% 60%, 25% 60%, 25% 40%, 35% 40%, 35% 60%, 50% 60%, 50% 40%, 60% 40%, 60% 60%, 70% 60%, 70% 30%, 90% 50%, 70% 70%, 70% 40%)',
        // Stars
        'star-4point': 'polygon(50% 5%, 60% 40%, 95% 50%, 60% 60%, 50% 95%, 40% 60%, 5% 50%, 40% 40%)',
        'star-5point': 'polygon(50% 5%, 60% 35%, 95% 35%, 68% 55%, 79% 90%, 50% 70%, 21% 90%, 32% 55%, 5% 35%, 40% 35%)',
        'star-6point': 'polygon(50% 5%, 60% 35%, 90% 20%, 70% 45%, 90% 70%, 60% 60%, 50% 95%, 40% 60%, 10% 70%, 30% 45%, 10% 20%, 40% 35%)',
        'star-8point': 'polygon(50% 5%, 58% 33%, 80% 15%, 67% 40%, 95% 50%, 67% 60%, 80% 85%, 58% 67%, 50% 95%, 42% 67%, 20% 85%, 33% 60%, 5% 50%, 33% 40%, 20% 15%, 42% 33%)',
        'star-12point': 'polygon(50% 5%, 55% 28%, 70% 10%, 65% 33%, 90% 25%, 75% 43%, 95% 50%, 75% 58%, 90% 75%, 65% 68%, 70% 90%, 55% 73%, 50% 95%, 45% 73%, 30% 90%, 35% 68%, 10% 75%, 25% 58%, 5% 50%, 25% 43%, 10% 25%, 35% 33%, 30% 10%, 45% 28%)',
        'star-burst': 'polygon(50% 0%, 57% 35%, 98% 20%, 65% 45%, 100% 50%, 65% 55%, 98% 80%, 57% 65%, 50% 100%, 43% 65%, 2% 80%, 35% 55%, 0% 50%, 35% 45%, 2% 20%, 43% 35%)',
        'star-sparkle': 'polygon(50% 10%, 55% 40%, 85% 35%, 60% 50%, 85% 65%, 55% 60%, 50% 90%, 45% 60%, 15% 65%, 40% 50%, 15% 35%, 45% 40%)',
        // Flowers
        'flower-4petal': 'polygon(50% 10%, 65% 30%, 90% 50%, 65% 70%, 50% 90%, 35% 70%, 10% 50%, 35% 30%)',
        'flower-5petal': 'polygon(50% 10%, 60% 30%, 85% 30%, 70% 50%, 85% 70%, 60% 70%, 50% 90%, 40% 70%, 15% 70%, 30% 50%, 15% 30%, 40% 30%)',
        'flower-6petal': 'polygon(50% 5%, 60% 25%, 90% 20%, 70% 45%, 80% 80%, 55% 60%, 50% 95%, 45% 60%, 20% 80%, 30% 45%, 10% 20%, 40% 25%)',
        'flower-8petal': 'polygon(50% 5%, 55% 33%, 85% 10%, 68% 38%, 95% 50%, 68% 62%, 85% 90%, 55% 68%, 50% 95%, 45% 68%, 15% 90%, 32% 62%, 5% 50%, 32% 38%, 15% 10%, 45% 33%)',
        'flower-tulip': 'polygon(50% 10%, 70% 20%, 70% 45%, 70% 80%, 55% 80%, 55% 95%, 45% 95%, 45% 80%, 30% 80%, 30% 45%, 30% 20%)',
        // Hearts
        'heart-simple': 'polygon(50% 90%, 15% 55%, 5% 35%, 10% 18%, 25% 10%, 40% 15%, 50% 30%, 60% 15%, 75% 10%, 90% 18%, 95% 35%, 85% 55%)',
        'heart-rounded': 'polygon(50% 85%, 20% 60%, 20% 40%, 25% 25%, 35% 20%, 45% 25%, 50% 35%, 55% 25%, 65% 20%, 75% 25%, 80% 40%, 80% 60%)',
        'heart-double': 'polygon(30% 70%, 10% 45%, 10% 30%, 18% 20%, 30% 30%, 30% 35%, 38% 25%, 45% 35%, 45% 50%, 30% 70%, 70% 70%, 50% 45%, 50% 30%, 58% 20%, 70% 30%, 70% 35%, 78% 25%, 85% 35%, 85% 50%, 70% 70%)',
        // Weather
        'cloud': 'polygon(80% 70%, 25% 70%, 10% 70%, 10% 55%, 15% 40%, 25% 35%, 35% 30%, 45% 25%, 55% 25%, 70% 30%, 80% 35%, 90% 45%, 95% 55%, 90% 70%)',
        'sun': 'polygon(50% 30%, 60% 35%, 70% 25%, 65% 40%, 85% 50%, 65% 60%, 70% 75%, 60% 65%, 50% 70%, 40% 65%, 30% 75%, 35% 60%, 15% 50%, 35% 40%, 30% 25%, 40% 35%)',
        'sun-rays': 'polygon(50% 25%, 57% 35%, 75% 25%, 63% 40%, 90% 50%, 63% 60%, 75% 75%, 57% 63%, 50% 75%, 43% 63%, 25% 75%, 37% 60%, 10% 50%, 37% 40%, 25% 25%, 43% 35%)',
        'moon-crescent': 'polygon(60% 10%, 40% 20%, 30% 40%, 30% 60%, 40% 80%, 60% 90%, 45% 85%, 25% 70%, 15% 50%, 25% 30%, 45% 15%)',
        'lightning': 'polygon(60% 5%, 35% 45%, 50% 45%, 30% 95%, 70% 50%, 55% 50%)',
        'snowflake': 'polygon(50% 5%, 52% 48%, 95% 27%, 52% 52%, 95% 73%, 52% 52%, 50% 95%, 48% 52%, 5% 73%, 48% 52%, 5% 27%, 48% 48%)',
        'raindrop': 'polygon(50% 10%, 30% 50%, 25% 65%, 30% 80%, 40% 90%, 50% 90%, 60% 90%, 70% 80%, 75% 65%, 70% 50%)',
        // Misc decorations
        'location-pin': 'polygon(50% 5%, 75% 25%, 80% 45%, 70% 65%, 50% 95%, 30% 65%, 20% 45%, 25% 25%)',
        'smiley': 'ellipse(45% 45% at 50% 50%)',
        'cross-plus': 'polygon(40% 10%, 60% 10%, 60% 40%, 90% 40%, 90% 60%, 60% 60%, 60% 90%, 40% 90%, 40% 60%, 10% 60%, 10% 40%, 40% 40%)',
        'cross-x': 'polygon(20% 10%, 50% 40%, 80% 10%, 90% 20%, 60% 50%, 90% 80%, 80% 90%, 50% 60%, 20% 90%, 10% 80%, 40% 50%, 10% 20%)',
        'checkmark': 'polygon(10% 50%, 35% 75%, 90% 20%, 80% 10%, 35% 55%, 20% 40%)',
        'clover': 'polygon(50% 20%, 65% 10%, 75% 15%, 80% 30%, 70% 45%, 80% 50%, 90% 60%, 85% 75%, 70% 80%, 55% 70%, 50% 80%, 50% 95%, 50% 80%, 45% 70%, 30% 80%, 15% 75%, 10% 60%, 20% 50%, 30% 45%, 20% 30%, 25% 15%, 35% 10%)',
        // Flowchart shapes
        'flow-process': 'polygon(10% 20%, 90% 20%, 90% 80%, 10% 80%)',
        'flow-decision': 'polygon(50% 10%, 95% 50%, 50% 90%, 5% 50%)',
        'flow-terminal': 'polygon(25% 20%, 75% 20%, 95% 50%, 75% 80%, 25% 80%, 5% 50%)',
        'flow-data': 'polygon(20% 20%, 90% 20%, 80% 80%, 10% 80%)',
        'flow-document': 'polygon(10% 15%, 90% 15%, 90% 75%, 50% 90%, 10% 75%)',
        'flow-multi-doc': 'polygon(20% 5%, 95% 5%, 95% 65%, 85% 75%, 15% 75%, 10% 80%, 5% 70%, 5% 15%)',
        'flow-database': 'ellipse(45% 15% at 50% 20%)',
        'flow-cylinder': 'polygon(10% 20%, 10% 80%, 50% 95%, 90% 80%, 90% 20%, 50% 35%)',
        'flow-disk': 'polygon(10% 25%, 90% 25%, 90% 75%, 50% 90%, 10% 75%)',
        'flow-predefined': 'polygon(10% 20%, 90% 20%, 90% 80%, 10% 80%, 10% 20%, 20% 20%, 20% 80%, 80% 80%, 80% 20%)',
        'flow-manual': 'polygon(5% 20%, 95% 20%, 85% 80%, 15% 80%)',
        'flow-preparation': 'polygon(25% 20%, 75% 20%, 95% 50%, 75% 80%, 25% 80%, 5% 50%)',
        'flow-internal': 'polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%)',
        'flow-connector': 'ellipse(45% 45% at 50% 50%)',
        'flow-off-page': 'polygon(10% 10%, 90% 10%, 90% 70%, 50% 90%, 10% 70%)',
        'flow-summing': 'polygon(50% 10%, 90% 50%, 50% 90%, 10% 50%)',
        'flow-delay': 'polygon(10% 20%, 70% 20%, 90% 50%, 70% 80%, 10% 80%)',
        'flow-display': 'polygon(20% 20%, 80% 20%, 95% 50%, 80% 80%, 20% 80%, 10% 50%)',
        'flow-merge': 'polygon(10% 10%, 90% 10%, 50% 90%)',
        'flow-extract': 'polygon(50% 10%, 90% 90%, 10% 90%)',
        'flow-sort': 'polygon(50% 10%, 90% 50%, 50% 90%, 10% 50%)',
        'flow-collate': 'polygon(10% 10%, 90% 10%, 10% 90%, 90% 90%)',
        'pie-half': 'polygon(50% 50%, 50% 10%, 90% 30%, 90% 70%, 50% 90%)',
        'pie-quarter': 'polygon(50% 50%, 50% 10%, 90% 50%)',
        'pie-3quarter': 'polygon(50% 50%, 50% 10%, 90% 30%, 90% 70%, 50% 90%, 10% 70%, 10% 50%)',
        // Blobs and atypical shapes
        'blob-1': 'polygon(70% 15%, 90% 35%, 85% 60%, 55% 90%, 20% 85%, 10% 55%, 15% 25%, 45% 5%)',
        'blob-2': 'polygon(80% 30%, 95% 55%, 75% 85%, 40% 95%, 10% 75%, 5% 40%, 25% 15%, 60% 5%)',
        'blob-3': 'polygon(65% 10%, 95% 25%, 90% 60%, 70% 90%, 30% 95%, 5% 70%, 10% 30%, 40% 5%)',
        'blob-4': 'polygon(75% 20%, 90% 45%, 80% 80%, 45% 95%, 10% 80%, 5% 45%, 20% 15%, 55% 5%)',
        'blob-5': 'polygon(60% 15%, 90% 30%, 85% 65%, 55% 90%, 20% 85%, 10% 50%, 20% 20%, 45% 5%)',
        'blob-6': 'polygon(70% 10%, 95% 35%, 90% 70%, 60% 95%, 20% 90%, 5% 55%, 15% 20%, 45% 5%)',
        'blob-7': 'polygon(50% 5%, 85% 15%, 95% 50%, 80% 85%, 45% 95%, 10% 80%, 5% 45%, 20% 15%)',
        'blob-8': 'polygon(65% 20%, 90% 40%, 80% 80%, 45% 95%, 10% 75%, 5% 40%, 25% 10%, 55% 5%)',
        'abstract-flower': 'polygon(50% 20%, 65% 5%, 80% 20%, 95% 35%, 80% 50%, 95% 65%, 80% 80%, 65% 95%, 50% 80%, 35% 95%, 20% 80%, 5% 65%, 20% 50%, 5% 35%, 20% 20%, 35% 5%)',
        'abstract-star': 'polygon(50% 10%, 60% 35%, 85% 35%, 65% 55%, 80% 85%, 50% 65%, 20% 85%, 35% 55%, 15% 35%, 40% 35%)',
        'abstract-clover': 'polygon(50% 40%, 65% 25%, 80% 40%, 65% 55%, 80% 70%, 55% 70%, 55% 95%, 45% 95%, 45% 70%, 20% 70%, 35% 55%, 20% 40%, 35% 25%)',
        'abstract-plus': 'polygon(35% 5%, 65% 5%, 65% 35%, 95% 35%, 95% 65%, 65% 65%, 65% 95%, 35% 95%, 35% 65%, 5% 65%, 5% 35%, 35% 35%)',
        'squiggle-wave': 'polygon(5% 50%, 15% 25%, 25% 50%, 35% 25%, 45% 50%, 55% 25%, 65% 50%, 75% 25%, 85% 50%, 95% 25%, 95% 70%, 85% 45%, 75% 70%, 65% 45%, 55% 70%, 45% 45%, 35% 70%, 25% 45%, 15% 70%, 5% 45%)',
        'squiggle-s': 'polygon(20% 10%, 80% 10%, 80% 30%, 40% 30%, 40% 50%, 80% 50%, 80% 90%, 20% 90%, 20% 70%, 60% 70%, 60% 50%, 20% 50%)',
        'organic-oval': 'polygon(50% 10%, 85% 20%, 95% 50%, 85% 80%, 50% 90%, 15% 80%, 5% 50%, 15% 20%)',
        'organic-pill': 'polygon(30% 20%, 70% 20%, 95% 50%, 70% 80%, 30% 80%, 5% 50%)',
        'organic-pebble': 'polygon(45% 10%, 80% 15%, 90% 45%, 75% 80%, 40% 95%, 15% 75%, 5% 45%, 20% 15%)',
        'speech-modern': 'polygon(15% 5%, 85% 5%, 85% 60%, 35% 60%, 20% 90%, 25% 60%, 15% 60%)',
        'badge-ribbon': 'polygon(20% 10%, 80% 10%, 90% 20%, 90% 70%, 80% 60%, 70% 70%, 60% 60%, 50% 70%, 40% 60%, 30% 70%, 20% 60%, 10% 70%, 10% 20%)',
        'seal-star': 'polygon(50% 5%, 58% 30%, 85% 25%, 65% 45%, 90% 65%, 63% 65%, 55% 95%, 50% 70%, 45% 95%, 37% 65%, 10% 65%, 35% 45%, 15% 25%, 42% 30%)',
        'zigzag-arrow': 'polygon(5% 50%, 25% 25%, 45% 50%, 65% 25%, 85% 50%, 75% 50%, 65% 40%, 45% 65%, 25% 40%, 15% 50%)',
        'wave-double': 'polygon(5% 35%, 20% 20%, 35% 35%, 50% 20%, 65% 35%, 80% 20%, 95% 35%, 95% 45%, 80% 60%, 65% 45%, 50% 60%, 35% 45%, 20% 60%, 5% 45%, 5% 55%, 20% 40%, 35% 55%, 50% 40%, 65% 55%, 80% 40%, 95% 55%, 95% 70%, 80% 85%, 65% 70%, 50% 85%, 35% 70%, 20% 85%, 5% 70%)',
        'geo-hexagon': 'polygon(50% 5%, 90% 28%, 90% 72%, 50% 95%, 10% 72%, 10% 28%)',
        'geo-diamond': 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
        // Speech Bubbles
        'speech-round-bl': 'polygon(10% 10%, 90% 10%, 90% 70%, 40% 70%, 15% 95%, 25% 70%, 10% 70%)',
        'speech-round-br': 'polygon(10% 10%, 90% 10%, 90% 70%, 75% 70%, 85% 95%, 60% 70%, 10% 70%)',
        'speech-round-bc': 'polygon(5% 10%, 95% 10%, 95% 65%, 60% 65%, 50% 95%, 40% 65%, 5% 65%)',
        'speech-rect-bl': 'polygon(0% 0%, 100% 0%, 100% 75%, 35% 75%, 15% 100%, 25% 75%, 0% 75%)',
        'speech-rect-br': 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 85% 100%, 65% 75%, 0% 75%)',
        'speech-rect-bc': 'polygon(0% 0%, 100% 0%, 100% 70%, 60% 70%, 50% 100%, 40% 70%, 0% 70%)',
        'speech-rect-fold': 'polygon(0% 0%, 85% 0%, 100% 15%, 100% 100%, 0% 100%)',
        // Thought clouds
        'thought-cloud': 'ellipse(45% 35% at 50% 40%)',
        'cloud-bubble': 'polygon(15% 60%, 5% 45%, 10% 25%, 25% 15%, 50% 10%, 75% 15%, 90% 25%, 95% 45%, 85% 60%, 70% 70%, 30% 70%)',
        'cloud-bumpy': 'polygon(20% 70%, 5% 50%, 10% 25%, 30% 10%, 50% 5%, 70% 10%, 90% 25%, 95% 50%, 80% 70%)',
        // Callouts
        'callout-left': 'polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 0% 50%)',
        'callout-right': 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)',
        // Ribbons & Banners
        'ribbon-wave': 'polygon(0% 20%, 10% 0%, 10% 20%, 90% 20%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 90% 80%, 10% 80%, 10% 100%, 0% 80%)',
        'ribbon-banner': 'polygon(0% 10%, 100% 10%, 100% 70%, 85% 70%, 100% 100%, 75% 70%, 25% 70%, 0% 100%, 15% 70%, 0% 70%)',
        'ribbon-scroll': 'polygon(15% 20%, 85% 20%, 95% 10%, 95% 30%, 85% 20%, 85% 80%, 95% 70%, 95% 90%, 85% 80%, 15% 80%, 5% 90%, 5% 70%, 15% 80%, 15% 20%, 5% 30%, 5% 10%)',
        'badge-shield': 'polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%)',
        // Brackets
        'bracket-left': 'polygon(40% 10%, 20% 10%, 20% 45%, 10% 50%, 20% 55%, 20% 90%, 40% 90%, 40% 80%, 30% 80%, 30% 58%, 20% 50%, 30% 42%, 30% 20%, 40% 20%)',
        'bracket-curly': 'polygon(35% 10%, 25% 10%, 20% 15%, 20% 42%, 10% 50%, 20% 58%, 20% 85%, 25% 90%, 35% 90%, 35% 82%, 30% 82%, 28% 80%, 28% 60%, 18% 50%, 28% 40%, 28% 20%, 30% 18%, 35% 18%)',
        'bracket-round': 'polygon(35% 10%, 20% 25%, 15% 50%, 20% 75%, 35% 90%, 35% 80%, 25% 70%, 22% 50%, 25% 30%, 35% 20%)',
        // Decorative frames
        'frame-scallop': 'polygon(50% 5%, 60% 15%, 85% 10%, 80% 25%, 95% 35%, 85% 50%, 95% 65%, 80% 75%, 85% 90%, 60% 85%, 50% 95%, 40% 85%, 15% 90%, 20% 75%, 5% 65%, 15% 50%, 5% 35%, 20% 25%, 15% 10%, 40% 15%)',
        'frame-ticket': 'polygon(10% 10%, 90% 10%, 90% 35%, 95% 40%, 95% 60%, 90% 65%, 90% 90%, 10% 90%, 10% 65%, 5% 60%, 5% 40%, 10% 35%)',
        'starburst': 'polygon(50% 0%, 57% 35%, 98% 20%, 65% 45%, 100% 50%, 65% 55%, 98% 80%, 57% 65%, 50% 100%, 43% 65%, 2% 80%, 35% 55%, 0% 50%, 35% 45%, 2% 20%, 43% 35%)',
      };
      
      // Handle border radius - can be numeric from SVG parser or string
      let borderRadius = 0;
      if (element.shape === 'circle') {
        borderRadius = '50%';
      } else if (element.shape === 'rounded-rect') {
        borderRadius = element.borderRadius ? `${element.borderRadius * scale}px` : '12px';
      } else if (element.borderRadius) {
        borderRadius = `${element.borderRadius * scale}px`;
      }

      // Check if this is a line shape
      const isLine = element.shape === 'line-h' || element.shape === 'line-v';

      // If shape has an SVG path (for shapes with curves like arches), render using inline SVG
      if (element.svgPath) {
        content = (
          <svg 
            viewBox="0 0 40 40" 
            className="w-full h-full"
            style={{ pointerEvents: 'none' }}
            preserveAspectRatio="none"
          >
            <path 
              d={element.svgPath} 
              fill={element.fill || '#3B82F6'}
              stroke={element.stroke && element.stroke !== 'none' ? element.stroke : 'none'}
              strokeWidth={element.strokeWidth || 0}
            />
          </svg>
        );
      } else {
        const shapeStyle = {
          width: '100%',
          height: '100%',
          backgroundColor: element.fill || '#3B82F6',
          border: element.stroke && element.stroke !== 'none' 
            ? `${(element.strokeWidth || 2) * scale}px solid ${element.stroke}` 
            : 'none',
          borderRadius: isLine ? '4px' : borderRadius,
          clipPath: SHAPE_CLIP_PATHS[element.shape] || undefined,
          opacity: element.opacity ?? 1,
          boxShadow: element.shadow || 'none',
          pointerEvents: 'none',
        };
        content = <div style={shapeStyle} />;
      }
    }

    return (
      <div
        key={element.id}
        data-element-id={element.id}
        data-locked={element.locked ? 'true' : 'false'}
        style={style}
        onClick={(e) => { 
          e.stopPropagation(); 
          if (!element.locked && !e.shiftKey) {
            setSelectedElement(element.id);
            setSelectedElements([element.id]);
          }
        }}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        onDoubleClick={(e) => handleDoubleClick(e, element.id)}
        onContextMenu={(e) => handleContextMenu(e, element.id)}
      >
        {content}

        {/* Selection UI - elevated above other elements */}
        {isSelected && !element.locked && !isEditing && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
            {/* Selection border */}
            <div 
              className="absolute inset-0 border-2 rounded-sm"
              style={{ borderColor: isPrimarySelected ? '#3B82F6' : '#60A5FA' }}
            />
            
            {/* Only show resize/rotate handles for primary selected element */}
            {isPrimarySelected && (
              <>
                {/* Resize handles */}
                {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
                  const positions = {
                    nw: { top: -6, left: -6, cursor: 'nw-resize' },
                    n: { top: -6, left: '50%', marginLeft: -6, cursor: 'n-resize' },
                    ne: { top: -6, right: -6, cursor: 'ne-resize' },
                    e: { top: '50%', right: -6, marginTop: -6, cursor: 'e-resize' },
                    se: { bottom: -6, right: -6, cursor: 'se-resize' },
                    s: { bottom: -6, left: '50%', marginLeft: -6, cursor: 's-resize' },
                    sw: { bottom: -6, left: -6, cursor: 'sw-resize' },
                    w: { top: '50%', left: -6, marginTop: -6, cursor: 'w-resize' },
                  };
                  return (
                    <div
                      key={handle}
                      data-resize-handle={handle}
                      className="absolute w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-500 hover:scale-125 transition-transform"
                      style={{ ...positions[handle], cursor: positions[handle].cursor, pointerEvents: 'auto' }}
                      onMouseDown={(e) => handleResizeStart(e, element.id, handle)}
                    />
                  );
                })}

                {/* Rotation handle */}
                <div
                  data-rotate-handle="true"
                  className="absolute -bottom-10 left-1/2 -ml-4 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center cursor-grab hover:scale-110 transition-transform"
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleRotateStart(e, element.id)}
                >
                  <RotateCw className="w-4 h-4 text-blue-500" />
                </div>
                <div className="absolute -bottom-10 left-1/2 w-px h-6 bg-blue-500 -ml-px" style={{ bottom: -24 }} />

                {/* Floating toolbar removed - rendered separately */}
              </>
            )}
          </div>
        )}

        {isEditing && (
          <div 
            className="absolute inset-0 border-2 pointer-events-none" 
            style={{ borderColor: '#22C55E', zIndex: 9999 }} 
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto bg-gray-100 relative"
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[10000] min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleBringToFront}
          >
            <ArrowUpToLine className="w-4 h-4" />
            Bring to Front
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleSendToBack}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Send to Back
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleCenterOnCanvas}
          >
            <Crosshair className="w-4 h-4" />
            Center on Canvas
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              handleToggleLock();
              setContextMenu(null);
            }}
          >
            {elements.find(el => el.id === selectedElement)?.locked ? (
              <>
                <Unlock className="w-4 h-4" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Lock
              </>
            )}
          </button>
        </div>
      )}

      {/* Solid background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: '#F2F3F6' }}
      />

      <div 
        className="flex items-center justify-center min-h-full min-w-full p-16"
        style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
      >
        {/* Canvas container */}
        <div ref={canvasContainerRef} className="relative">
          {/* Bleed area */}
          {showBleed && (
            <div
              className="absolute border border-dashed border-gray-300"
              style={{
                top: -bleedSize,
                left: -bleedSize,
                width: canvasPixelWidth + bleedSize * 2,
                height: canvasPixelHeight + bleedSize * 2,
              }}
            />
          )}

          {/* Main canvas with overflow hidden to clip elements */}
          <div
            data-canvas-bg
            className="relative bg-white overflow-hidden"
            style={{
              width: canvasPixelWidth,
              height: canvasPixelHeight,
            }}
          >
            {/* Grid */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: `${scale}px ${scale}px`,
                }}
              />
            )}

            {/* Safe zone indicator */}
            <div
              className="absolute pointer-events-none border border-dashed border-blue-300 opacity-50"
              style={{
                top: 0.5 * scale,
                left: 0.5 * scale,
                right: 0.5 * scale,
                bottom: 0.5 * scale,
              }}
            />

            {/* Center alignment guides */}
            {alignmentGuides.showVertical && (
              <div 
                className="absolute top-0 bottom-0 w-px pointer-events-none z-[50]"
                style={{ left: canvasPixelWidth / 2, backgroundColor: '#EC4899' }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded text-white whitespace-nowrap" style={{ backgroundColor: '#EC4899' }}>
                  Center
                </div>
              </div>
            )}
            {alignmentGuides.showHorizontal && (
              <div 
                className="absolute left-0 right-0 h-px pointer-events-none z-[50]"
                style={{ top: canvasPixelHeight / 2, backgroundColor: '#EC4899' }}
              >
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded text-white whitespace-nowrap" style={{ backgroundColor: '#EC4899' }}>
                  Center
                </div>
              </div>
            )}
            {alignmentGuides.showVertical && alignmentGuides.showHorizontal && (
              <div 
                className="absolute w-3 h-3 rounded-full pointer-events-none z-[51] -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: canvasPixelWidth / 2, 
                  top: canvasPixelHeight / 2,
                  backgroundColor: '#EC4899',
                }}
              />
            )}

            {/* Elements */}
            {elements.filter(el => el.visible !== false).map(renderElement)}

            {/* Marquee Selection Rectangle */}
            {isMarqueeSelecting && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-[9999]"
                style={{
                  left: Math.min(marqueeStart.x, marqueeEnd.x) * scale,
                  top: Math.min(marqueeStart.y, marqueeEnd.y) * scale,
                  width: Math.abs(marqueeEnd.x - marqueeStart.x) * scale,
                  height: Math.abs(marqueeEnd.y - marqueeStart.y) * scale,
                }}
              />
            )}

            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                <div className="text-6xl mb-4">🎨</div>
                <div className="text-xl font-medium mb-2">Start your design</div>
                <p className="text-sm">Add text, images, or shapes from the left panel</p>
              </div>
            )}

            {/* Edge direction indicators */}
            {offCanvasInfo.hasLeft && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-amber-500 text-white p-1.5 rounded-r-md z-[100] shadow-lg">
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
            {offCanvasInfo.hasRight && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-amber-500 text-white p-1.5 rounded-l-md z-[100] shadow-lg">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
            {offCanvasInfo.hasTop && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white p-1.5 rounded-b-md z-[100] shadow-lg">
                <ChevronUp className="w-4 h-4" />
              </div>
            )}
            {offCanvasInfo.hasBottom && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white p-1.5 rounded-t-md z-[100] shadow-lg">
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
            {/* Floating toolbar removed - rendered at main container level */}
          </div>

          {/* Floating recovery panel */}
          {offCanvasInfo.offElements.length > 0 && (
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 shadow-lg z-[100] flex items-center gap-3 whitespace-nowrap">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-amber-800 font-medium text-sm">
                {offCanvasInfo.offElements.length} element{offCanvasInfo.offElements.length > 1 ? 's' : ''} off canvas
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={bringAllToCanvas}
                className="border-amber-400 text-amber-700 hover:bg-amber-100 h-7 text-xs"
              >
                <Crosshair className="w-3 h-3 mr-1" /> Bring All Back
              </Button>
            </div>
          )}

          {/* Size indicator */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
            {width}" × {height}"
          </div>
        </div>
      </div>

      {/* Floating toolbar - rendered outside canvas at main container level */}
      {selectedElement && !elements.find(el => el.id === selectedElement)?.locked && (() => {
        const element = elements.find(el => el.id === selectedElement);
        if (!element || !canvasContainerRef.current) return null;
        
        const canvasRect = canvasContainerRef.current.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        
        // Element position in viewport coordinates
        const elementVisualX = canvasRect.left + element.x * scale;
        const elementVisualY = canvasRect.top + element.y * scale;
        const elementVisualWidth = element.width * scale;
        const elementVisualHeight = element.height * scale;
        
        // Toolbar positioned to the right of the element with 8px gap
        const toolbarX = elementVisualX + elementVisualWidth + 8;
        const toolbarY = elementVisualY;
        
        return (
          <div 
            className="fixed flex flex-col items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5"
            style={{ 
              left: toolbarX,
              top: toolbarY,
              pointerEvents: 'auto',
              zIndex: 10000 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handleDuplicate}
              title="Duplicate"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handleToggleLock}
              title="Lock"
            >
              <Lock className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-500 hover:bg-red-50"
              onClick={handleDeleteSelected}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })()}
    </div>
  );
}