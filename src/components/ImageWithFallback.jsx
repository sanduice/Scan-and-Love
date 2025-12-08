import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function ImageWithFallback({ src, alt, className, fallbackText, ...props }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center text-gray-400 ${className}`} {...props}>
        <ImageOff className="w-8 h-8 mb-2 opacity-50" />
        {fallbackText && <span className="text-xs">{fallbackText}</span>}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)}
      {...props} 
    />
  );
}