import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, Edit, Trash2, Image, Loader2, Folder, FolderOpen, ChevronRight, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesManager() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Get children of a category
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);
  
  // Get all descendants recursively
  const getAllDescendants = (categoryId) => {
    const children = getChildren(categoryId);
    let descendants = [...children];
    children.forEach(child => {
      descendants = [...descendants, ...getAllDescendants(child.id)];
    });
    return descendants;
  };

  // Get category depth level
  const getCategoryLevel = (category) => {
    let level = 0;
    let current = category;
    while (current?.parent_id) {
      level++;
      current = categories.find(c => c.id === current.parent_id);
    }
    return level;
  };

  // Organize categories into tree structure - root level only
  const rootCategories = categories.filter(c => !c.parent_id);

  // Stats
  const stats = useMemo(() => {
    const parents = categories.filter(c => !c.parent_id).length;
    const level1 = categories.filter(c => c.parent_id && getCategoryLevel(categories.find(cat => cat.id === c.id)) === 1).length;
    const level2Plus = categories.filter(c => getCategoryLevel(c) >= 2).length;
    return { parents, level1, level2Plus, total: categories.length };
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('product_categories')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category created');
      setShowDialog(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('product_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category updated');
      setShowDialog(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });

  const handleSave = (formData) => {
    if (editingCategory?.id) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      // Calculate order: put at end of siblings
      const siblings = getChildren(formData.parent_id || null);
      const newOrder = siblings.length + 1;
      
      createMutation.mutate({ 
        ...formData, 
        order: newOrder,
        is_active: true
      });
    }
  };

  const handleAddSubcategory = (parentCategory) => {
    setEditingCategory({ parent_id: parentCategory.id, parentName: parentCategory.name });
    setShowDialog(true);
  };

  const handleAddParent = () => {
    setEditingCategory({});
    setShowDialog(true);
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDelete = (category) => {
    const descendants = getAllDescendants(category.id);
    if (descendants.length > 0) {
      if (confirm(`Delete "${category.name}" and its ${descendants.length} nested categories?`)) {
        // Delete descendants first (deepest first), then parent
        const sortedDescendants = [...descendants].sort((a, b) => getCategoryLevel(b) - getCategoryLevel(a));
        sortedDescendants.forEach(desc => deleteMutation.mutate(desc.id));
        deleteMutation.mutate(category.id);
      }
    } else {
      if (confirm(`Delete "${category.name}"? Products in it will lose their category association.`)) {
        deleteMutation.mutate(category.id);
      }
    }
  };

  // Get parent name for dialog title
  const getParentName = () => {
    if (editingCategory?.parentName) return editingCategory.parentName;
    if (editingCategory?.parent_id) {
      return categories.find(c => c.id === editingCategory.parent_id)?.name || 'Unknown';
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Categories & Organization</h2>
        <Button onClick={handleAddParent} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Parent Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {stats.parents} parent • {stats.level1} subcategories • {stats.level2Plus} nested
            </span>
          </div>
          
          <div className="divide-y divide-border">
            {rootCategories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No categories yet</p>
                <p className="text-sm">Create your first parent category to get started</p>
              </div>
            ) : (
              rootCategories.map((category) => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  allCategories={categories}
                  level={0}
                  expandedCategories={expandedCategories}
                  onToggle={toggleExpand}
                  onEdit={(cat) => { setEditingCategory(cat); setShowDialog(true); }}
                  onDelete={handleDelete}
                  onAddSubcategory={handleAddSubcategory}
                />
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id 
                ? 'Edit Category' 
                : editingCategory?.parent_id 
                  ? `Add Subcategory to "${getParentName()}"`
                  : 'Add Parent Category'
              }
            </DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={editingCategory} 
            allCategories={categories}
            onSave={handleSave} 
            onCancel={() => setShowDialog(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryTreeItem({ category, allCategories, level, expandedCategories, onToggle, onEdit, onDelete, onAddSubcategory }) {
  const children = allCategories.filter(c => c.parent_id === category.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedCategories[category.id] ?? true;
  
  // Allow adding subcategories up to level 1 (so we get 3 levels total: 0, 1, 2)
  const canAddSubcategory = level <= 1;

  // Visual styling based on level
  const indentStyle = level > 0 ? { marginLeft: `${level * 32}px` } : {};
  const iconSize = level === 0 ? 'h-10 w-10' : level === 1 ? 'h-8 w-8' : 'h-7 w-7';
  const textSize = level === 0 ? '' : level === 1 ? 'text-sm' : 'text-xs';
  const folderIconSize = level === 0 ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggle(category.id)}>
      {/* Category Row */}
      <div 
        className="flex items-center px-4 py-3 hover:bg-muted/50 group"
        style={indentStyle}
      >
        {/* Expand/Collapse Button */}
        <CollapsibleTrigger asChild>
          <button className={`p-1 hover:bg-muted rounded mr-2 ${!hasChildren ? 'invisible' : ''}`}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Tree connector line for nested items */}
        {level > 0 && (
          <div className="w-6 border-t border-primary/20 mr-2" />
        )}

        {/* Category Icon */}
        <div className={`${iconSize} flex-shrink-0 rounded bg-muted flex items-center justify-center border mr-3`}>
          {category.image_url ? (
            <img src={category.image_url} alt="" className={`${iconSize} object-cover rounded`} />
          ) : isExpanded && hasChildren ? (
            <FolderOpen className={`${folderIconSize} text-primary`} />
          ) : (
            <Folder className={`${folderIconSize} text-muted-foreground`} />
          )}
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-foreground ${textSize}`}>{category.name}</div>
          <div className={`text-muted-foreground ${level === 0 ? 'text-sm' : 'text-xs'}`}>
            {category.slug}
            {hasChildren && ` • ${children.length} ${children.length === 1 ? 'subcategory' : 'subcategories'}`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAddSubcategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSubcategory(category)}
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Subcategory
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Children (Recursive) */}
      <CollapsibleContent>
        <div className={level === 0 ? "border-l-2 border-primary/20 ml-8" : ""}>
          {children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              allCategories={allCategories}
              level={level + 1}
              expandedCategories={expandedCategories}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
            />
          ))}
          
          {/* Add Subcategory Button at bottom - only for levels 0 and 1 */}
          {canAddSubcategory && (
            <button 
              onClick={() => onAddSubcategory(category)}
              className="w-full flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
              style={{ marginLeft: `${(level + 1) * 32}px` }}
            >
              <div className="w-6 border-t border-primary/20 mr-2" />
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CategoryForm({ category, allCategories, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    parent_id: category?.parent_id || null,
  });

  // Build hierarchical options for parent selector
  const buildHierarchicalOptions = () => {
    const options = [];
    
    // Get all descendants of a category (for circular reference prevention)
    const getDescendantIds = (categoryId) => {
      const children = allCategories.filter(c => c.parent_id === categoryId);
      let ids = children.map(c => c.id);
      children.forEach(child => {
        ids = [...ids, ...getDescendantIds(child.id)];
      });
      return ids;
    };
    
    // IDs to exclude (self and descendants when editing)
    const excludeIds = category?.id ? [category.id, ...getDescendantIds(category.id)] : [];
    
    // Recursive function to add categories with indentation
    const addCategoryOptions = (parentId, depth) => {
      const children = allCategories.filter(c => c.parent_id === parentId);
      children.forEach(cat => {
        // Skip excluded categories
        if (excludeIds.includes(cat.id)) return;
        
        // Only allow nesting up to level 1 (so new category would be level 2 max)
        const currentLevel = depth;
        if (currentLevel > 1) return; // Don't show level 2+ as potential parents
        
        const prefix = '—'.repeat(depth);
        options.push({
          id: cat.id,
          name: cat.name,
          label: depth > 0 ? `${prefix} ${cat.name}` : cat.name,
        });
        addCategoryOptions(cat.id, depth + 1);
      });
    };
    
    // Start with root categories
    const rootCategories = allCategories.filter(c => !c.parent_id);
    rootCategories.forEach(cat => {
      if (excludeIds.includes(cat.id)) return;
      options.push({
        id: cat.id,
        name: cat.name,
        label: cat.name,
      });
      addCategoryOptions(cat.id, 1);
    });
    
    return options;
  };

  const parentOptions = buildHierarchicalOptions();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      parent_id: formData.parent_id || null,
    });
  };

  // Find current parent name for display
  const currentParentName = category?.parent_id 
    ? allCategories.find(c => c.id === category.parent_id)?.name 
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Parent Category Selector - only show when creating new */}
      {!category?.id && parentOptions.length > 0 && (
        <div>
          <Label>Parent Category</Label>
          <Select 
            value={formData.parent_id || 'none'} 
            onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (Top Level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Top Level)</SelectItem>
              {parentOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select a parent to nest this category. Max 3 levels deep.
          </p>
        </div>
      )}

      {/* Show parent info when editing subcategory */}
      {category?.id && currentParentName && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Subcategory of: <span className="font-medium text-foreground">{currentParentName}</span>
          </p>
        </div>
      )}

      <div>
        <Label>Category Name</Label>
        <Input 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Bling Name Badges"
          required
        />
      </div>
      
      <div>
        <Label>Slug (URL)</Label>
        <Input 
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="auto-generated-from-name"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used in URLs like /products/category/{formData.slug || 'slug'}
        </p>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this category..."
          rows={3}
        />
      </div>

      <div>
        <Label>Category Image</Label>
        <div className="flex gap-2">
          <Input 
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          <Button type="button" variant="outline">
            <Image className="w-4 h-4" />
          </Button>
        </div>
        {formData.image_url && (
          <div className="mt-2">
            <img 
              src={formData.image_url} 
              alt="Preview" 
              className="h-16 w-16 object-cover rounded border"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Category
        </Button>
      </DialogFooter>
    </form>
  );
}
