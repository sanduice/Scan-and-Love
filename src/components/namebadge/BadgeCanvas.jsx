import React, { useRef, useState } from 'react';

const SIZE_DIMENSIONS = {
  '1x3-rectangle': { width: 3, height: 1 },
  '1.5x3-rectangle': { width: 3, height: 1.5 },
  '1.5x3-oval': { width: 3, height: 1.5, isOval: true },
  '2x3-rectangle': { width: 3, height: 2 },
};

const BACKGROUNDS = {
  'white-plastic': { color: '#FFFFFF', label: 'White - Plastic' },
  'black-plastic': { color: '#1a1a1a', label: 'Black - Plastic' },
  'gold-plastic': { color: '#D4AF37', label: 'Gold - Plastic' },
  'silver-plastic': { color: '#C0C0C0', label: 'Silver - Plastic' },
  'gold-metallic': { color: '#FFD700', label: 'Gold - Metallic', gradient: true },
  'silver-metallic': { color: '#E8E8E8', label: 'Silver - Metallic', gradient: true },
  'rose-gold': { color: '#B76E79', label: 'Rose Gold', gradient: true },
  'wood-grain': { color: '#DEB887', label: 'Wood Grain', pattern: 'wood' },
  'brushed-metal': { color: '#A8A8A8', label: 'Brushed Metal', gradient: true },
  'bling-silver': { color: '#C0C0C0', label: 'Silver Bling', gradient: true },
  'bling-gold': { color: '#FFD700', label: 'Gold Bling', gradient: true },
  'chalkboard': { color: '#333333', label: 'Chalkboard' },
  'glossy-white': { color: '#FFFFFF', label: 'Glossy White', gradient: true },
  'red-plastic': { color: '#EF4444', label: 'Red' },
  'blue-plastic': { color: '#3B82F6', label: 'Blue' },
  'green-plastic': { color: '#22C55E', label: 'Green' },
};

const BORDER_COLORS = {
  'none': null,
  'gold': '#D4AF37',
  'silver': '#C0C0C0',
  'black': '#000000',
  'rose-gold': '#B76E79',
};

export default function BadgeCanvas({
  sizeShape,
  background,
  backgroundImage,
  border,
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  badgeType,
}) {
  const canvasRef = useRef(null);
  const [resizing, setResizing] = useState(null);
  const dimensions = SIZE_DIMENSIONS[sizeShape];
  const bgConfig = BACKGROUNDS[background] || BACKGROUNDS['white-plastic'];
  const borderColor = BORDER_COLORS[border];

  const scale = 150; // pixels per inch for display
  const canvasWidth = dimensions.width * scale;
  const canvasHeight = dimensions.height * scale;
  const isOval = dimensions.isOval;

  const handleElementDrag = (e, element) => {
    if (resizing) return;
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = element.x;
    const startElY = element.y;

    const handleMove = (moveE) => {
      const dx = (moveE.clientX - startX) / scale;
      const dy = (moveE.clientY - startY) / scale;
      onUpdateElement(element.id, {
        x: Math.max(0, Math.min(dimensions.width, startElX + dx)),
        y: Math.max(0, Math.min(dimensions.height, startElY + dy)),
      });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleResize = (e, element, corner) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(corner);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width || 0.3;
    const startHeight = element.height || 0.3;
    const startFontSize = element.fontSize || 0.2;

    const handleMove = (moveE) => {
      const dx = (moveE.clientX - startX) / scale;
      const dy = (moveE.clientY - startY) / scale;
      
      if (element.type === 'text') {
        // For text, resize changes font size
        const delta = (dx + dy) / 2;
        const newSize = Math.max(0.08, Math.min(0.6, startFontSize + delta * 0.5));
        onUpdateElement(element.id, { fontSize: newSize });
      } else {
        // For images, resize both dimensions proportionally
        const avgDelta = (dx + dy) / 2;
        const newWidth = Math.max(0.1, Math.min(1.5, startWidth + avgDelta));
        const newHeight = Math.max(0.1, Math.min(1.5, startHeight + avgDelta));
        onUpdateElement(element.id, { width: newWidth, height: newHeight });
      }
    };

    const handleUp = () => {
      setResizing(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const getElementBounds = (element) => {
    if (element.type === 'text') {
      const fontSize = element.fontSize * scale;
      const textWidth = element.text.length * fontSize * 0.6;
      const textHeight = fontSize * 1.2;
      return {
        left: element.x * scale - textWidth / 2,
        top: element.y * scale - textHeight / 2,
        width: textWidth,
        height: textHeight,
      };
    } else {
      return {
        left: (element.x - element.width / 2) * scale,
        top: (element.y - element.height / 2) * scale,
        width: element.width * scale,
        height: element.height * scale,
      };
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Size indicators */}
      <div className="flex items-center justify-center mb-2 text-sm text-gray-500">
        <span>← {dimensions.width}" →</span>
      </div>

      <div className="flex items-center gap-2">
        <div 
          ref={canvasRef}
          className="relative bg-white shadow-lg overflow-hidden"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            borderRadius: isOval ? '50%' : (badgeType === 'executive' ? '2px' : '8px'), // Sharper corners for executive
            border: badgeType === 'executive'
              ? `6px solid ${borderColor || '#C0C0C0'}` // Thicker metal frame for executive
              : (borderColor ? `4px solid ${borderColor}` : '1px solid #e5e7eb'),
            boxShadow: badgeType === 'executive' 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.5)' // Metallic shine/depth
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            background: backgroundImage 
              ? `url(${backgroundImage}) center/cover no-repeat`
              : bgConfig.gradient 
                ? `linear-gradient(135deg, ${bgConfig.color} 0%, #fff 50%, ${bgConfig.color} 100%)`
                : bgConfig.color,
          }}
          onClick={() => onSelectElement(null)}
        >
          {/* Elements */}
          {elements.map((element) => {
            const bounds = getElementBounds(element);
            const isSelected = selectedElement === element.id;
            
            return (
              <div
                key={element.id}
                className={`absolute ${isSelected ? '' : 'cursor-move'}`}
                style={{
                  left: bounds.left,
                  top: bounds.top,
                  width: bounds.width,
                  height: bounds.height,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(element.id);
                }}
                onMouseDown={(e) => {
                  if (!isSelected) {
                    onSelectElement(element.id);
                  }
                  handleElementDrag(e, element);
                }}
              >
                {/* Selection box */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" style={{ margin: -2 }}>
                    {/* Resize handles */}
                    {['nw', 'ne', 'sw', 'se'].map((corner) => (
                      <div
                        key={corner}
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize pointer-events-auto"
                        style={{
                          top: corner.includes('n') ? -6 : 'auto',
                          bottom: corner.includes('s') ? -6 : 'auto',
                          left: corner.includes('w') ? -6 : 'auto',
                          right: corner.includes('e') ? -6 : 'auto',
                        }}
                        onMouseDown={(e) => handleResize(e, element, corner)}
                      />
                    ))}
                  </div>
                )}

                {element.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      fontSize: element.fontSize * scale,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textDecoration: element.textDecoration,
                      color: element.color,
                      textAlign: element.textAlign,
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {element.text}
                  </div>
                )}
                {(element.type === 'image' || element.type === 'clipart') && (
                  <img
                    src={element.src}
                    alt=""
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                )}
                {element.type === 'logo-placeholder' && (
                  <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50 text-gray-400 cursor-pointer hover:bg-gray-100 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <span className="text-xs font-medium">{element.text}</span>
                    <span className="text-[10px] mt-1">(Click to Upload)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Height indicator */}
        <div className="text-sm text-gray-500 flex flex-col items-center">
          <span>↑</span>
          <span>{dimensions.height}"</span>
          <span>↓</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        * NOT ACTUAL SIZE - Drag to move, use corner handles to resize
      </p>
    </div>
  );
}