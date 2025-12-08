import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Search, Edit, Trash2, Image, DollarSign, Package,
  Star, Eye, EyeOff, Loader2, MoreVertical, Upload, CheckSquare, Square, GripVertical
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ProductEditor from './ProductEditor';
import BulkPriceEditor from './BulkPriceEditor';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ProductsManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localProducts, setLocalProducts] = useState([]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('order'), // Fetch sorted by order initially
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ProductCategory.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created');
      setShowDialog(false);
      setEditingProduct(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated');
      setShowDialog(false);
      setEditingProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
  });

  // Update local state when products change or filtering changes
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
        filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter(p => 
            p.category_id === selectedCategory || 
            (p.additional_category_ids && p.additional_category_ids.includes(selectedCategory))
        );
        // Sort by order when in a specific category for drag and drop
        filtered.sort((a, b) => (a.order || 9999) - (b.order || 9999));
    }

    setLocalProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const handleDragEnd = (result) => {
    if (!result.destination || selectedCategory === 'all') return;

    const items = Array.from(localProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalProducts(items);

    // Update orders
    items.forEach((item, index) => {
        if (item.order !== index + 1) {
            updateMutation.mutate({ id: item.id, data: { order: index + 1 } });
        }
    });
  };

  const filteredProducts = localProducts; // Use local state for rendering

  const handleSave = (formData) => {
    if (editingProduct?.id) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleActive = (product) => {
    updateMutation.mutate({ 
      id: product.id, 
      data: { is_active: !product.is_active } 
    });
  };

  const togglePopular = (product) => {
    updateMutation.mutate({ 
      id: product.id, 
      data: { is_popular: !product.is_popular } 
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full">
            <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
                placeholder="Search products..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory !== 'all' && (
             <Badge variant="secondary" className="mr-2">
                 Drag & Drop Enabled
             </Badge>
          )}
          {selectedIds.length > 0 && (
            <Button variant="outline" onClick={() => setShowBulkEditor(true)} className="mr-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Edit Prices ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => { setEditingProduct({}); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Selection Header */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center gap-2 pb-2 px-1">
          <button 
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Select All
          </button>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="products-grid" direction="horizontal">
                {(provided) => (
                    <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                    {filteredProducts.map((product, index) => (
                        <Draggable 
                            key={product.id} 
                            draggableId={product.id} 
                            index={index}
                            isDragDisabled={selectedCategory === 'all'}
                        >
                            {(provided, snapshot) => (
                                <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white rounded-xl border overflow-hidden relative group ${!product.is_active ? 'opacity-60' : ''} ${selectedIds.includes(product.id) ? 'ring-2 ring-blue-500' : ''} ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-green-500 z-50' : ''}`}
                                >
                                {/* Drag Handle - Only show when category selected */}
                                {selectedCategory !== 'all' && (
                                    <div 
                                        {...provided.dragHandleProps}
                                        className="absolute top-2 left-10 z-10 bg-white/90 rounded p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100"
                                    >
                                        <GripVertical className="w-5 h-5 text-gray-500" />
                                    </div>
                                )}

                                {/* Selection Checkbox */}
                                <div className="absolute top-2 left-2 z-10">
                                    <button 
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}
                                    className="bg-white/90 rounded shadow-sm p-1 hover:bg-white"
                                    >
                                    {selectedIds.includes(product.id) ? (
                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                    </button>
                                </div>

                                <div className="aspect-video bg-gray-100 relative cursor-pointer" onClick={() => { setEditingProduct(product); setShowDialog(true); }}>
                                    {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Image className="w-12 h-12 text-gray-300" />
                                    </div>
                                    )}
                                    {product.is_popular && (
                                    <Badge className="absolute top-2 right-12 bg-yellow-100 text-yellow-800">
                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                        Popular
                                    </Badge>
                                    )}
                                    {!product.is_active && (
                                    <Badge className="absolute top-2 right-2 bg-gray-800 text-white">
                                        <EyeOff className="w-3 h-3 mr-1" />
                                        Hidden
                                    </Badge>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium line-clamp-1" title={product.name}>{product.name}</h3>
                                        <p className="text-sm text-gray-500">{product.slug}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setEditingProduct(product); setShowDialog(true); }}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toggleActive(product)}>
                                            {product.is_active ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                            {product.is_active ? 'Hide' : 'Show'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => togglePopular(product)}>
                                            <Star className="w-4 h-4 mr-2" />
                                            {product.is_popular ? 'Remove Popular' : 'Mark Popular'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => deleteMutation.mutate(product.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-bold text-green-600">
                                        ${product.base_price?.toFixed(2) || '0.00'}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        {product.average_rating?.toFixed(1) || '0.0'}
                                        <span>({product.review_count || 0})</span>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
      )}

      {/* Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductEditor 
            product={editingProduct}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Editor */}
      {showBulkEditor && (
        <BulkPriceEditor 
          selectedProducts={products.filter(p => selectedIds.includes(p.id))}
          onClose={() => setShowBulkEditor(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setShowBulkEditor(false);
            toast.success('Prices updated');
          }}
        />
      )}
    </div>
  );
}