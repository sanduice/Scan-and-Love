import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, ChevronRight, Plus, Minus, Trash2, Upload, Download,
  Loader2, ShoppingCart, Copy, Edit, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { getSessionId, getUserOrSession } from '@/components/SessionManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { calculateNameBadgePrice, QUANTITY_TIERS } from '@/components/namebadge/utils';

export default function NameBadgeNames() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const designId = urlParams.get('designId');

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameEntries, setNameEntries] = useState([{ id: 1, fields: ['', '', '', ''], quantity: 1 }]);
  const [confirmBackOpen, setConfirmBackOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: design, isLoading, refetch } = useQuery({
    queryKey: ['badge-design', designId],
    queryFn: async () => {
      const designs = await base44.entities.NameBadgeDesign.filter({ id: designId });
      return designs[0];
    },
    enabled: !!designId,
  });

  // Load existing order if exists
  const { data: existingOrder } = useQuery({
    queryKey: ['badge-order', designId],
    queryFn: async () => {
      const orders = await base44.entities.NameBadgeOrder.filter({ design_id: designId, is_in_cart: true });
      return orders[0];
    },
    enabled: !!designId,
  });

  // Load existing names from order or design
  useEffect(() => {
    if (existingOrder?.names_data_json) {
      const savedNames = JSON.parse(existingOrder.names_data_json);
      if (savedNames.length > 0) {
        // Ensure each entry has quantity field
        setNameEntries(savedNames.map(entry => ({ ...entry, quantity: entry.quantity || 1 })));
      }
    } else if (design?.elements_json) {
      // Initialize with text from design elements
      const elements = JSON.parse(design.elements_json);
      const textElements = elements.filter(el => el.type === 'text' && el.isVariable);
      if (textElements.length > 0) {
        const initialFields = Array(4).fill('');
        textElements.forEach((el, i) => {
          if (i < 4) initialFields[i] = el.text !== 'Your Text' ? el.text : '';
        });
        setNameEntries([{ id: 1, fields: initialFields, quantity: 1 }]);
      }
    }
  }, [existingOrder, design]);

  const textFieldsCount = design?.text_fields_count || 1;
  const elements = design?.elements_json ? JSON.parse(design.elements_json) : [];
  const textElements = elements.filter(el => el.type === 'text' && el.isVariable);

  // Derived state
  const badgeType = design?.badge_type || 'standard';

  const addEntry = () => {
    setNameEntries([
      ...nameEntries, 
      { id: Date.now(), fields: Array(4).fill(''), quantity: 1 }
    ]);
    setHasChanges(true);
  };

  const addBlankBadges = (count) => {
    setNameEntries([
      ...nameEntries,
      { id: Date.now(), fields: Array(4).fill(''), quantity: count, isBlank: true }
    ]);
    setHasChanges(true);
    toast.success(`Added ${count} blank badge${count > 1 ? 's' : ''}`);
  };

  const duplicateEntry = (entry) => {
    setNameEntries([
      ...nameEntries,
      { id: Date.now(), fields: [...entry.fields], quantity: entry.quantity || 1 }
    ]);
    setHasChanges(true);
  };

  const updateQuantity = (entryId, newQty) => {
    if (newQty < 1) return;
    setNameEntries(nameEntries.map(entry => 
      entry.id === entryId ? { ...entry, quantity: newQty } : entry
    ));
    setHasChanges(true);
  };

  const removeEntry = (id) => {
    if (nameEntries.length === 1) {
      toast.error('You need at least one badge');
      return;
    }
    setNameEntries(nameEntries.filter(e => e.id !== id));
    setHasChanges(true);
  };

  const updateField = (entryId, fieldIndex, value) => {
    setNameEntries(nameEntries.map(entry => {
      if (entry.id === entryId) {
        const newFields = [...entry.fields];
        newFields[fieldIndex] = value;
        return { ...entry, fields: newFields };
      }
      return entry;
    }));
    setHasChanges(true);
  };

  const addMultipleEntries = (count) => {
    const newEntries = Array(count).fill(null).map((_, i) => ({
      id: Date.now() + i,
      fields: Array(4).fill(''),
      quantity: 1,
    }));
    setNameEntries([...nameEntries, ...newEntries]);
    setHasChanges(true);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if it looks like headers
      const startIndex = lines[0]?.toLowerCase().includes('line') || lines[0]?.toLowerCase().includes('name') ? 1 : 0;
      
      const newEntries = lines.slice(startIndex).map((line, i) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const fields = Array(4).fill('');
        values.forEach((v, j) => {
          if (j < 4) fields[j] = v;
        });
        return { id: Date.now() + i, fields };
      });

      if (newEntries.length > 0) {
        setNameEntries(newEntries);
        setHasChanges(true);
        toast.success(`Imported ${newEntries.length} names from CSV`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = textElements.map((el, i) => el.text !== 'Your Text' ? el.text : `Line ${i + 1}`).join(',');
    const example1 = textElements.map((_, i) => i === 0 ? 'John Smith' : i === 1 ? 'Sales Manager' : '').join(',');
    const example2 = textElements.map((_, i) => i === 0 ? 'Jane Doe' : i === 1 ? 'Marketing Director' : '').join(',');
    const csv = `${headers}\n${example1}\n${example2}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'name_badges_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateNamesCSV = () => {
    const headers = textElements.map((el, i) => el.text !== 'Your Text' ? el.text : `Line ${i + 1}`).join(',');
    const rows = nameEntries
      .map(entry => entry.fields.slice(0, textFieldsCount).map(f => `"${f}"`).join(','));
    return `${headers}\n${rows.join('\n')}`;
  };

  const downloadNamesList = () => {
    const csv = generateNamesCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'badge_names_list.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Names list downloaded');
  };

  // Calculate pricing - count total badges including quantities and blanks
  const totalBadgeCount = nameEntries.reduce((sum, entry) => {
    return sum + (entry.quantity || 1);
  }, 0);
  const validEntries = nameEntries;
  const quantity = totalBadgeCount || 1; // Avoid 0 division or issues
  
  const pricing = calculateNameBadgePrice({
    sizeShape: design?.size_shape,
    background: design?.background,
    border: design?.border,
    fastener: design?.fastener,
    dome: design?.dome,
    quantity: quantity
  });
  
  const unitPrice = pricing.unitPrice;
  const totalPrice = pricing.totalPrice;
  const basePrice = pricing.basePrice;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const orderData = {
        design_id: designId,
        names_data_json: JSON.stringify(nameEntries),
        quantity: totalBadgeCount,
        badge_type: badgeType,
        unit_price: unitPrice,
        total_price: totalPrice,
        size_shape: design?.size_shape,
        fastener: design?.fastener,
        dome: design?.dome,
        border: design?.border,
        background: design?.background,
        thumbnail_url: design?.thumbnail_url,
        is_in_cart: false,
      };

      if (existingOrder) {
        await base44.entities.NameBadgeOrder.update(existingOrder.id, orderData);
      } else {
        await base44.entities.NameBadgeOrder.create(orderData);
      }
      
      setHasChanges(false);
      toast.success('Names saved!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (totalBadgeCount === 0) {
      toast.error('Please add at least one badge (name or blank)');
      return;
    }

    setIsAddingToCart(true);
    try {
      // Generate CSV for production
      const csvContent = generateNamesCSV();
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvFile = new File([csvBlob], 'badge_names.csv', { type: 'text/csv' });
      const { file_url: csvUrl } = await base44.integrations.Core.UploadFile({ file: csvFile });

      const ownerInfo = await getUserOrSession();
      const sessionId = getSessionId();

      const orderData = {
        design_id: designId,
        names_data_json: JSON.stringify(validEntries),
        quantity: totalBadgeCount,
        badge_type: badgeType,
        unit_price: unitPrice,
        total_price: totalPrice,
        size_shape: design?.size_shape,
        fastener: design?.fastener,
        dome: design?.dome,
        border: design?.border,
        background: design?.background,
        thumbnail_url: design?.thumbnail_url,
        names_csv_url: csvUrl,
        is_in_cart: true,
        session_id: ownerInfo.type === 'user' ? null : sessionId,
      };

      if (existingOrder) {
        await base44.entities.NameBadgeOrder.update(existingOrder.id, orderData);
      } else {
        await base44.entities.NameBadgeOrder.create(orderData);
      }

      toast.success('Added to cart!');
      navigate(createPageUrl('Cart'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Design not found</h2>
          <Link to={createPageUrl('NameBadgeDesigner')}>
            <Button>Start New Design</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => hasChanges ? setConfirmBackOpen(true) : navigate(createPageUrl('NameBadgeDesigner') + `?designId=${designId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back to Design</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Add Names</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
              <div className="flex items-center gap-3">
                <Link 
                  to={createPageUrl('NameBadgeDesigner') + `?designId=${designId}`}
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit Design
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white">
              <span className="font-medium">1. Design Your Badge ✓</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white">
              <span className="font-medium">2. Add Names</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-600">
              <span className="font-medium">3. Complete Order</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Names Entry */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enter Names for Each Badge</h2>
                  <p className="text-sm text-gray-500">
                    Your design has {textFieldsCount} text field{textFieldsCount > 1 ? 's' : ''} per badge
                  </p>
                </div>
                <div className="flex gap-2">
                  <label>
                    <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                  </label>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                  {validEntries.length > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadNamesList}>
                      <Download className="w-4 h-4 mr-2" />
                      Export List
                    </Button>
                  )}
                </div>
              </div>

              {/* Spreadsheet-like Grid */}
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="grid bg-gray-100 border-b" style={{ gridTemplateColumns: `50px repeat(${textFieldsCount}, 1fr) 100px 100px` }}>
                  <div className="p-3 text-xs font-bold text-gray-500 text-center">#</div>
                  {textElements.slice(0, textFieldsCount).map((el, i) => (
                    <div key={i} className="p-3 text-xs font-bold text-gray-500 border-l">
                      {el.text !== 'Your Text' ? el.text : `Line ${i + 1}`}
                    </div>
                  ))}
                  <div className="p-3 text-xs font-bold text-gray-500 text-center border-l">Qty</div>
                  <div className="p-3 text-xs font-bold text-gray-500 text-center border-l">Actions</div>
                </div>

                {/* Rows */}
                <div className="max-h-[600px] overflow-y-auto">
                  {nameEntries.map((entry, entryIndex) => (
                    <div 
                      key={entry.id} 
                      className={`grid items-center border-b last:border-0 hover:bg-blue-50 transition-colors ${entry.isBlank ? 'bg-amber-50' : 'bg-white'}`}
                      style={{ gridTemplateColumns: `50px repeat(${textFieldsCount}, 1fr) 100px 100px` }}
                    >
                      <div className="p-2 text-center text-sm text-gray-400">{entryIndex + 1}</div>
                      
                      {entry.isBlank ? (
                        <div className="col-span-full md:col-span-[var(--span)] p-2 text-center text-amber-700 font-medium italic" style={{ '--span': textFieldsCount }}>
                          Blank Badge (Logo Only)
                        </div>
                      ) : (
                        Array(textFieldsCount).fill(null).map((_, fieldIndex) => (
                          <div key={fieldIndex} className="p-1 border-l h-full">
                            <input
                              className="w-full h-full px-2 py-1.5 text-sm bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded"
                              value={entry.fields[fieldIndex] || ''}
                              onChange={(e) => updateField(entry.id, fieldIndex, e.target.value)}
                              placeholder={textElements[fieldIndex]?.text !== 'Your Text' ? textElements[fieldIndex]?.text : `Line ${fieldIndex + 1}`}
                            />
                          </div>
                        ))
                      )}

                      <div className="p-2 border-l flex items-center justify-center gap-1">
                        <button 
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500"
                          onClick={() => updateQuantity(entry.id, (entry.quantity || 1) - 1)}
                          disabled={(entry.quantity || 1) <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input 
                          className="w-8 text-center text-sm font-medium bg-transparent outline-none"
                          value={entry.quantity || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (val > 0) updateQuantity(entry.id, val);
                          }}
                        />
                        <button 
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500"
                          onClick={() => updateQuantity(entry.id, (entry.quantity || 1) + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="p-2 border-l flex justify-center gap-1">
                        <button 
                          onClick={() => duplicateEntry(entry)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Duplicate Row"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeEntry(entry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remove Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add More */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" onClick={addEntry}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Name
                </Button>
                <Button variant="outline" onClick={() => addMultipleEntries(5)}>
                  +5 Rows
                </Button>
                <Button variant="outline" onClick={() => addMultipleEntries(10)}>
                  +10 Rows
                </Button>
                <div className="h-8 w-px bg-gray-200" />
                <Button variant="outline" onClick={() => addBlankBadges(1)} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Blank Badge
                </Button>
                <Button variant="outline" onClick={() => addBlankBadges(10)} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  +10 Blank
                </Button>
                <Button variant="outline" onClick={() => addBlankBadges(25)} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  +25 Blank
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                💡 Tip: Use quantity to order multiple of the same name. Add blank badges for logo-only badges you'll write on by hand.
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

              {/* Badge Preview */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div 
                  className="mx-auto bg-white rounded shadow-sm flex items-center justify-center text-xs text-gray-400"
                  style={{
                    width: 150,
                    height: design.size_shape?.includes('2x3') ? 100 : design.size_shape?.includes('1.5') ? 75 : 50,
                    borderRadius: design.size_shape?.includes('oval') ? '50%' : '4px',
                    border: design.border !== 'none' ? `3px solid ${design.border === 'gold' ? '#D4AF37' : design.border === 'silver' ? '#C0C0C0' : design.border === 'rose-gold' ? '#B76E79' : '#000'}` : '1px solid #e5e7eb',
                  }}
                >
                  {validEntries[0]?.fields[0] || 'Preview'}
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  {design.size_shape?.replace(/-/g, ' ').replace('rectangle', 'Rectangle').replace('oval', 'Oval')}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Badges</span>
                  <span className="font-medium">{totalBadgeCount} badge{totalBadgeCount !== 1 ? 's' : ''}</span>
                </div>
                {validEntries.some(e => e.isBlank) && (
                  <div className="flex justify-between text-amber-600">
                    <span>Blank (logo only)</span>
                    <span>{validEntries.filter(e => e.isBlank).reduce((sum, e) => sum + (e.quantity || 1), 0)}</span>
                  </div>
                )}
                {validEntries.some(e => !e.isBlank && (e.quantity || 1) > 1) && (
                  <div className="flex justify-between text-blue-600">
                    <span>With duplicates</span>
                    <span>{validEntries.filter(e => !e.isBlank).reduce((sum, e) => sum + (e.quantity || 1), 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Base price</span>
                  <span className="font-medium">${basePrice.toFixed(2)}/ea</span>
                </div>
                {pricing.discountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Volume Discount ({(pricing.discountPercent * 100).toFixed(0)}%)</span>
                    <span>-${(basePrice * pricing.discountPercent).toFixed(2)}/ea</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Fastener</span>
                  <span className="font-medium capitalize">{design.fastener?.replace('-', ' ')}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit price</span>
                    <span className="font-medium">${unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span>Total</span>
                    <span className="text-green-600">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Success Message when names are entered */}
              {totalBadgeCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-medium text-center">
                    ✓ {totalBadgeCount} badge{totalBadgeCount !== 1 ? 's' : ''} ready!
                  </p>
                  <p className="text-green-600 text-sm text-center mt-1">
                    Click "Add to Cart" when finished
                  </p>
                </div>
              )}

              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
                onClick={handleAddToCart}
                disabled={isAddingToCart || totalBadgeCount === 0}
              >
                {isAddingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                I'm Finished - Add to Cart
              </Button>

              <div className="flex gap-2 mt-3">
                <Link 
                  to={createPageUrl('NameBadgeDesigner') + `?designId=${designId}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Edit Design
                  </Button>
                </Link>
                <Button variant="outline" className="flex-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Draft
                </Button>
              </div>

              {/* Volume Pricing Table */}
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">Volume Pricing (Per Badge)</p>
                </div>
                <div className="divide-y text-xs">
                  {QUANTITY_TIERS.map((tier) => {
                    const label = tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max}`;
                    const isActive = totalBadgeCount >= tier.min && totalBadgeCount <= tier.max;
                    
                    // Calculate price for this tier for THIS specific badge configuration
                    const tierPrice = calculateNameBadgePrice({
                        sizeShape: design.size_shape,
                        background: design.background,
                        border: design.border,
                        fastener: design.fastener,
                        dome: design.dome,
                        quantity: tier.min // use min to get the rate
                    }).unitPrice;

                    return (
                      <div 
                        key={label} 
                        className={`flex justify-between px-3 py-2 ${isActive ? 'bg-green-50 font-medium text-green-700' : 'text-gray-600'}`}
                      >
                        <span>{label}</span>
                        <span>${tierPrice.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Back Dialog */}
      <AlertDialog open={confirmBackOpen} onOpenChange={setConfirmBackOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save before going back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate(createPageUrl('NameBadgeDesigner') + `?designId=${designId}`)}>
              Don't Save
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                await handleSave();
                navigate(createPageUrl('NameBadgeDesigner') + `?designId=${designId}`);
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Save & Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}