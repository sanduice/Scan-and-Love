import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Move, RotateCw } from 'lucide-react';

// Main Canvas Workspace - Canva-style infinite canvas with pan/zoom
export default function CanvasWorkspace({
  width,
  height,
  zoom,
  setZoom,
  elements,
  selectedElement,
  setSelectedElement,
  updateElement,
  onStartTextEdit,
  editingTextId,
  onTextEditChange,
  onEndTextEdit,
  showGrid,
  showBleed,
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

  const PIXELS_PER_INCH = 10;
  const scale = (zoom / 100) * PIXELS_PER_INCH;
  const canvasPixelWidth = width * scale;
  const canvasPixelHeight = height * scale;
  const bleedSize = 0.25 * scale;

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

  const handleElementMouseDown = useCallback((e, elementId) => {
    e.stopPropagation();
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
        updateElement(selectedElement, {
          x: Math.max(0, Math.min(width - element.width, elementStart.x + dx)),
          y: Math.max(0, Math.min(height - element.height, elementStart.y + dy)),
        });
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
        const centerX = (elementStart.x + elementStart.width / 2) * scale;
        const centerY = (elementStart.y + elementStart.height / 2) * scale;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
        updateElement(selectedElement, { rotation: Math.round(angle / 15) * 15 });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeHandle(null);
      setIsPanning(false);
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

    const style = {
      position: 'absolute',
      left: element.x * scale,
      top: element.y * scale,
      width: element.width * scale,
      height: element.height * scale,
      transform: `rotate(${element.rotation || 0}deg)`,
      cursor: element.locked ? 'not-allowed' : isEditing ? 'text' : 'move',
      opacity: element.visible === false ? 0.3 : 1,
      zIndex: isSelected ? 1000 : elements.indexOf(element) + 1,
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
      const shapeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: element.fill || '#3B82F6',
        border: element.stroke !== 'none' ? `${element.strokeWidth || 2}px solid ${element.stroke}` : 'none',
        borderRadius: element.shape === 'circle' ? '50%' : 
                      element.shape === 'rounded-rect' ? '12px' : 0,
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
      >
        {content}

        {/* Selection UI */}
        {isSelected && !element.locked && !isEditing && (
          <>
            {/* Selection border */}
            <div 
              className="absolute inset-0 border-2 pointer-events-none rounded-sm"
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
                  style={{ ...positions[handle], cursor: positions[handle].cursor }}
                  onMouseDown={(e) => handleResizeStart(e, element.id, handle)}
                />
              );
            })}

            {/* Rotation handle */}
            <div
              className="absolute -top-10 left-1/2 -ml-4 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center cursor-grab hover:scale-110 transition-transform"
              onMouseDown={(e) => handleRotateStart(e, element.id)}
            >
              <RotateCw className="w-4 h-4 text-blue-500" />
            </div>
            <div className="absolute -top-10 left-1/2 w-px h-6 bg-blue-500 -ml-px" style={{ top: -24 }} />
          </>
        )}

        {isEditing && (
          <div 
            className="absolute inset-0 border-2 pointer-events-none" 
            style={{ borderColor: '#22C55E' }} 
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
      {/* Checkered background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
            linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
            linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
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

          {/* Main canvas */}
          <div
            data-canvas-bg
            className="relative bg-white"
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
          </div>

          {/* Size indicator */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
            {width}" × {height}"
          </div>
        </div>
      </div>
    </div>
  );
}