import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, Search, Edit, Trash2, Image, DollarSign,
  Star, Eye, EyeOff, Loader2, MoreVertical, CheckSquare, Square, GripVertical,
  ChevronDown, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ProductEditor from './ProductEditor';
import BulkPriceEditor from './BulkPriceEditor';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ScrollArea } from '@/components/ui/scroll-area';

// Build hierarchical category tree from flat database data (recursive for unlimited nesting)
const buildCategoryTree = (categories) => {
  // Recursive function to build subcategories at any depth
  const buildSubcategories = (parentId) => {
    return categories
      .filter(c => c.parent_id === parentId)
      .map(cat => ({
        name: cat.name,
        slug: cat.slug,
        id: cat.id,
        subcategories: buildSubcategories(cat.id)
      }));
  };

  const rootCategories = categories.filter(c => !c.parent_id);
  return [
    { name: 'All Products', slug: 'all-products' },
    ...rootCategories.map(parent => ({
      name: parent.name,
      slug: parent.slug,
      id: parent.id,
      subcategories: buildSubcategories(parent.id)
    }))
  ];
};

// Recursive Category Sidebar Item
const CategorySidebarItem = ({ item, selectedSlug, onSelect, level = 0 }) => {
  const hasChildren = item.subcategories && item.subcategories.length > 0;
  
  const checkActive = (cat) => {
    if (cat.slug === selectedSlug) return true;
    if (cat.subcategories) {
      return cat.subcategories.some(sub => checkActive(sub));
    }
    return false;
  };
  
  const isSelfActive = item.slug === selectedSlug;
  const isChildActive = hasChildren && checkActive(item) && !isSelfActive;
  
  const [isExpanded, setIsExpanded] = useState(
    item.expanded || isChildActive || isSelfActive
  );

  const paddingLeft = level === 0 ? 12 : 12 + (level * 12); 

  if (!hasChildren) {
    return (
      <button 
        onClick={() => onSelect(item.slug)}
        className={`w-full text-left block py-2 pr-4 text-sm transition-colors rounded-r-lg border-l-2 my-1 ${
          isSelfActive
            ? 'border-primary text-primary font-medium bg-primary/10' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted hover:border-muted-foreground/20'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {item.name}
      </button>
    );
  }

  return (
    <div className="border-b last:border-0 border-border/30">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between py-3 pr-4 text-sm font-medium transition-colors hover:bg-muted rounded-r-lg my-1 ${
          (isSelfActive || isChildActive) ? 'text-primary' : 'text-foreground'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <span className={level === 0 ? "font-bold" : ""}>{item.name}</span>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      
      {isExpanded && (
        <div className="pb-1">
          {item.subcategories.map((sub, idx) => (
            <CategorySidebarItem 
              key={sub.slug || idx} 
              item={sub} 
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProductsManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all-products');
  const [localProducts, setLocalProducts] = useState([]);

  // Fetch products from Supabase
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories from Supabase
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created');
      setShowDialog(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: updated, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated');
      setShowDialog(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    }
  });

  // Filter products based on selected category and search
  useEffect(() => {
    let filtered = [...products];

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Filter by category slug
    if (selectedCategorySlug && selectedCategorySlug !== 'all-products') {
      const category = categories.find(c => c.slug === selectedCategorySlug);
      if (category) {
        filtered = filtered.filter(p => p.category_id === category.id);
      }
    }

    setLocalProducts(filtered);
  }, [products, searchQuery, selectedCategorySlug, categories]);

  const handleDragEnd = (result) => {
    if (!result.destination || selectedCategorySlug === 'all-products') return;

    const items = Array.from(localProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalProducts(items);

    // Update orders in database
    items.forEach((item, index) => {
      updateMutation.mutate({ id: item.id, data: { order: index + 1 } });
    });
  };

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
    if (selectedIds.length === localProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localProducts.map(p => p.id));
    }
  };

  const toggleActive = (product) => {
    updateMutation.mutate({ 
      id: product.id, 
      data: { is_active: !product.is_active } 
    });
  };

  const toggleFeatured = (product) => {
    updateMutation.mutate({ 
      id: product.id, 
      data: { is_featured: !product.is_featured } 
    });
  };

  // Build dynamic category tree from database
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const getCategoryName = () => {
    if (selectedCategorySlug === 'all-products') return 'All Products';
    
    // Find in dynamic category tree
    const findName = (items) => {
      for (const item of items) {
        if (item.slug === selectedCategorySlug) return item.name;
        if (item.subcategories) {
          const found = findName(item.subcategories);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findName(categoryTree) || 'Products';
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Category Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <div className="bg-card rounded-xl border shadow-sm h-full">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-foreground">Categories</h3>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2">
              {categoryTree.map((cat, idx) => (
                <CategorySidebarItem 
                  key={cat.slug || idx} 
                  item={cat} 
                  selectedSlug={selectedCategorySlug}
                  onSelect={setSelectedCategorySlug}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-foreground">{getCategoryName()}</h2>
            <div className="flex items-center gap-2">
              {selectedCategorySlug !== 'all-products' && (
                <Badge variant="secondary">
                  Drag & Drop Enabled
                </Badge>
              )}
              {selectedIds.length > 0 && (
                <Button variant="outline" onClick={() => setShowBulkEditor(true)}>
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

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Selection Header */}
        {localProducts.length > 0 && (
          <div className="flex items-center gap-2 pb-2 px-1">
            <button 
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {selectedIds.length === localProducts.length && localProducts.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{localProducts.length} products</span>
            {selectedIds.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">|</span>
                <span className="text-sm text-primary font-medium">{selectedIds.length} selected</span>
              </>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : localProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mb-4 opacity-50" />
              <p>No products found</p>
              {searchQuery && <p className="text-sm">Try adjusting your search</p>}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="products-grid" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4"
                  >
                    {localProducts.map((product, index) => (
                      <Draggable 
                        key={product.id} 
                        draggableId={product.id} 
                        index={index}
                        isDragDisabled={selectedCategorySlug === 'all-products'}
                      >
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-card rounded-xl border overflow-hidden relative group ${
                              !product.is_active ? 'opacity-60' : ''
                            } ${
                              selectedIds.includes(product.id) ? 'ring-2 ring-primary' : ''
                            } ${
                              snapshot.isDragging ? 'shadow-2xl ring-2 ring-green-500 z-50' : ''
                            }`}
                          >
                            {/* Drag Handle */}
                            {selectedCategorySlug !== 'all-products' && (
                              <div 
                                {...provided.dragHandleProps}
                                className="absolute top-2 left-12 z-10 bg-background/90 rounded p-1 cursor-grab active:cursor-grabbing hover:bg-muted"
                              >
                                <GripVertical className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}

                            {/* Selection Checkbox */}
                            <div className="absolute top-2 left-2 z-10">
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}
                                className="bg-background/90 rounded shadow-sm p-1 hover:bg-background"
                              >
                                {selectedIds.includes(product.id) ? (
                                  <CheckSquare className="w-5 h-5 text-primary" />
                                ) : (
                                  <Square className="w-5 h-5 text-muted-foreground" />
                                )}
                              </button>
                            </div>

                            {/* Product Image */}
                            <div 
                              className="aspect-video bg-muted relative cursor-pointer" 
                              onClick={() => { setEditingProduct(product); setShowDialog(true); }}
                            >
                              {(product.image_url || product.images?.[0] || product.gallery_images?.[0]) ? (
                                <img 
                                  src={product.image_url || product.images?.[0] || product.gallery_images?.[0]} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Image className="w-12 h-12 text-muted-foreground/30" />
                                </div>
                              )}
                              {product.is_featured && (
                                <Badge className="absolute top-2 right-12 bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Featured
                                </Badge>
                              )}
                              {!product.is_active && (
                                <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Hidden
                                </Badge>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium line-clamp-1 text-foreground" title={product.name}>
                                    {product.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground truncate">{product.slug}</p>
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
                                    <DropdownMenuItem onClick={() => toggleFeatured(product)}>
                                      <Star className="w-4 h-4 mr-2" />
                                      {product.is_featured ? 'Remove Featured' : 'Mark Featured'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => deleteMutation.mutate(product.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="mt-2">
                                <span className="text-lg font-bold text-green-600">
                                  ${product.base_price?.toFixed(2) || '0.00'}
                                </span>
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
        </div>
      </div>

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
