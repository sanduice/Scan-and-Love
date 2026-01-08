import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Calculator, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function BulkSizeEditor({ selectedProducts, onClose, onSuccess }) {
  const [mode, setMode] = useState('add'); // add, recalculate
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [sizeName, setSizeName] = useState('');
  const [pricePerSqft, setPricePerSqft] = useState('4.50');
  const [isProcessing, setIsProcessing] = useState(false);

  const calculatePrice = (w, h, rate) => {
    const sqft = (w * h) / 144;
    return Math.round(sqft * rate * 100) / 100;
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      let updatedCount = 0;
      const rate = Number(pricePerSqft) || 4.5;

      if (mode === 'add') {
        const w = Number(width);
        const h = Number(height);
        if (!w || !h) {
          toast.error('Please enter valid width and height');
          setIsProcessing(false);
          return;
        }

        const newSize = {
          name: sizeName || `${w}" × ${h}"`,
          width: w,
          height: h,
          price: calculatePrice(w, h, rate),
          is_active: true
        };

        const promises = selectedProducts.map(async (product) => {
          const existingSizes = Array.isArray(product.preset_sizes) ? product.preset_sizes : [];
          
          // Check if size already exists
          const exists = existingSizes.some(s => s.width === w && s.height === h);
          if (exists) return;

          const updatedSizes = [...existingSizes, newSize];
          
          const { error } = await supabase
            .from('products')
            .update({ preset_sizes: updatedSizes })
            .eq('id', product.id);
          
          if (error) throw error;
          updatedCount++;
        });

        await Promise.all(promises);
        toast.success(`Added size to ${updatedCount} products`);
      } else if (mode === 'recalculate') {
        const promises = selectedProducts.map(async (product) => {
          const existingSizes = Array.isArray(product.preset_sizes) ? product.preset_sizes : [];
          if (existingSizes.length === 0) return;

          const updatedSizes = existingSizes.map(size => ({
            ...size,
            price: size.width && size.height ? calculatePrice(size.width, size.height, rate) : size.price
          }));

          const { error } = await supabase
            .from('products')
            .update({ 
              preset_sizes: updatedSizes,
              price_per_sqft: rate
            })
            .eq('id', product.id);
          
          if (error) throw error;
          updatedCount++;
        });

        await Promise.all(promises);
        toast.success(`Recalculated prices for ${updatedCount} products`);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update some products');
    } finally {
      setIsProcessing(false);
    }
  };

  const previewPrice = () => {
    const w = Number(width) || 24;
    const h = Number(height) || 18;
    const rate = Number(pricePerSqft) || 4.5;
    return calculatePrice(w, h, rate);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Size Editor</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Updating {selectedProducts.length} selected products.
          </div>

          <div>
            <Label>Action</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Size
                  </div>
                </SelectItem>
                <SelectItem value="recalculate">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Recalculate All Prices
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'add' && (
            <>
              <div>
                <Label>Size Name (optional)</Label>
                <Input 
                  value={sizeName} 
                  onChange={(e) => setSizeName(e.target.value)}
                  placeholder="e.g., Medium, Large, Custom"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width (inches)</Label>
                  <Input 
                    type="number" 
                    value={width} 
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="24"
                  />
                </div>
                <div>
                  <Label>Height (inches)</Label>
                  <Input 
                    type="number" 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="18"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label>Price per Sq Ft ($)</Label>
            <Input 
              type="number" 
              step="0.01"
              value={pricePerSqft} 
              onChange={(e) => setPricePerSqft(e.target.value)}
              placeholder="4.50"
            />
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            {mode === 'add' ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calculator className="w-4 h-4" />
                  Price Calculation Preview
                </div>
                <div>
                  {width && height ? (
                    <>
                      {width}" × {height}" = <strong>${previewPrice().toFixed(2)}</strong>
                      <span className="text-muted-foreground ml-2">
                        ({((Number(width) * Number(height)) / 144).toFixed(2)} sq ft × ${pricePerSqft})
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Enter dimensions to see price</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <RefreshCw className="w-4 h-4" />
                  Recalculation Info
                </div>
                <div className="text-muted-foreground">
                  All preset size prices will be recalculated using <strong>${pricePerSqft}/sq ft</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleApply} 
            disabled={isProcessing || (mode === 'add' && (!width || !height))}
          >
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'add' ? 'Add Size' : 'Recalculate Prices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
