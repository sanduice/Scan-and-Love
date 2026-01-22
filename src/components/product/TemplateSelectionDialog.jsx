import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileImage, Loader2 } from 'lucide-react';

const TemplateSelectionDialog = ({
  open,
  onOpenChange,
  product,
  selectedSize,
  selectedOptions = {},
  quantity = 1
}) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateSizes, setSelectedTemplateSizes] = useState({});

  // Helper function to check if a template size matches the selected size
  const matchesSize = (templateSize, targetWidth, targetHeight) => {
    if (!templateSize || targetWidth == null || targetHeight == null) return false;
    
    const tw = parseFloat(templateSize.width);
    const th = parseFloat(templateSize.height);
    const sw = parseFloat(targetWidth);
    const sh = parseFloat(targetHeight);
    
    // Allow small tolerance for floating point
    const TOLERANCE = 0.1;
    
    // Exact match (72x36 = 72x36)
    const exactMatch = Math.abs(tw - sw) <= TOLERANCE && Math.abs(th - sh) <= TOLERANCE;
    
    // Rotated match (72x36 = 36x72) - same template, different orientation
    const rotatedMatch = Math.abs(tw - sh) <= TOLERANCE && Math.abs(th - sw) <= TOLERANCE;
    
    return exactMatch || rotatedMatch;
  };

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open && product?.category_id) {
      fetchTemplates();
    }
  }, [open, product?.category_id, selectedSize?.width, selectedSize?.height]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Get category and parent for inheritance
      const { data: category } = await supabase
        .from('product_categories')
        .select('id, parent_id')
        .eq('id', product.category_id)
        .maybeSingle();

      const categoryIds = [product.category_id];
      if (category?.parent_id) {
        categoryIds.push(category.parent_id);
      }

      // Fetch templates for this category and parent
      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Filter templates to only those with matching size
      const matchingTemplates = (data || []).filter(template => {
        if (!template.sizes || template.sizes.length === 0) {
          return false; // Skip templates with no sizes defined
        }
        
        // Check if ANY size variant matches the selected size
        return template.sizes.some(size => 
          matchesSize(size, selectedSize?.width, selectedSize?.height)
        );
      });

      setTemplates(matchingTemplates);
      
      // Initialize size selections - pre-select the matching size variant
      const initialSizes = {};
      matchingTemplates.forEach(t => {
        if (t.sizes?.length > 0) {
          // Find the index of the matching size
          const matchingIndex = t.sizes.findIndex(size => 
            matchesSize(size, selectedSize?.width, selectedSize?.height)
          );
          initialSizes[t.id] = matchingIndex >= 0 ? matchingIndex : 0;
        }
      });
      setSelectedTemplateSizes(initialSizes);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBlank = () => {
    const params = new URLSearchParams({
      product: product.slug,
      width: selectedSize.width,
      height: selectedSize.height,
      quantity: quantity.toString(),
      ...(selectedOptions.material && { material: selectedOptions.material }),
      ...(selectedOptions.finish && { finish: selectedOptions.finish }),
      ...(selectedOptions.sizeKey && { sizeKey: selectedOptions.sizeKey }),
      ...(selectedOptions.productOptions && { productOptions: JSON.stringify(selectedOptions.productOptions) }),
    });
    navigate(`/designtool?${params.toString()}`);
    onOpenChange(false);
  };

  const handleSelectTemplate = (template) => {
    const sizeIndex = selectedTemplateSizes[template.id] || 0;
    const templateSize = template.sizes?.[sizeIndex];
    
    const params = new URLSearchParams({
      product: product.slug,
      templateId: template.id,
      width: templateSize?.width || selectedSize.width,
      height: templateSize?.height || selectedSize.height,
      quantity: quantity.toString(),
      ...(selectedOptions.material && { material: selectedOptions.material }),
      ...(selectedOptions.finish && { finish: selectedOptions.finish }),
      ...(selectedOptions.sizeKey && { sizeKey: selectedOptions.sizeKey }),
      ...(selectedOptions.productOptions && { productOptions: JSON.stringify(selectedOptions.productOptions) }),
    });
    navigate(`/designtool?${params.toString()}`);
    onOpenChange(false);
  };

  const handleTemplateSizeChange = (templateId, sizeIndex) => {
    setSelectedTemplateSizes(prev => ({
      ...prev,
      [templateId]: parseInt(sizeIndex)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start fresh or choose from pre-designed templates for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {/* Blank Canvas Option - Always First */}
            <div
              onClick={handleStartBlank}
              className="group cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors bg-muted/30 hover:bg-muted/50"
            >
              <div className="aspect-[4/3] flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Blank Canvas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSize.width}" × {selectedSize.height}"
                  </p>
                </div>
              </div>
            </div>

            {/* Loading Skeletons */}
            {loading && [...Array(7)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-card overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}

            {/* Template Cards */}
            {!loading && templates.map(template => (
              <div
                key={template.id}
                className="group rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <h4 className="font-medium text-sm truncate" title={template.name}>
                    {template.name}
                  </h4>

                  {/* Size Selector - only show if multiple sizes match */}
                  {(() => {
                    const matchingSizes = template.sizes?.filter(s => 
                      matchesSize(s, selectedSize?.width, selectedSize?.height)
                    ) || [];
                    
                    if (matchingSizes.length > 1) {
                      return (
                        <Select
                          value={String(selectedTemplateSizes[template.id] || 0)}
                          onValueChange={(v) => handleTemplateSizeChange(template.id, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {template.sizes.map((size, idx) => {
                              if (!matchesSize(size, selectedSize?.width, selectedSize?.height)) return null;
                              return (
                                <SelectItem key={idx} value={String(idx)}>
                                  {size.label || `${size.width}" × ${size.height}"`}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      );
                    } else {
                      return (
                        <p className="text-xs text-muted-foreground">
                          {selectedSize?.width}" × {selectedSize?.height}"
                        </p>
                      );
                    }
                  })()}

                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-white hover:bg-gray-100 text-[#8BC34A] border border-[#8BC34A]"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            ))}

            {/* No Templates Message */}
            {!loading && templates.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No templates available for {selectedSize?.width}" × {selectedSize?.height}"</p>
                <p className="text-sm mt-1">Start with a blank canvas and create your own design!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionDialog;
