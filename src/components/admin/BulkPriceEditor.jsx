import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function BulkPriceEditor({ selectedProducts, onClose, onSuccess }) {
  const [mode, setMode] = useState('percentage'); // percentage or fixed
  const [direction, setDirection] = useState('increase'); // increase or decrease
  const [value, setValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApply = async () => {
    if (!value || isNaN(value)) {
      toast.error('Please enter a valid number');
      return;
    }

    setIsProcessing(true);
    try {
      let updatedCount = 0;
      
      // Process in parallel batches
      const promises = selectedProducts.map(product => {
        let newPrice = Number(product.base_price) || 0;
        const adjustment = Number(value);

        if (mode === 'percentage') {
          const multiplier = 1 + (adjustment / 100);
          newPrice = direction === 'increase' 
            ? newPrice * multiplier 
            : newPrice / multiplier; // Or newPrice * (1 - adjustment/100)
            
          // Using "increase by X%" or "decrease by X%" logic
          if (direction === 'decrease') {
             newPrice = newPrice * (1 - (adjustment / 100));
          }
        } else {
          newPrice = direction === 'increase' 
            ? newPrice + adjustment 
            : newPrice - adjustment;
        }

        // Round to 2 decimals
        newPrice = Math.round(newPrice * 100) / 100;
        if (newPrice < 0) newPrice = 0;

        return base44.entities.Product.update(product.id, { base_price: newPrice })
          .then(() => updatedCount++);
      });

      await Promise.all(promises);
      toast.success(`Updated prices for ${updatedCount} products`);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update some products');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Price Edit</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Updating {selectedProducts.length} selected products.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Action</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase By</SelectItem>
                  <SelectItem value="decrease">Decrease By</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Value</Label>
            <div className="relative">
              <Input 
                type="number" 
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                placeholder={mode === 'percentage' ? '10' : '5.00'}
                className="pl-8"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                {mode === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            Example: A $100 product will become <strong>
              ${(() => {
                if (!value) return '100.00';
                let p = 100;
                const v = Number(value);
                if (mode === 'percentage') {
                  return direction === 'increase' 
                    ? (p * (1 + v/100)).toFixed(2) 
                    : (p * (1 - v/100)).toFixed(2);
                } else {
                  return direction === 'increase' 
                    ? (p + v).toFixed(2) 
                    : (p - v).toFixed(2);
                }
              })()}
            </strong>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={isProcessing || !value} className="bg-blue-600 hover:bg-blue-700">
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}