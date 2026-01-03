import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ImageIcon, AlertTriangle, Check, ExternalLink, 
  ChevronDown, ChevronUp, Edit2, X 
} from 'lucide-react';

export default function ProductImportCard({ 
  product, 
  index, 
  isSelected, 
  onToggleSelect,
  onUpdateProduct 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(product.name);

  const hasErrors = product.scrape_errors?.length > 0;
  const hasImage = !!product.image_url;
  const hasOptions = product.product_options?.length > 0;
  const hasSizes = product.preset_sizes?.length > 0;

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== product.name) {
      onUpdateProduct(index, { ...product, name: editedName.trim() });
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setEditedName(product.name);
    setIsEditing(false);
  };

  return (
    <Card 
      className={`transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:bg-muted/30'
      } ${hasErrors ? 'border-yellow-500/50' : ''}`}
    >
      <CardContent className="p-4">
        {/* Main row */}
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(index)}
            className="mt-1"
          />

          {/* Image */}
          <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
            {hasImage ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`absolute inset-0 flex items-center justify-center bg-muted ${hasImage ? 'hidden' : ''}`}
            >
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            {hasErrors && (
              <div className="absolute top-1 right-1">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-start gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') handleNameCancel();
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleNameSave}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleNameCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h4 
                    className="font-semibold text-sm leading-tight flex-1 cursor-pointer hover:text-primary"
                    onClick={() => onToggleSelect(index)}
                  >
                    {product.name || 'Unnamed Product'}
                  </h4>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            {/* Source URL */}
            <a 
              href={product.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary truncate block mt-1 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{product.source_url}</span>
            </a>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Badge 
                variant={hasSizes ? 'secondary' : 'outline'} 
                className="text-xs py-0"
              >
                {product.preset_sizes?.length || 0} sizes
              </Badge>
              <Badge 
                variant={hasOptions ? 'secondary' : 'outline'} 
                className="text-xs py-0"
              >
                {product.product_options?.length || 0} options
              </Badge>
              <Badge 
                variant={product.gallery_images?.length > 0 ? 'secondary' : 'outline'} 
                className="text-xs py-0"
              >
                {product.gallery_images?.length || 0} images
              </Badge>
              {hasErrors && (
                <Badge variant="outline" className="text-xs py-0 text-yellow-600 border-yellow-500">
                  {product.scrape_errors.length} warning{product.scrape_errors.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Expand button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Errors/Warnings */}
            {hasErrors && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                <h5 className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                  Extraction Warnings
                </h5>
                <ul className="text-xs text-yellow-600 dark:text-yellow-300 space-y-1">
                  {product.scrape_errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gallery Images */}
            {product.gallery_images?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                  Gallery Images ({product.gallery_images.length})
                </h5>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.gallery_images.slice(0, 8).map((img, i) => (
                    <div 
                      key={i} 
                      className="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden"
                    >
                      <img 
                        src={img} 
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            {product.product_options?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                  Product Options ({product.product_options.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {product.product_options.map((opt, i) => (
                    <div key={i} className="text-xs bg-muted rounded px-2 py-1">
                      <span className="font-medium">{opt.name}:</span>{' '}
                      <span className="text-muted-foreground">
                        {opt.choices?.length || 0} choice{(opt.choices?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preset Sizes */}
            {product.preset_sizes?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                  Preset Sizes ({product.preset_sizes.length})
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {product.preset_sizes.map((size, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {size.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description preview */}
            {product.description && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-1">
                  Description
                </h5>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
