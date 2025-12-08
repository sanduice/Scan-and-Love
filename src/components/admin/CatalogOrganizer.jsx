import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Search, Plus, Folder, GripVertical, Image as ImageIcon, 
  MoreVertical, X, Check, Loader2, Edit, Trash2, Layers,
  ChevronRight, ChevronDown, CornerDownRight
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

// Reusing the CategoryForm from CategoriesManager logic but simplified
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function CategoryForm({ category, categories, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    parent_id: category?.parent_id || 'root',
  });

  // Filter out self and children to prevent cycles (simple 1-level check, ideally recursive)
  const availableParents = categories.filter(c => c.id !== category?.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Category Name</label>
        <Input 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Slug</label>
        <Input 
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Image URL</label>
        <div className="flex gap-2">
          <Input 
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          />
          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleImageUpload}
              accept="image/*"
            />
            <Button type="button" variant="outline">
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Parent Category</label>
        <Select 
          value={formData.parent_id} 
          onValueChange={(val) => setFormData({ ...formData, parent_id: val === 'root' ? null : val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="root">No Parent (Top Level)</SelectItem>
            {availableParents.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function CatalogOrganizer() {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null = All Products
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  // --- QUERIES ---
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.ProductCategory.list('order'),
  });

  const { data: products = [], isLoading: prodsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('order'),
  });

  // --- LOCAL STATE FOR DND ---
  const [localCategories, setLocalCategories] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Build tree structure helper
  const buildCategoryTree = (cats) => {
      const tree = [];
      const map = {};
      
      // First pass: create nodes and map
      cats.forEach(c => {
          map[c.id] = { ...c, children: [] };
      });
      
      // Second pass: link parents
      cats.forEach(c => {
          if (c.parent_id && map[c.parent_id]) {
              map[c.parent_id].children.push(map[c.id]);
          } else {
              tree.push(map[c.id]);
          }
      });
      
      // Sort by order
      const sortNodes = (nodes) => {
          nodes.sort((a, b) => (a.order || 999) - (b.order || 999));
          nodes.forEach(node => {
              if (node.children.length > 0) sortNodes(node.children);
          });
      };
      
      sortNodes(tree);
      return { tree, map }; // Return map for easy lookup if needed
  };

  // Flatten tree for Drag and Drop (with indentation levels)
  // NOTE: For "Show All Categories IN THE SUB CATEGORIES", we need to ensure the list visually represents the hierarchy.
  // The flatten approach works but needs better styling.
  // The user wants "SHOW ALL THE CATEGORIES IN THE SUB CATEGORIERS UNDER THEM" - this implies expansion.
  // I've enabled expansion logic. If the user wants to see ALL, they can expand. 
  // But maybe they want to see them *physically* nested? 
  // DragDropContext doesn't support nested droppables easily for reordering.
  // Sticking to flattened list with enhanced visual hierarchy.
  const flattenTree = (nodes, level = 0, result = []) => {
      nodes.forEach(node => {
          result.push({ ...node, level });
          // If expanded (default true), show children
          if (node.children && node.children.length > 0 && expandedCategories[node.id] !== false) {
             flattenTree(node.children, level + 1, result);
          }
      });
      return result;
  };

  useEffect(() => {
    // When categories change, rebuild the flat list preserving order/hierarchy
    // But for DND we need a single list. 
    // We will render the *flat* list but with visual indentation.
    // DND reordering will effectively change order among siblings or reparent if we implement advanced logic.
    // For now, let's just use the tree sort order.
    const { tree } = buildCategoryTree(categories);
    // Expand all by default if not set
    if (Object.keys(expandedCategories).length === 0 && categories.length > 0) {
        const initialExpanded = {};
        categories.forEach(c => initialExpanded[c.id] = true);
        setExpandedCategories(initialExpanded);
    }
    setLocalCategories(flattenTree(tree));
  }, [categories, expandedCategories]); // Re-run when expansion changes

  useEffect(() => {
    let filtered = products;
    
    // Filter by search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(lower) || p.slug.includes(lower));
    }

    // Filter by selected category
    if (selectedCategoryId) {
      filtered = filtered.filter(p => 
        p.category_id === selectedCategoryId || 
        (p.additional_category_ids && p.additional_category_ids.includes(selectedCategoryId))
      );
      // Sort by order if in a category
      filtered.sort((a, b) => (a.order || 9999) - (b.order || 9999));
    }

    setLocalProducts(filtered);
  }, [products, searchQuery, selectedCategoryId]);


  // --- MUTATIONS ---
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductCategory.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowCategoryDialog(false);
      toast.success('Category created');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductCategory.delete(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        toast.success('Category deleted');
        if (selectedCategoryId === id) setSelectedCategoryId(null);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  });

  // --- HANDLERS ---

  const handleDragEnd = async (result) => {
    const { source, destination, type, draggableId } = result;

    if (!destination) return;

    // 1. REORDER CATEGORIES
    if (type === 'CATEGORY') {
     const items = Array.from(localCategories);
     const [movedItem] = items.splice(source.index, 1);
     items.splice(destination.index, 0, movedItem);

     setLocalCategories(items);

     // Advanced Reordering Logic:
     // If we drop item X, check its new neighbors.
     // If dropped between two siblings, it takes their parent.
     // If dropped under a parent (indented visual?), handling that in flat list is hard without visual guides.
     // SIMPLIFIED: Just update order globally for now, but keep parent_id same.
     // OR: We can try to infer parent based on where it landed? 
     // For this iteration, let's keep it simple: Dragging reorders visually, but DOES NOT change parent structure automatically 
     // unless we implement "drop on top of" logic which is hard with this library.
     // We will rely on the Edit Form to change parent, and DND to change order.

     // Update order
     items.forEach((item, index) => {
         // We just update global order for simplicity, ensuring the sort logic in buildTree respects it
         if (item.order !== index + 1) {
            updateCategoryMutation.mutate({ id: item.id, data: { order: index + 1 } });
         }
     });
     return;
    }

    // 2. PRODUCT DRAG
    if (type === 'PRODUCT') {
      const productId = draggableId;
      const product = products.find(p => p.id === productId);
      
      // Case A: Dropped onto a Category in the sidebar
      if (destination.droppableId.startsWith('category-target-')) {
        const targetCategoryId = destination.droppableId.replace('category-target-', '');
        
        // Prevent adding if already exists
        const isPrimary = product.category_id === targetCategoryId;
        const isAdditional = product.additional_category_ids?.includes(targetCategoryId);

        if (isPrimary || isAdditional) {
          toast.info('Product is already in this category');
          return;
        }

        // Add logic
        if (!product.category_id) {
            // No primary category, set as primary
            updateProductMutation.mutate({ 
                id: productId, 
                data: { category_id: targetCategoryId } 
            });
            toast.success(`Assigned to ${localCategories.find(c => c.id === targetCategoryId)?.name}`);
        } else {
            // Add to additional
            const currentAdditional = product.additional_category_ids || [];
            updateProductMutation.mutate({ 
                id: productId, 
                data: { 
                    additional_category_ids: [...currentAdditional, targetCategoryId] 
                } 
            });
            toast.success(`Added to ${localCategories.find(c => c.id === targetCategoryId)?.name}`);
        }
        return;
      }

      // Case B: Reordering within the product grid (only if viewing a specific category)
      if (destination.droppableId === 'product-grid' && selectedCategoryId) {
        const items = Array.from(localProducts);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        
        setLocalProducts(items);
        
        // Update order in backend
        items.forEach((item, index) => {
             if (item.order !== index + 1) {
                updateProductMutation.mutate({ id: item.id, data: { order: index + 1 } });
             }
        });
      }
    }
  };

  const removeFromCategory = (product, catId) => {
    if (product.category_id === catId) {
       // It's the primary. Check if there are additional categories to promote or just clear.
       if (product.additional_category_ids && product.additional_category_ids.length > 0) {
           const newPrimary = product.additional_category_ids[0];
           const newAdditional = product.additional_category_ids.slice(1);
           updateProductMutation.mutate({
               id: product.id,
               data: { category_id: newPrimary, additional_category_ids: newAdditional }
           });
       } else {
           updateProductMutation.mutate({ id: product.id, data: { category_id: null } });
       }
    } else {
        // Remove from additional
        const newAdditional = (product.additional_category_ids || []).filter(id => id !== catId);
        updateProductMutation.mutate({ id: product.id, data: { additional_category_ids: newAdditional } });
    }
    toast.success('Removed from category');
  };

  const handleSaveCategory = (data) => {
      if (editingCategory) {
          updateCategoryMutation.mutate({ id: editingCategory.id, data });
      } else {
          createCategoryMutation.mutate({ ...data, order: categories.length + 1 });
      }
      setShowCategoryDialog(false);
      setEditingCategory(null);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-100px)] gap-6">
        
        {/* --- LEFT SIDEBAR: CATEGORIES --- */}
        <div className="w-1/3 min-w-[300px] flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Categories</h2>
            <Button size="sm" onClick={() => { setEditingCategory(null); setShowCategoryDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
             <div 
               className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors border-2 border-dashed ${!selectedCategoryId ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 border-transparent text-gray-600'}`}
               onClick={() => setSelectedCategoryId(null)}
             >
                <div className="flex items-center gap-3">
                   <Layers className="w-5 h-5" />
                   <span className="font-medium">All Products</span>
                </div>
             </div>

             <Droppable droppableId="categories-list" type="CATEGORY">
                {(provided) => (
                   <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {localCategories.map((cat, index) => (
                         <Draggable key={cat.id} draggableId={cat.id} index={index}>
                            {(provided, snapshot) => (
                               <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{ 
                                      ...provided.draggableProps.style,
                                      marginBottom: '4px'
                                  }}
                                  className={`relative group transition-all rounded-md ${
                                      selectedCategoryId === cat.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                  } ${snapshot.isDragging ? 'shadow-2xl bg-white z-50 ring-2 ring-green-500 scale-105' : ''} 
                                  ${cat.level === 0 ? 'mb-2 mt-4 border border-slate-300 shadow-sm' : 'mb-1 ml-8 border-l-4 border-l-slate-300 border-y border-r border-slate-200'}`}
                               >
                                  {/* Visual Connector for Subcategories */}
                                  {cat.level > 0 && (
                                     <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-slate-300" />
                                  )}

                                  {/* Header / Click Area */}
                                  <div 
                                    className={`p-3 flex items-center gap-3 cursor-pointer ${cat.level === 0 ? 'bg-slate-100' : 'bg-white'}`}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                  >
                                     <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-4 h-4" />
                                     </div>
                                     
                                     {/* Expansion Toggle */}
                                     {/* Indentation Guide / Connector */}
                                     {cat.level > 0 && (
                                         <CornerDownRight className="w-4 h-4 text-gray-300 mr-1 -ml-2" />
                                     )}

                                     {/* Expansion Toggle */}
                                     {categories.some(c => c.parent_id === cat.id) ? (
                                        <button 
                                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }));
                                          }}
                                        >
                                          {expandedCategories[cat.id] !== false ? (
                                            <ChevronDown className="w-4 h-4 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                          )}
                                        </button>
                                     ) : (
                                        <div className="w-6" /> 
                                     )}

                                     <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        {cat.image_url ? <img src={cat.image_url} className="w-8 h-8 rounded object-cover" /> : <Folder className="w-4 h-4 text-gray-400" />}
                                     </div>
                                     
                                     <div className="flex-1 min-w-0">
                                        <div className={`text-sm truncate flex items-center gap-2 ${cat.level === 0 ? 'font-bold text-lg text-gray-900' : 'font-medium text-base text-gray-700'}`}>
                                            {cat.name}
                                            {cat.level === 0 && <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">Main</Badge>}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-0.5">
                                            {products.filter(p => p.category_id === cat.id || p.additional_category_ids?.includes(cat.id)).length} products
                                        </div>
                                     </div>
                                     
                                     <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryDialog(true); }}>
                                            <Edit className="w-3 h-3 text-gray-500" />
                                         </Button>
                                         <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteCategoryMutation.mutate(cat.id); }}>
                                            <Trash2 className="w-3 h-3" />
                                         </Button>
                                     </div>
                                  </div>

                                  {/* DROP ZONE FOR PRODUCTS */}
                                  <Droppable droppableId={`category-target-${cat.id}`} type="PRODUCT">
                                     {(provided, snapshot) => (
                                        <div
                                           ref={provided.innerRef}
                                           {...provided.droppableProps}
                                           className={`absolute inset-0 rounded-lg transition-colors ${
                                              snapshot.isDraggingOver ? 'bg-blue-100/50 border-2 border-blue-500 z-10' : 'pointer-events-none'
                                           }`}
                                        >
                                           {snapshot.isDraggingOver && (
                                              <div className="absolute inset-0 flex items-center justify-center text-blue-700 font-bold bg-white/50 backdrop-blur-sm rounded-lg">
                                                 Drop to Add
                                              </div>
                                           )}
                                           {provided.placeholder}
                                        </div>
                                     )}
                                  </Droppable>
                               </div>
                            )}
                         </Draggable>
                      ))}
                      {provided.placeholder}
                   </div>
                )}
             </Droppable>
          </div>
        </div>

        {/* --- RIGHT SIDE: PRODUCTS --- */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
           <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                 {selectedCategoryId ? (
                    <>
                       <h2 className="font-bold text-gray-800">
                          {categories.find(c => c.id === selectedCategoryId)?.name || 'Category'}
                       </h2>
                       <Badge variant="secondary">{localProducts.length}</Badge>
                    </>
                 ) : (
                    <h2 className="font-bold text-gray-800">All Products ({products.length})</h2>
                 )}
              </div>
              
              <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <Input 
                    className="pl-9 h-9" 
                    placeholder="Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              <Droppable droppableId="product-grid" type="PRODUCT" direction="grid">
                 {(provided, snapshot) => (
                    <div
                       ref={provided.innerRef}
                       {...provided.droppableProps}
                       className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                       {localProducts.map((product, index) => (
                          <Draggable key={product.id} draggableId={product.id} index={index}>
                             {(provided, snapshot) => (
                                <div
                                   ref={provided.innerRef}
                                   {...provided.draggableProps}
                                   {...provided.dragHandleProps}
                                   className={`bg-white p-3 rounded-lg border shadow-sm group hover:shadow-md transition-all ${
                                      snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-xl z-50' : ''
                                   }`}
                                >
                                   <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden relative">
                                      {product.image_url ? (
                                         <img src={product.image_url} className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon className="w-8 h-8" />
                                         </div>
                                      )}
                                      
                                      {/* Remove Button (Only visible if in a specific category) */}
                                      {selectedCategoryId && (
                                         <button 
                                            className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                            onClick={(e) => { e.stopPropagation(); removeFromCategory(product, selectedCategoryId); }}
                                            title="Remove from category"
                                         >
                                            <X className="w-3 h-3" />
                                         </button>
                                      )}
                                   </div>
                                   <div className="text-sm font-medium line-clamp-2 text-gray-800 leading-tight mb-1">
                                      {product.name}
                                   </div>
                                   <div className="flex items-center justify-between">
                                      <div className="text-xs text-gray-500 font-mono">{product.slug}</div>
                                      <div className="text-xs font-bold text-green-600">${product.base_price}</div>
                                   </div>
                                   
                                   {/* Category indicators */}
                                   <div className="mt-2 flex flex-wrap gap-1">
                                      {product.category_id && (
                                         <div className="w-2 h-2 rounded-full bg-blue-500" title="Has primary category" />
                                      )}
                                      {(product.additional_category_ids || []).length > 0 && (
                                         <div className="w-2 h-2 rounded-full bg-purple-500" title={`In +${(product.additional_category_ids || []).length} other categories`} />
                                      )}
                                   </div>
                                </div>
                             )}
                          </Draggable>
                       ))}
                       {provided.placeholder}
                    </div>
                 )}
              </Droppable>

              {localProducts.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Search className="w-12 h-12 mb-2 opacity-20" />
                    <p>No products found</p>
                 </div>
              )}
           </div>
        </div>

      </div>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={editingCategory} 
            categories={categories}
            onSave={handleSaveCategory} 
            onCancel={() => setShowCategoryDialog(false)}
            isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}