import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Plus, Search, Edit, Trash2, Image, Loader2, 
  ChevronDown, ChevronRight, Upload, X, FileImage, 
  FileType, Eye, EyeOff, Copy, LayoutTemplate
} from 'lucide-react';
import { toast } from 'sonner';

// Build hierarchical category tree from flat database data
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

// Size Editor Component
const SizeEditor = ({ sizes, onChange }) => {
  const addSize = () => {
    onChange([...sizes, { width: 24, height: 36, label: '', unit: 'inches' }]);
  };

  const updateSize = (index, field, value) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSize = (index) => {
    onChange(sizes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Size Variants</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSize}>
          <Plus className="w-4 h-4 mr-1" /> Add Size
        </Button>
      </div>
      {sizes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sizes defined. Add sizes to specify template dimensions.</p>
      ) : (
        <div className="space-y-2">
          {sizes.map((size, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Input
                type="number"
                value={size.width}
                onChange={(e) => updateSize(index, 'width', parseFloat(e.target.value) || 0)}
                className="w-20"
                placeholder="Width"
              />
              <span className="text-muted-foreground">×</span>
              <Input
                type="number"
                value={size.height}
                onChange={(e) => updateSize(index, 'height', parseFloat(e.target.value) || 0)}
                className="w-20"
                placeholder="Height"
              />
              <Select value={size.unit} onValueChange={(v) => updateSize(index, 'unit', v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inches">in</SelectItem>
                  <SelectItem value="feet">ft</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={size.label || ''}
                onChange={(e) => updateSize(index, 'label', e.target.value)}
                className="flex-1"
                placeholder="Label (e.g., Small, Medium)"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSize(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Template Editor Dialog
const TemplateEditor = ({ template, categories, open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sizes: [],
    file_type: 'raster',
    tags: [],
    is_active: true,
    thumbnail_url: '',
    source_file_url: '',
    preview_images: [],
    design_data: {},
    sort_order: 0
  });
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (template?.id) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        category_id: template.category_id || '',
        sizes: template.sizes || [],
        file_type: template.file_type || 'raster',
        tags: template.tags || [],
        is_active: template.is_active ?? true,
        thumbnail_url: template.thumbnail_url || '',
        source_file_url: template.source_file_url || '',
        preview_images: template.preview_images || [],
        design_data: template.design_data || {},
        sort_order: template.sort_order || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: '',
        sizes: [],
        file_type: 'raster',
        tags: [],
        is_active: true,
        thumbnail_url: '',
        source_file_url: '',
        preview_images: [],
        design_data: {},
        sort_order: 0
      });
    }
  }, [template]);

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${template?.id || 'new'}/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath);

      if (type === 'preview') {
        setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      } else if (type === 'source') {
        setFormData(prev => ({ ...prev, source_file_url: publicUrl }));
        // Detect file type
        const ext = fileExt.toLowerCase();
        if (['ai', 'psd'].includes(ext)) {
          setFormData(prev => ({ ...prev, file_type: 'editable' }));
        } else if (ext === 'svg') {
          setFormData(prev => ({ ...prev, file_type: 'vector' }));
        }
      } else if (type === 'gallery') {
        setFormData(prev => ({ 
          ...prev, 
          preview_images: [...(prev.preview_images || []), publicUrl] 
        }));
      }

      toast.success('File uploaded');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const removeGalleryImage = (url) => {
    setFormData(prev => ({ 
      ...prev, 
      preview_images: prev.preview_images.filter(u => u !== url) 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Template name is required');
      return;
    }
    onSave(formData);
  };

  // Flatten categories for dropdown
  const flattenCategories = (cats, level = 0) => {
    let result = [];
    for (const cat of cats) {
      if (cat.id) {
        result.push({ ...cat, level });
      }
      if (cat.subcategories?.length) {
        result = result.concat(flattenCategories(cat.subcategories, level + 1));
      }
    }
    return result;
  };

  const flatCategories = useMemo(() => flattenCategories(buildCategoryTree(categories)), [categories]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sale Banner Template"
              />
            </div>
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
          </div>

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

          {/* Preview Image Upload */}
          <div className="space-y-2">
            <Label>Preview Image</Label>
            <div className="flex items-start gap-4">
              {formData.thumbnail_url ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
                  <img src={formData.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], 'preview')}
                    disabled={uploading}
                  />
                </label>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Upload a preview thumbnail (JPG, PNG, WebP)</p>
                <p>Recommended: 1:1 aspect ratio</p>
              </div>
            </div>
          </div>

          {/* Source File Upload */}
          <div className="space-y-2">
            <Label>Source/Editable File</Label>
            <div className="flex items-start gap-4">
              {formData.source_file_url ? (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileType className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{formData.source_file_url.split('/').pop()}</p>
                    <Badge variant="secondary" className="mt-1">{formData.file_type}</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, source_file_url: '', file_type: 'raster' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload AI, PSD, or SVG file</span>
                  <input
                    type="file"
                    accept=".ai,.psd,.svg,.eps"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], 'source')}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Gallery Images */}
          <div className="space-y-2">
            <Label>Additional Gallery Images</Label>
            <div className="flex flex-wrap gap-2">
              {(formData.preview_images || []).map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(url)}
                    className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50">
                <Plus className="w-6 h-6 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0], 'gallery')}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Size Variants */}
          <SizeEditor 
            sizes={formData.sizes || []} 
            onChange={(sizes) => setFormData(prev => ({ ...prev, sizes }))} 
          />

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
              <p className="text-sm text-muted-foreground">Make this template available in the design tool</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={uploading}>
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {template?.id ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function TemplatesManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all-templates');

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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: newTemplate, error } = await supabase
        .from('design_templates')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Template created');
      setShowDialog(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast.error('Failed to create template: ' + error.message);
    }
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

  const handleSave = (formData) => {
    if (editingTemplate?.id) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDuplicate = async (template) => {
    const duplicateData = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };
    createMutation.mutate(duplicateData);
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
                  className={`bg-card rounded-xl border overflow-hidden relative group ${
                    !template.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Template Image */}
                  <div 
                    className="aspect-video bg-muted relative cursor-pointer" 
                    onClick={() => { setEditingTemplate(template); setShowDialog(true); }}
                  >
                    {template.thumbnail_url ? (
                      <img 
                        src={template.thumbnail_url} 
                        alt={template.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutTemplate className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* File Type Badge */}
                    <div className="absolute top-2 right-2">
                      {getFileTypeBadge(template.file_type)}
                    </div>

                    {/* Size Count Badge */}
                    {template.sizes?.length > 0 && (
                      <Badge className="absolute bottom-2 left-2 bg-background/90">
                        {template.sizes.length} size{template.sizes.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-foreground truncate">{template.name}</h3>
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

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setEditingTemplate(template); setShowDialog(true); }}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleActive(template)}
                      >
                        {template.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Delete this template?')) {
                            deleteMutation.mutate(template.id);
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
      />
    </div>
  );
}
