import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCw, ArrowUpToLine, ArrowDownToLine, Crosshair, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
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
    e.stopPropagation();
    if (e.button === 2) return; // Right-click handled separately
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    if (editingTextId === elementId) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: element.x, 
      y: element.y, 
      width: element.width, 
      height: element.height,
      rotation: element.rotation || 0
    });
  }, [elements, editingTextId, setSelectedElement]);

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
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height });
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

      if (!isDragging && !isResizing && !isRotating) return;

      const element = elements.find(el => el.id === selectedElement);
      if (!element) return;

      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        // Calculate new position
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

        updateElement(selectedElement, { width: newWidth, height: newHeight, x: newX, y: newY });
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

    const handleMouseUp = () => {
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
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, isPanning, selectedElement, dragStart, elementStart, resizeHandle, panStart, elements, scale, width, height, updateElement]);

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget || e.target.closest('[data-canvas-bg]')) {
      setSelectedElement(null);
      if (editingTextId && onEndTextEdit) {
        onEndTextEdit();
      }
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === e.currentTarget || e.target.closest('[data-canvas-bg]')) {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const renderElement = (element) => {
    const isSelected = selectedElement === element.id;
    const isEditing = editingTextId === element.id;
    const elementIndex = elements.indexOf(element);

    const style = {
      position: 'absolute',
      left: element.x * scale,
      top: element.y * scale,
      width: element.width * scale,
      height: element.height * scale,
      transform: `rotate(${element.rotation || 0}deg)`,
      cursor: element.locked ? 'not-allowed' : isEditing ? 'text' : 'move',
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
      // Handle border radius - can be numeric from SVG parser or string
      let borderRadius = 0;
      if (element.shape === 'circle') {
        borderRadius = '50%';
      } else if (element.shape === 'rounded-rect') {
        borderRadius = element.borderRadius ? `${element.borderRadius * scale}px` : '12px';
      } else if (element.borderRadius) {
        borderRadius = `${element.borderRadius * scale}px`;
      }

      const shapeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: element.fill || '#3B82F6',
        border: element.stroke && element.stroke !== 'none' 
          ? `${(element.strokeWidth || 2) * scale}px solid ${element.stroke}` 
          : 'none',
        borderRadius,
        opacity: element.opacity ?? 1,
        boxShadow: element.shadow || 'none',
        pointerEvents: 'none',
      };
      content = <div style={shapeStyle} />;
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id); }}
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
              style={{ borderColor: '#3B82F6' }}
            />
            
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
                  className="absolute w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-500 hover:scale-125 transition-transform"
                  style={{ ...positions[handle], cursor: positions[handle].cursor, pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleResizeStart(e, element.id, handle)}
                />
              );
            })}

            {/* Rotation handle */}
            <div
              className="absolute -top-10 left-1/2 -ml-4 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center cursor-grab hover:scale-110 transition-transform"
              style={{ pointerEvents: 'auto' }}
              onMouseDown={(e) => handleRotateStart(e, element.id)}
            >
              <RotateCw className="w-4 h-4 text-blue-500" />
            </div>
            <div className="absolute -top-10 left-1/2 w-px h-6 bg-blue-500 -ml-px" style={{ top: -24 }} />
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
        {/* Canvas shadow */}
        <div 
          className="relative"
          style={{ filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.25))' }}
        >
          {/* Bleed area */}
          {showBleed && (
            <div
              className="absolute border-2 border-dashed border-red-300 bg-red-50/30"
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
    </div>
  );
}