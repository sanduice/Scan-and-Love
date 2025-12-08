import React from 'react';
import { Maximize2 } from 'lucide-react';

export default function BannerPreview({ width, height, artwork, options }) {
  // Calculate aspect ratio for display (max 400px wide)
  const maxWidth = 500;
  const aspectRatio = width / height;
  const displayWidth = Math.min(maxWidth, width * 3);
  const displayHeight = displayWidth / aspectRatio;

  // Calculate grommet positions
  const getGrommetPositions = () => {
    const positions = [];
    const grommetsOption = options.grommets;
    
    if (grommetsOption === 'None') return positions;
    
    if (grommetsOption === '4 Corners' || grommetsOption === 'Every 2-3 ft') {
      positions.push({ x: 5, y: 5 }, { x: 95, y: 5 }, { x: 5, y: 95 }, { x: 95, y: 95 });
    }
    
    if (grommetsOption === 'Top Corners Only') {
      positions.push({ x: 5, y: 5 }, { x: 95, y: 5 });
    }
    
    if (grommetsOption === 'Every 2-3 ft' || grommetsOption === 'Every 12-18 in') {
      const spacing = grommetsOption === 'Every 12-18 in' ? 15 : 25;
      // Top edge
      for (let x = spacing; x < 95; x += spacing) {
        positions.push({ x, y: 5 });
      }
      // Bottom edge
      for (let x = spacing; x < 95; x += spacing) {
        positions.push({ x, y: 95 });
      }
      // Left edge
      for (let y = spacing; y < 95; y += spacing) {
        positions.push({ x: 5, y });
      }
      // Right edge
      for (let y = spacing; y < 95; y += spacing) {
        positions.push({ x: 95, y });
      }
    }
    
    return positions;
  };

  const grommets = getGrommetPositions();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
        <div className="text-sm text-gray-500">
          {width}" × {height}" ({(width/12).toFixed(1)}' × {(height/12).toFixed(1)}')
        </div>
      </div>
      
      <div className="flex items-center justify-center min-h-[300px] bg-gray-100 rounded-xl p-8">
        <div 
          className="relative bg-white shadow-lg"
          style={{ 
            width: `${Math.min(displayWidth, 500)}px`,
            height: `${Math.min(displayHeight, 350)}px`,
            border: options.finish !== 'None (Flush Cut)' ? '4px solid #e5e7eb' : 'none',
            maxWidth: '100%'
          }}
        >
          {/* Artwork or placeholder */}
          {artwork ? (
            <img 
              src={artwork} 
              alt="Your Design" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
              <Maximize2 className="w-12 h-12 mb-3 opacity-50" />
              <span className="text-sm font-medium">Your Design Here</span>
              <span className="text-xs mt-1">{width}" × {height}"</span>
            </div>
          )}
          
          {/* Grommets */}
          {grommets.map((pos, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gray-400 border-2 border-gray-300"
              style={{ 
                left: `${pos.x}%`, 
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          
          {/* Pole pocket indicators */}
          {options.polePockets !== 'None' && (
            <>
              <div className="absolute top-0 left-0 right-0 h-3 bg-gray-300 opacity-50 flex items-center justify-center">
                <span className="text-[8px] text-gray-600">POLE POCKET</span>
              </div>
              {options.polePockets === '3" Pockets (Top & Bottom)' && (
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-300 opacity-50 flex items-center justify-center">
                  <span className="text-[8px] text-gray-600">POLE POCKET</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        {options.grommets !== 'None' && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400 border border-gray-300" />
            <span>Grommets</span>
          </div>
        )}
        {options.finish !== 'None (Flush Cut)' && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 border-2 border-gray-300 bg-white" />
            <span>{options.finish}</span>
          </div>
        )}
      </div>
    </div>
  );
}