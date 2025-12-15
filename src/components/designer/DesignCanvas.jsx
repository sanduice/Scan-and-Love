import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function DesignCanvas({
  width,
  height,
  zoom,
  elements,
  selectedElement,
  setSelectedElement,
  updateElement,
  showGrid,
  showRulers,
  showBleed,
  onStartTextEdit,
  editingTextId,
  onTextEditChange,
  onEndTextEdit,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const clickTimeoutRef = useRef(null);

  const PIXELS_PER_INCH = 10;
  const scale = (zoom / 100) * PIXELS_PER_INCH;
  const canvasPixelWidth = width * scale;
  const canvasPixelHeight = height * scale;
  const bleedSize = 0.25 * scale;

  const handleElementClick = useCallback((e, elementId) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Always select on click
    setSelectedElement(elementId);
  }, [elements, setSelectedElement]);

  const handleElementMouseDown = useCallback((e, elementId) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    // Don't start drag if we're editing text
    if (editingTextId === elementId) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height });
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging && !isResizing) return;
      
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

        updateElement(selectedElement, { width: newWidth, height: newHeight, x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedElement, dragStart, elementStart, resizeHandle, elements, scale, width, height, updateElement]);

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget || e.target.closest('[data-canvas-bg]')) {
      setSelectedElement(null);
      if (editingTextId && onEndTextEdit) {
        onEndTextEdit();
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
      cursor: element.locked ? 'default' : isEditing ? 'text' : 'move',
      opacity: element.visible === false ? 0.3 : 1,
      zIndex: isSelected ? 1000 : 1,
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
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'rgba(255,255,255,0.95)',
              padding: '4px',
              fontSize: element.fontSize * scale,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              color: element.color,
              textAlign: element.textAlign,
            }}
          />
        );
      } else {
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                             element.textAlign === 'right' ? 'flex-end' : 'flex-start',
              fontSize: element.fontSize * scale,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              color: element.color,
              textAlign: element.textAlign,
              overflow: 'hidden',
              userSelect: 'none',
              padding: '2px',
              wordBreak: 'break-word',
              lineHeight: 1.2,
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
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain', 
            pointerEvents: 'none', 
            userSelect: 'none' 
          }}
          draggable={false}
        />
      );
    } else if (element.type === 'shape') {
      if (element.shape === 'circle') {
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: element.fill,
              border: element.stroke !== 'none' ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              pointerEvents: 'none',
            }}
          />
        );
      } else {
        content = (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: element.fill,
              border: element.stroke !== 'none' ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
              borderRadius: element.shape === 'rounded-rect' ? '8px' : 0,
              pointerEvents: 'none',
            }}
          />
        );
      }
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        onDoubleClick={(e) => handleDoubleClick(e, element.id)}
      >
        {content}
        
        {isSelected && !element.locked && !isEditing && (
          <>
            <div className="absolute inset-0 border-2 pointer-events-none" style={{ borderColor: '#89b4fa' }} />
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
              const positions = {
                nw: { top: -5, left: -5, cursor: 'nw-resize' },
                n: { top: -5, left: '50%', marginLeft: -5, cursor: 'n-resize' },
                ne: { top: -5, right: -5, cursor: 'ne-resize' },
                e: { top: '50%', right: -5, marginTop: -5, cursor: 'e-resize' },
                se: { bottom: -5, right: -5, cursor: 'se-resize' },
                s: { bottom: -5, left: '50%', marginLeft: -5, cursor: 's-resize' },
                sw: { bottom: -5, left: -5, cursor: 'sw-resize' },
                w: { top: '50%', left: -5, marginTop: -5, cursor: 'w-resize' },
              };
              return (
                <div
                  key={handle}
                  className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md"
                  style={{ ...positions[handle], cursor: positions[handle].cursor, border: '2px solid #89b4fa' }}
                  onMouseDown={(e) => handleResizeStart(e, element.id, handle)}
                />
              );
            })}
          </>
        )}
        
        {isEditing && (
          <div className="absolute inset-0 border-2 pointer-events-none" style={{ borderColor: '#a6e3a1' }} />
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-auto"
      onClick={handleCanvasClick}
      style={{ padding: '60px 40px' }}
    >
      <div className="relative" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.6))' }}>
        {showRulers && (
          <>
            <div 
              className="absolute -top-6 left-0 h-5 bg-[#313244] text-xs text-[#6c7086] flex items-end overflow-hidden rounded-t"
              style={{ width: canvasPixelWidth }}
            >
              {Array.from({ length: Math.ceil(width) + 1 }).map((_, i) => (
                <div key={i} className="relative" style={{ width: scale }}>
                  <div className="absolute bottom-0 left-0 w-px h-2 bg-[#45475a]" />
                  {i % 6 === 0 && <span className="absolute -bottom-0.5 left-1 text-[10px]">{i}"</span>}
                </div>
              ))}
            </div>
            <div 
              className="absolute -left-6 top-0 w-5 bg-[#313244] text-xs text-[#6c7086] overflow-hidden rounded-l"
              style={{ height: canvasPixelHeight }}
            >
              {Array.from({ length: Math.ceil(height) + 1 }).map((_, i) => (
                <div key={i} className="relative" style={{ height: scale }}>
                  <div className="absolute top-0 right-0 h-px w-2 bg-[#45475a]" />
                  {i % 6 === 0 && <span className="absolute top-1 right-1 text-[10px]">{i}"</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {showBleed && (
          <div 
            className="absolute border border-dashed"
            style={{
              top: -bleedSize,
              left: -bleedSize,
              width: canvasPixelWidth + bleedSize * 2,
              height: canvasPixelHeight + bleedSize * 2,
              borderColor: 'rgba(243, 139, 168, 0.5)',
              backgroundColor: 'rgba(243, 139, 168, 0.05)',
            }}
          />
        )}

        <div
          data-canvas-bg
          className="relative bg-white rounded-sm"
          style={{
            width: canvasPixelWidth,
            height: canvasPixelHeight,
          }}
        >
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(137, 180, 250, 0.15) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(137, 180, 250, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: `${scale}px ${scale}px`,
              }}
            />
          )}

          <div 
            className="absolute pointer-events-none border border-dashed opacity-40"
            style={{
              top: 0.5 * scale,
              left: 0.5 * scale,
              right: 0.5 * scale,
              bottom: 0.5 * scale,
              borderColor: '#89b4fa',
            }}
          />

          {elements.filter(el => el.visible !== false).map(renderElement)}

          {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6c7086] pointer-events-none">
              <div className="text-xl font-medium mb-2">Start designing</div>
              <p className="text-sm">Add text, images, or shapes from the sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}