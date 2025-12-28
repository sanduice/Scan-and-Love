import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Search, Trash2, Loader2, 
  ChevronDown, ChevronRight, X, 
  Eye, EyeOff, Copy, LayoutTemplate, Paintbrush, ArrowRight, MoreVertical, Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { generateThumbnailWithImages } from '@/components/designer/CanvasExporter';

// Thumbnail component that generates preview from design_data if thumbnail_url is missing
const TemplateThumbnail = ({ template }) => {
  const [thumbnailSrc, setThumbnailSrc] = useState(template.thumbnail_url);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If no thumbnail but has design data, generate one
    if (!template.thumbnail_url && template.design_data) {
      const pages = template.design_data.pages;
      const elements = pages?.[0]?.elements || template.design_data.elements || [];
      const size = template.sizes?.[0] || { width: 24, height: 36 };
      
      if (elements.length > 0) {
        setIsLoading(true);
        generateThumbnailWithImages(elements, size.width, size.height)
          .then(src => setThumbnailSrc(src))
          .catch(console.error)
          .finally(() => setIsLoading(false));
      }
    }
  }, [template]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return thumbnailSrc ? (
    <img src={thumbnailSrc} alt={template.name} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <LayoutTemplate className="w-12 h-12 text-muted-foreground/30" />
    </div>
  );
};

const buildCategoryTree = (categories) => {
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
    { name: 'All Templates', slug: 'all-templates' },
    ...rootCategories.map(parent => ({
      name: parent.name,
      slug: parent.slug,
      id: parent.id,
      subcategories: buildSubcategories(parent.id)
    }))
  ];
};

// Category Sidebar Item (recursive)
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
  
  const [isExpanded, setIsExpanded] = useState(isChildActive || isSelfActive);

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

// Template Editor Dialog - Simplified for creation, full for editing
const TemplateEditor = ({ template, categories, open, onClose, onSave, isCreating }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    canvasWidth: 24,
    canvasHeight: 36,
    sizeUnit: 'inches',
    tags: [],
    is_active: true,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (template?.id) {
      // Editing existing template - load its data
      const firstSize = template.sizes?.[0] || { width: 24, height: 36, unit: 'inches' };
      setFormData({
        name: template.name || '',
        description: template.description || '',
        category_id: template.category_id || '',
        canvasWidth: firstSize.width || 24,
        canvasHeight: firstSize.height || 36,
        sizeUnit: firstSize.unit || 'inches',
        tags: template.tags || [],
        is_active: template.is_active ?? true,
      });
    } else {
      // Creating new template - reset to defaults
      setFormData({
        name: '',
        description: '',
        category_id: '',
        canvasWidth: 24,
        canvasHeight: 36,
        sizeUnit: 'inches',
        tags: [],
        is_active: true,
      });
    }
  }, [template, open]);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Template name is required');
      return;
    }
    onSave(formData);
  };

  // Flatten categories for dropdown - directly from database categories
  const flatCategories = useMemo(() => {
    const result = [];
    
    // Add root categories first
    const rootCategories = categories.filter(c => !c.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const addCategoryWithChildren = (category, level) => {
      result.push({ ...category, level });
      // Find and add children
      const children = categories
        .filter(c => c.parent_id === category.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      children.forEach(child => addCategoryWithChildren(child, level + 1));
    };
    
    rootCategories.forEach(cat => addCategoryWithChildren(cat, 0));
    
    return result;
  }, [categories]);

  const isNewTemplate = !template?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNewTemplate ? 'Create New Template' : 'Edit Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Sale Banner Template"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category_id || 'none'} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v === 'none' ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {flatCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {'—'.repeat(cat.level)} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Canvas Size - only show for new templates or if editing */}
          <div className="space-y-2">
            <Label>Canvas Size</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Width</span>
                <Input
                  type="number"
                  value={formData.canvasWidth}
                  onChange={(e) => setFormData(prev => ({ ...prev, canvasWidth: parseFloat(e.target.value) || 1 }))}
                  min={1}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Height</span>
                <Input
                  type="number"
                  value={formData.canvasHeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, canvasHeight: parseFloat(e.target.value) || 1 }))}
                  min={1}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Unit</span>
                <Select value={formData.sizeUnit} onValueChange={(v) => setFormData(prev => ({ ...prev, sizeUnit: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inches">Inches</SelectItem>
                    <SelectItem value="feet">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this template..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 p-0.5 hover:bg-muted rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">Make available in design tool</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>


          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isNewTemplate ? (
                <>
                  Create Template
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Update Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function TemplatesManager() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all-templates');
  const [isCreating, setIsCreating] = useState(false);

  // Navigate to design tool to edit template visually
  const handleEditDesign = (template) => {
    const defaultSize = template.sizes?.[0] || { width: 24, height: 36 };
    navigate(`/DesignTool?editTemplateId=${template.id}&width=${defaultSize.width}&height=${defaultSize.height}`);
  };

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: updated, error } = await supabase
        .from('design_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Template updated');
      setShowDialog(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast.error('Failed to update template: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('design_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Template deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    }
  });

  const handleSave = async (formData) => {
    if (editingTemplate?.id) {
      // UPDATE MODE: Update existing template metadata
      updateMutation.mutate({ 
        id: editingTemplate.id, 
        data: {
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id || null,
          sizes: [{ width: formData.canvasWidth, height: formData.canvasHeight, unit: formData.sizeUnit }],
          tags: formData.tags,
          is_active: formData.is_active,
        }
      });
    } else {
      // CREATE MODE: Create draft template and navigate to design tool
      setIsCreating(true);
      try {
        const newTemplate = {
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id || null,
          sizes: [{ width: formData.canvasWidth, height: formData.canvasHeight, unit: formData.sizeUnit }],
          tags: formData.tags,
          is_active: formData.is_active,
          design_data: { elements: [] },
          file_type: 'vector',
        };

        const { data: created, error } = await supabase
          .from('design_templates')
          .insert([newTemplate])
          .select()
          .single();

        if (error) throw error;

        toast.success('Template created - opening design canvas...');
        setShowDialog(false);
        setEditingTemplate(null);
        
        // Navigate to design tool with the new template ID
        navigate(`/DesignTool?editTemplateId=${created.id}&width=${formData.canvasWidth}&height=${formData.canvasHeight}`);
      } catch (error) {
        toast.error('Failed to create template: ' + error.message);
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category_id: template.category_id,
        sizes: template.sizes,
        tags: template.tags,
        is_active: false, // Duplicates start as inactive
        design_data: template.design_data,
        file_type: template.file_type,
        thumbnail_url: template.thumbnail_url,
      };

      const { error } = await supabase
        .from('design_templates')
        .insert([duplicateData]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Template duplicated');
    } catch (error) {
      toast.error('Failed to duplicate template: ' + error.message);
    }
  };

  const toggleActive = (template) => {
    updateMutation.mutate({ 
      id: template.id, 
      data: { is_active: !template.is_active } 
    });
  };

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedCategorySlug && selectedCategorySlug !== 'all-templates') {
      const category = categories.find(c => c.slug === selectedCategorySlug);
      if (category) {
        filtered = filtered.filter(t => t.category_id === category.id);
      }
    }

    return filtered;
  }, [templates, searchQuery, selectedCategorySlug, categories]);

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  const getFileTypeBadge = (fileType) => {
    const styles = {
      raster: 'bg-blue-100 text-blue-800',
      vector: 'bg-green-100 text-green-800',
      editable: 'bg-purple-100 text-purple-800'
    };
    return <Badge className={styles[fileType] || styles.raster}>{fileType || 'raster'}</Badge>;
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
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategorySlug === 'all-templates' ? 'All Templates' : 
                categories.find(c => c.slug === selectedCategorySlug)?.name || 'Templates'}
            </h2>
            <Button onClick={() => { setEditingTemplate({}); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Templates Count */}
        <div className="text-sm text-muted-foreground mb-4">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <LayoutTemplate className="w-12 h-12 mb-4 opacity-50" />
              <p>No templates found</p>
              {searchQuery && <p className="text-sm">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="bg-card rounded-xl border overflow-hidden relative group"
                >
                  {/* Template Image */}
                  <div 
                    className="aspect-video bg-muted relative cursor-pointer" 
                    onClick={() => handleEditDesign(template)}
                  >
                    <TemplateThumbnail template={template} />

                    {/* Badges Container - Bottom Left */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {/* Size Badge */}
                      {template.sizes?.[0] && (
                        <Badge className="bg-black text-white border-0 hover:bg-black">
                          {template.sizes[0].width} × {template.sizes[0].height} {template.sizes[0].unit === 'inches' ? 'in' : 'ft'}
                        </Badge>
                      )}
                      {/* Active/Inactive Badge */}
                      <Badge 
                        className={template.is_active ? "bg-green-600 text-white hover:bg-green-600" : "bg-muted text-muted-foreground hover:bg-muted"}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-foreground truncate">{template.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => {
                            setEditingTemplate(template);
                            setShowDialog(true);
                          }}>
                            <Settings className="w-4 h-4 mr-2" /> Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this template?')) {
                                deleteMutation.mutate(template.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getCategoryName(template.category_id)}
                    </p>
                    
                    {/* Tags */}
                    {template.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Editor Dialog */}
      <TemplateEditor
        template={editingTemplate}
        categories={categories}
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditingTemplate(null); }}
        onSave={handleSave}
        isCreating={isCreating}
      />
    </div>
  );
}
