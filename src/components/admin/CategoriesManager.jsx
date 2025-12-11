import React, { useState, useEffect } from 'react';
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
  Plus, Edit, Trash2, Image, GripVertical, Loader2, Folder, FolderOpen, ChevronRight, ChevronDown
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

  // Organize categories into tree structure
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId) => categories.filter(c => c.parent_id === parentId);

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
      const siblings = formData.parent_id 
        ? getSubcategories(formData.parent_id)
        : parentCategories;
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
    const subcategories = getSubcategories(category.id);
    if (subcategories.length > 0) {
      if (confirm(`Delete "${category.name}" and its ${subcategories.length} subcategories?`)) {
        // Delete subcategories first, then parent
        subcategories.forEach(sub => deleteMutation.mutate(sub.id));
        deleteMutation.mutate(category.id);
      }
    } else {
      if (confirm(`Delete "${category.name}"? Products in it will lose their category association.`)) {
        deleteMutation.mutate(category.id);
      }
    }
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
              {parentCategories.length} parent categories • {categories.length - parentCategories.length} subcategories
            </span>
          </div>
          
          <div className="divide-y divide-border">
            {parentCategories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No categories yet</p>
                <p className="text-sm">Create your first parent category to get started</p>
              </div>
            ) : (
              parentCategories.map((category) => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  subcategories={getSubcategories(category.id)}
                  isExpanded={expandedCategories[category.id] ?? true}
                  onToggle={() => toggleExpand(category.id)}
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
                  ? `Add Subcategory to "${editingCategory.parentName}"`
                  : 'Add Parent Category'
              }
            </DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={editingCategory} 
            parentCategories={parentCategories}
            onSave={handleSave} 
            onCancel={() => setShowDialog(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryTreeItem({ category, subcategories, isExpanded, onToggle, onEdit, onDelete, onAddSubcategory }) {
  const hasSubcategories = subcategories.length > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      {/* Parent Category Row */}
      <div className="flex items-center px-4 py-3 hover:bg-muted/50 group">
        <CollapsibleTrigger asChild>
          <button className="p-1 hover:bg-muted rounded mr-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <div className="h-10 w-10 flex-shrink-0 rounded bg-muted flex items-center justify-center border mr-3">
          {category.image_url ? (
            <img src={category.image_url} alt="" className="h-10 w-10 object-cover rounded" />
          ) : isExpanded ? (
            <FolderOpen className="h-5 w-5 text-primary" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">{category.name}</div>
          <div className="text-sm text-muted-foreground">
            {category.slug} • {subcategories.length} subcategories
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubcategory(category)}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Subcategory
          </Button>
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

      {/* Subcategories */}
      <CollapsibleContent>
        <div className="border-l-2 border-primary/20 ml-8">
          {subcategories.map((sub) => (
            <div 
              key={sub.id} 
              className="flex items-center px-4 py-2.5 hover:bg-muted/50 group"
            >
              <div className="w-6 border-t border-primary/20 mr-2" />
              
              <div className="h-8 w-8 flex-shrink-0 rounded bg-muted flex items-center justify-center border mr-3">
                {sub.image_url ? (
                  <img src={sub.image_url} alt="" className="h-8 w-8 object-cover rounded" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm">{sub.name}</div>
                <div className="text-xs text-muted-foreground">{sub.slug}</div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(sub)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(sub)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Add Subcategory Button at bottom */}
          <button 
            onClick={() => onAddSubcategory(category)}
            className="w-full flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
          >
            <div className="w-6 border-t border-primary/20 mr-2" />
            <Plus className="w-4 h-4 mr-2" />
            Add Subcategory
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CategoryForm({ category, parentCategories, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    parent_id: category?.parent_id || null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      parent_id: formData.parent_id || null,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For now, just use URL input - storage bucket setup needed for file uploads
    toast.info('Please enter an image URL directly');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Parent Category Selector - only show when creating new or editing existing */}
      {!category?.id && parentCategories.length > 0 && (
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
              {parentCategories.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Leave as "None" for a parent category, or select a parent to create a subcategory
          </p>
        </div>
      )}

      {/* Show parent info when editing subcategory */}
      {category?.id && category?.parent_id && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Subcategory of: <span className="font-medium text-foreground">
              {parentCategories.find(p => p.id === category.parent_id)?.name || 'Unknown'}
            </span>
          </p>
        </div>
      )}

      <div>
        <Label>Category Name</Label>
        <Input 
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Premium Name Badges"
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
          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleImageUpload}
              accept="image/*"
            />
            <Button type="button" variant="outline">
              <Image className="w-4 h-4" />
            </Button>
          </div>
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
