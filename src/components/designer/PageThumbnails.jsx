import React, { useState, useEffect } from 'react';
import { Plus, X, Copy, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { generateThumbnailWithImages } from './CanvasExporter';

const PageThumbnails = ({
  pages,
  activePageIndex,
  onPageSelect,
  onAddPage,
  onDeletePage,
  canvasWidth,
  canvasHeight,
  canAddPage = true, // Accept from parent, default true for backwards compatibility
}) => {
  const showAddButton = canAddPage && pages.length < 2;
  const canDeletePage = pages.length > 1;

  // Calculate thumbnail dimensions maintaining aspect ratio
  const thumbnailHeight = 72;
  const thumbnailWidth = Math.round((canvasWidth / canvasHeight) * thumbnailHeight);

  return (
    <div className="flex items-end gap-3 bg-white rounded-xl px-4 py-3 shadow-lg border">
      {/* Page Thumbnails */}
      {pages.map((page, index) => (
        <div
          key={page.id}
          className="flex flex-col items-center gap-1.5 group"
        >
          {/* Thumbnail Container */}
          <div
            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
              activePageIndex === index
                ? 'ring-2 ring-primary ring-offset-2'
                : 'ring-1 ring-gray-200 hover:ring-gray-300'
            }`}
            onClick={() => onPageSelect(index)}
            style={{ width: thumbnailWidth, height: thumbnailHeight }}
          >
            {/* Mini Canvas Preview */}
            <PagePreview
              elements={page.elements}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              thumbnailWidth={thumbnailWidth}
              thumbnailHeight={thumbnailHeight}
            />

            {/* Delete Button - only show if more than 1 page */}
            {canDeletePage && (
              <button
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(index);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Page Number Badge */}
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>

          {/* Label */}
          <span className="text-xs font-medium text-gray-600">
            {page.label}
          </span>
        </div>
      ))}

      {/* Add Page Button */}
      {showAddButton && (
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col items-center gap-1.5">
              <button
                className="flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 rounded-lg transition-colors"
                style={{ width: thumbnailWidth, height: thumbnailHeight }}
              >
                <Plus className="w-6 h-6 text-gray-400" />
              </button>
              <span className="text-xs font-medium text-gray-400">Add Back</span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="space-y-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors text-left"
                onClick={() => onAddPage('blank')}
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <span>Blank Canvas</span>
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors text-left"
                onClick={() => onAddPage('duplicate')}
              >
                <Copy className="w-4 h-4 text-gray-500" />
                <span>Duplicate Front</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

// Mini preview of the canvas - async version with embedded images
const PagePreview = ({
  elements,
  canvasWidth,
  canvasHeight,
  thumbnailWidth,
  thumbnailHeight,
}) => {
  const [thumbnailSrc, setThumbnailSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const generateThumbnail = async () => {
      if (!elements || elements.length === 0) {
        setThumbnailSrc(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dataUrl = await generateThumbnailWithImages(elements, canvasWidth, canvasHeight);
        if (!cancelled) {
          setThumbnailSrc(dataUrl);
        }
      } catch (err) {
        console.error('Error generating preview:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  }, [elements, canvasWidth, canvasHeight]);

  return (
    <div
      className="bg-white w-full h-full flex items-center justify-center overflow-hidden"
      style={{ width: thumbnailWidth, height: thumbnailHeight }}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      ) : thumbnailSrc ? (
        <img 
          src={thumbnailSrc} 
          alt="Page preview" 
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="text-gray-300 text-xs">Empty</div>
      )}
    </div>
  );
};

export default PageThumbnails;
