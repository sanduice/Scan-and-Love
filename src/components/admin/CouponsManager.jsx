import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Tag, Percent, DollarSign, Truck, Trash2, Edit, Copy, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore } from 'date-fns';

export default function CouponsManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
      setShowDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon updated');
      setShowDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    },
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const handleSave = (formData) => {
    if (editingCoupon?.id) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed': return <DollarSign className="w-4 h-4" />;
      case 'free_shipping': return <Truck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getDiscountText = (coupon) => {
    switch (coupon.type) {
      case 'percentage': return `${coupon.value}% off`;
      case 'fixed': return `$${coupon.value} off`;
      case 'free_shipping': return 'Free Shipping';
      default: return '';
    }
  };

  const isExpired = (coupon) => {
    return coupon.expires_at && isBefore(new Date(coupon.expires_at), new Date());
  };

  const isMaxedOut = (coupon) => {
    return coupon.max_uses && coupon.uses_count >= coupon.max_uses;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Discount Codes</h3>
          <p className="text-sm text-gray-500">Create and manage promotional coupons</p>
        </div>
        <Button onClick={() => { setEditingCoupon({}); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupons Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No coupons yet</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => { setEditingCoupon({}); setShowDialog(true); }}
          >
            Create your first coupon
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((coupon) => {
                const expired = isExpired(coupon);
                const maxed = isMaxedOut(coupon);
                const inactive = !coupon.is_active || expired || maxed;
                
                return (
                  <tr key={coupon.id} className={inactive ? 'opacity-50' : ''}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm font-bold">
                          {coupon.code}
                        </code>
                        <button onClick={() => copyCode(coupon.code)} className="text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(coupon.type)}
                        <span className="font-medium">{getDiscountText(coupon)}</span>
                      </div>
                      {coupon.min_order_amount > 0 && (
                        <p className="text-xs text-gray-500">Min order: ${coupon.min_order_amount}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium">{coupon.uses_count || 0}</span>
                      {coupon.max_uses && (
                        <span className="text-gray-500"> / {coupon.max_uses}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {coupon.expires_at ? (
                        <span className={expired ? 'text-red-500' : ''}>
                          {format(new Date(coupon.expires_at), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {expired ? (
                        <Badge className="bg-red-100 text-red-800">Expired</Badge>
                      ) : maxed ? (
                        <Badge className="bg-gray-100 text-gray-800">Maxed</Badge>
                      ) : coupon.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setEditingCoupon(coupon); setShowDialog(true); }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(coupon.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Coupon Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon?.id ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <CouponForm 
            coupon={editingCoupon}
            onSave={handleSave}
            onCancel={() => setShowDialog(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CouponForm({ coupon, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percentage',
    value: coupon?.value || 10,
    min_order_amount: coupon?.min_order_amount || 0,
    max_uses: coupon?.max_uses || '',
    expires_at: coupon?.expires_at || '',
    is_active: coupon?.is_active !== false,
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      code: formData.code.toUpperCase(),
      max_uses: formData.max_uses ? Number(formData.max_uses) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Coupon Code *</Label>
        <div className="flex gap-2">
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="SAVE20"
            className="font-mono"
            required
          />
          <Button type="button" variant="outline" onClick={generateCode}>
            Generate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage Off</SelectItem>
              <SelectItem value="fixed">Fixed Amount Off</SelectItem>
              <SelectItem value="free_shipping">Free Shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{formData.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}</Label>
          <Input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            disabled={formData.type === 'free_shipping'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Order Amount ($)</Label>
          <Input
            type="number"
            value={formData.min_order_amount}
            onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Max Uses (leave empty for unlimited)</Label>
          <Input
            type="number"
            value={formData.max_uses}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div>
        <Label>Expiration Date</Label>
        <Input
          type="date"
          value={formData.expires_at}
          onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={formData.is_active}
          onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
        />
        <Label>Active</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading} className="bg-[#8BC34A] hover:bg-[#7CB342]">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {coupon?.id ? 'Update' : 'Create'} Coupon
        </Button>
      </DialogFooter>
    </form>
  );
}