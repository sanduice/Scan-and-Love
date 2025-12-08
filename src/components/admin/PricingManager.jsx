import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Edit, Save, X, DollarSign, RefreshCw, 
  ChevronDown, ChevronUp, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PRODUCT_TYPES = [
  { value: 'vinyl-banner', label: 'Vinyl Banners' },
  { value: 'retractable-banner', label: 'Retractable Banners' },
  { value: 'plastic-sign', label: 'Plastic Signs' },
  { value: 'yard-sign', label: 'Yard Signs' },
  { value: 'sticker', label: 'Stickers' },
  { value: 'foam-board', label: 'Foam Board' },
  { value: 'a-frame', label: 'A-Frame Signs' },
];

const PRICING_METHODS = [
  { value: 'per_sqft', label: 'Per Square Foot' },
  { value: 'per_sqin', label: 'Per Square Inch' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'tiered_qty', label: 'Tiered by Quantity' },
];

export default function PricingManager() {
  const queryClient = useQueryClient();
  const [editingTier, setEditingTier] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState({});

  const { data: pricingTiers = [], isLoading, refetch } = useQuery({
    queryKey: ['pricing-tiers-admin'],
    queryFn: () => base44.entities.PricingTier.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PricingTier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers-admin'] });
      toast.success('Pricing tier created');
      setShowAddDialog(false);
      setEditingTier(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PricingTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers-admin'] });
      toast.success('Pricing tier updated');
      setEditingTier(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PricingTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers-admin'] });
      toast.success('Pricing tier deleted');
    },
  });

  // Group tiers by product type
  const tiersByProduct = pricingTiers.reduce((acc, tier) => {
    const key = tier.product_type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tier);
    return acc;
  }, {});

  const formatBreaks = (breaksJson) => {
    try {
      const breaks = JSON.parse(breaksJson);
      if (Array.isArray(breaks)) {
        return breaks.map(b => `${b.qty}+: $${b.price}`).join(', ');
      }
    } catch (e) {}
    return 'No breaks';
  };

  const TierEditForm = ({ tier, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      product_type: tier?.product_type || 'vinyl-banner',
      material: tier?.material || '',
      size_key: tier?.size_key || '',
      pricing_method: tier?.pricing_method || 'per_sqft',
      base_price: tier?.base_price || 0,
      min_price: tier?.min_price || 0,
      setup_fee: tier?.setup_fee || 0,
      quantity_breaks_json: tier?.quantity_breaks_json || '[]',
      is_active: tier?.is_active ?? true,
    });

    const [breaksInput, setBreaksInput] = useState(() => {
      try {
        const breaks = JSON.parse(formData.quantity_breaks_json);
        return breaks.map(b => `${b.qty}:${b.price}`).join('\n');
      } catch (e) {
        return '';
      }
    });

    const handleBreaksChange = (value) => {
      setBreaksInput(value);
      try {
        const lines = value.split('\n').filter(l => l.trim());
        const breaks = lines.map(line => {
          const [qty, price] = line.split(':').map(s => parseFloat(s.trim()));
          return { qty, price };
        }).filter(b => !isNaN(b.qty) && !isNaN(b.price));
        setFormData(prev => ({ ...prev, quantity_breaks_json: JSON.stringify(breaks) }));
      } catch (e) {}
    };

    const handleSubmit = () => {
      if (!formData.product_type || !formData.pricing_method) {
        toast.error('Please fill in required fields');
        return;
      }
      onSave(formData);
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Product Type *</Label>
            <Select value={formData.product_type} onValueChange={(v) => setFormData(prev => ({ ...prev, product_type: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map(pt => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pricing Method *</Label>
            <Select value={formData.pricing_method} onValueChange={(v) => setFormData(prev => ({ ...prev, pricing_method: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_METHODS.map(pm => (
                  <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Material</Label>
            <Input 
              value={formData.material} 
              onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
              placeholder="e.g., 13 oz Vinyl"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Size Key (for fixed sizes)</Label>
            <Input 
              value={formData.size_key} 
              onChange={(e) => setFormData(prev => ({ ...prev, size_key: e.target.value }))}
              placeholder="e.g., 33x81"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Base Price *</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.base_price} 
              onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Minimum Price</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.min_price} 
              onChange={(e) => setFormData(prev => ({ ...prev, min_price: parseFloat(e.target.value) || 0 }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Setup Fee</Label>
            <Input 
              type="number"
              step="0.01"
              value={formData.setup_fee} 
              onChange={(e) => setFormData(prev => ({ ...prev, setup_fee: parseFloat(e.target.value) || 0 }))}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Quantity Breaks (one per line: qty:price)</Label>
          <textarea
            value={breaksInput}
            onChange={(e) => handleBreaksChange(e.target.value)}
            placeholder="1:3.26&#10;5:2.70&#10;10:2.40&#10;25:2.10"
            className="mt-1 w-full h-32 p-2 border rounded-md text-sm font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">Format: quantity:price (e.g., "10:2.40" means qty 10+ is $2.40 per unit)</p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            id="is_active"
          />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pricing Manager</h2>
          <p className="text-sm text-gray-500">Manage product pricing tiers and volume discounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditingTier({}); setShowAddDialog(true); }} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Tier
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading pricing tiers...</div>
      ) : (
        <div className="space-y-4">
          {PRODUCT_TYPES.map(productType => {
            const tiers = tiersByProduct[productType.value] || [];
            if (tiers.length === 0) return null;

            return (
              <Collapsible 
                key={productType.value} 
                open={expandedProducts[productType.value] !== false}
                onOpenChange={(open) => setExpandedProducts(prev => ({ ...prev, [productType.value]: open }))}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">{productType.label}</span>
                        <Badge variant="outline">{tiers.length} tiers</Badge>
                      </div>
                      {expandedProducts[productType.value] !== false ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="divide-y">
                      {tiers.map(tier => (
                        <div key={tier.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{tier.material || 'Default'}</span>
                                {tier.size_key && (
                                  <Badge variant="outline" className="text-xs">{tier.size_key}</Badge>
                                )}
                                {!tier.is_active && (
                                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">${tier.base_price}</span>
                                <span className="text-gray-400 mx-1">•</span>
                                <span className="capitalize">{tier.pricing_method?.replace(/_/g, ' ')}</span>
                                {tier.min_price > 0 && (
                                  <>
                                    <span className="text-gray-400 mx-1">•</span>
                                    <span>Min: ${tier.min_price}</span>
                                  </>
                                )}
                              </div>
                              {tier.quantity_breaks_json && (
                                <div className="text-xs text-gray-500">
                                  Breaks: {formatBreaks(tier.quantity_breaks_json)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const newTier = { ...tier };
                                  delete newTier.id;
                                  delete newTier.created_date;
                                  delete newTier.updated_date;
                                  setEditingTier(newTier);
                                  setShowAddDialog(true);
                                }}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingTier(tier)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm('Delete this pricing tier?')) {
                                    deleteMutation.mutate(tier.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {Object.keys(tiersByProduct).length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No pricing tiers yet</h3>
              <p className="text-gray-500 mb-4">Add your first pricing tier to get started</p>
              <Button onClick={() => { setEditingTier({}); setShowAddDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Pricing Tier
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || (editingTier && editingTier.id)} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingTier(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTier?.id ? 'Edit Pricing Tier' : 'Add Pricing Tier'}
            </DialogTitle>
          </DialogHeader>
          <TierEditForm
            tier={editingTier}
            onSave={(data) => {
              if (editingTier?.id) {
                updateMutation.mutate({ id: editingTier.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => {
              setShowAddDialog(false);
              setEditingTier(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}