import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, Upload, X, Plus, Image as ImageIcon, Type, 
  DollarSign, Settings, List, Trash2, GripVertical, Video, FileVideo,
  CloudUpload, LayoutGrid, Check, ArrowUpRight, Calculator, Ruler
} from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PresetSizesManager from './PresetSizesManager';
import ProductOptionsConfigurator from './ProductOptionsConfigurator';

export default function ProductEditor({ product, categories, onSave, onCancel }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    category_id: product?.category_id || '',
    additional_category_ids: product?.additional_category_ids || [],
    short_description: product?.short_description || '',
    long_description: product?.long_description || '',
    base_price: product?.base_price || 0,
    sale_price: product?.sale_price || 0,
    sale_percentage: product?.sale_percentage || 0,
    is_on_sale: product?.is_on_sale || false,
    is_active: product?.is_active !== false,
    is_popular: product?.is_popular || false,
    has_design_tool: product?.has_design_tool !== false,
    is_double_sided: product?.is_double_sided || false,
    image_url: product?.image_url || '',
    video_url: product?.video_url || '',
    gallery_images: product?.gallery_images || [],
    features: product?.features || [],
    default_width: product?.default_width || 24,
    default_height: product?.default_height || 18,
    min_width: product?.min_width || 1,
    max_width: product?.max_width || 120,
    min_height: product?.min_height || 1,
    max_height: product?.max_height || 120,
    turnaround_days: product?.turnaround_days || 1,
    order: product?.order || 0,
    material_options: product?.material_options || [],
    finish_options: product?.finish_options || [],
    tax_code: product?.tax_code || '',
    is_fixed_size: product?.is_fixed_size || false,
    hidden_options: product?.hidden_options || [],
    // New fields
    size_unit: product?.size_unit || 'inches',
    allow_custom_size: product?.allow_custom_size !== false,
    preset_sizes: product?.preset_sizes || [],
    product_options: product?.product_options || [],
    // Pricing type fields
    pricing_type: product?.pricing_type || 'custom',
    price_per_sqft: product?.price_per_sqft || 0,
  });

  // Build hierarchical category list for dropdown
  const flatCategories = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [];
    }
    
    const result = [];
    
    // Get root categories first (no parent_id)
    const rootCategories = categories
      .filter(c => !c.parent_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Recursive function to add category and its children
    const addCategoryWithChildren = (category, level) => {
      result.push({ ...category, level });
      const children = categories
        .filter(c => c.parent_id === category.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      children.forEach(child => addCategoryWithChildren(child, level + 1));
    };
    
    rootCategories.forEach(cat => addCategoryWithChildren(cat, 0));
    
    return result;
  }, [categories]);

  // Check if selected category is "Banners" related
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === formData.category_id);
  }, [categories, formData.category_id]);

  const isBannerCategory = useMemo(() => {
    if (!selectedCategory) return false;
    const name = selectedCategory.name?.toLowerCase() || '';
    const slug = selectedCategory.slug?.toLowerCase() || '';
    return name.includes('banner') || slug.includes('banner') || 
           name.includes('signs') || slug.includes('signs');
  }, [selectedCategory]);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files, isGallery = false) => {
    if (!files || !files.length) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => base44.integrations.Core.UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);

      if (isGallery) {
        setFormData(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, ...urls]
        }));
      } else {
        setFormData(prev => ({ ...prev, image_url: urls[0] }));
      }
      toast.success('Images uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, isGallery) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files, isGallery);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.gallery_images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData(prev => ({ ...prev, gallery_images: items }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };
    onSave(finalData);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        <form id="product-form" onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
          
          <div className="flex items-center justify-between mb-6">
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {product ? 'Edit Product' : 'Create Product'}
               </h2>
               <p className="text-slate-500">Manage your catalog item details</p>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>Discard</Button>
                <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                   {product ? 'Save Changes' : 'Create Product'}
                </Button>
            </div>
          </div>

          {/* Primary Category - Moved above tabs */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Primary Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(val) => handleInputChange('category_id', val)}
              >
                <SelectTrigger className="h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover">
                  {flatCategories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No categories found
                    </div>
                  ) : (
                    flatCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center">
                          {cat.level > 0 && (
                            <span className="text-muted-foreground mr-1">
                              {'└─'.padStart(cat.level * 3, '  ')}
                            </span>
                          )}
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-blue-600 font-normal"
                onClick={() => {
                    const name = prompt('Enter new category name:');
                    if (name) {
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      base44.entities.ProductCategory.create({ name, slug, order: 99 })
                        .then((newCat) => {
                          toast.success('Category created');
                          handleInputChange('category_id', newCat.id);
                        });
                    }
                }}
              >
                + Create New Category
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 p-1 bg-slate-100/50 border rounded-xl h-12">
              <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">General</TabsTrigger>
              <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Media</TabsTrigger>
              <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Details</TabsTrigger>
              <TabsTrigger value="calculator" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Sizes</TabsTrigger>
              <TabsTrigger value="options" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Options</TabsTrigger>
            </TabsList>

            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Product Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)} 
                    placeholder="e.g. Vinyl Banner"
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all bg-slate-50/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Slug (URL)</Label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-md px-3 h-11 flex items-center text-slate-500 text-sm">/products/</span>
                    <Input 
                      value={formData.slug} 
                      onChange={(e) => handleInputChange('slug', e.target.value)} 
                      placeholder="vinyl-banner"
                      className="h-11 rounded-l-none border-slate-200 focus:border-blue-500 transition-all bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Description Only */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Detailed Description</Label>
                <div className="prose-editor border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <ReactQuill 
                    theme="snow"
                    value={formData.long_description}
                    onChange={(val) => handleInputChange('long_description', val)}
                    className="h-64 mb-10"
                    modules={{
                        toolbar: [
                          [{ 'header': [1, 2, false] }],
                          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                          [{'list': 'ordered'}, {'list': 'bullet'}],
                          ['link', 'clean']
                        ],
                      }}
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Active</Label>
                    <p className="text-xs text-slate-500">Show in catalog</p>
                  </div>
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(v) => handleInputChange('is_active', v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Popular</Label>
                    <p className="text-xs text-slate-500">Featured badge</p>
                  </div>
                  <Switch 
                    checked={formData.is_popular}
                    onCheckedChange={(v) => handleInputChange('is_popular', v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Design Tool</Label>
                    <p className="text-xs text-slate-500">Enable online designer</p>
                  </div>
                  <Switch 
                    checked={formData.has_design_tool}
                    onCheckedChange={(v) => handleInputChange('has_design_tool', v)}
                  />
                </div>
                {formData.has_design_tool && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Double Sided</Label>
                      <p className="text-xs text-slate-500">Front/Back design</p>
                    </div>
                    <Switch 
                      checked={formData.is_double_sided}
                      onCheckedChange={(v) => handleInputChange('is_double_sided', v)}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media" className="space-y-8 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
              
              {/* Main Image Section */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="col-span-1">
                   <Label className="text-base font-semibold text-slate-900 mb-4 block">Primary Image</Label>
                   <div 
                      className={`
                        relative group aspect-square rounded-2xl border-2 border-dashed 
                        flex flex-col items-center justify-center overflow-hidden transition-all duration-300
                        ${formData.image_url ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
                      `}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => handleDrop(e, false)}
                   >
                      {formData.image_url ? (
                        <>
                          <img src={formData.image_url} alt="Main" className="w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-sm">
                             <label className="cursor-pointer">
                                <Button type="button" variant="secondary" className="mb-2">
                                  <Upload className="w-4 h-4 mr-2" /> Change Image
                                </Button>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
                             </label>
                             <p className="text-white/70 text-xs">or drag and drop</p>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center p-6 text-center w-full h-full justify-center">
                           <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <CloudUpload className="w-8 h-8" />
                           </div>
                           <span className="font-medium text-slate-700">Click to upload</span>
                           <span className="text-sm text-slate-500 mt-1">or drag and drop</span>
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
                        </label>
                      )}
                   </div>
                   <p className="text-xs text-slate-500 mt-2 text-center">
                     Displayed as the main thumbnail in catalog
                   </p>
                </div>

                <div className="col-span-2 space-y-6">
                   <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Video className="w-5 h-5" />
                         </div>
                         <div>
                            <h3 className="font-semibold text-slate-900">Product Video</h3>
                            <p className="text-sm text-slate-500">Add a video to showcase your product in action</p>
                         </div>
                      </div>
                      
                      <div className="flex gap-3">
                         <div className="relative flex-1">
                            <Input 
                              value={formData.video_url} 
                              onChange={(e) => handleInputChange('video_url', e.target.value)}
                              placeholder="Paste YouTube or Vimeo URL..."
                              className="pl-10 h-11 bg-white border-slate-200"
                            />
                            <FileVideo className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         </div>
                         <label className="cursor-pointer">
                           <Button type="button" variant="outline" className="h-11 px-4 border-slate-200 hover:bg-white hover:border-purple-300 hover:text-purple-600 transition-colors">
                             <Upload className="w-4 h-4 mr-2" /> Upload File
                           </Button>
                           <input 
                              type="file" 
                              accept="video/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploading(true);
                                try {
                                  const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                  handleInputChange('video_url', file_url);
                                  toast.success('Video uploaded');
                                } catch (err) {
                                  toast.error('Failed to upload video');
                                } finally {
                                  setIsUploading(false);
                                }
                              }} 
                            />
                         </label>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <div className="flex-1 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                         <h4 className="font-semibold text-blue-900 mb-1">Image Guidelines</h4>
                         <ul className="text-sm text-blue-700/80 space-y-1 list-disc list-inside">
                            <li>Recommended size: 1200x1200px</li>
                            <li>Format: JPG, PNG, or WEBP</li>
                            <li>Max file size: 5MB</li>
                         </ul>
                      </div>
                   </div>
                </div>
              </div>

              {/* Gallery Section with Drag and Drop */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                     <h3 className="text-lg font-semibold text-slate-900">Gallery Images</h3>
                     <p className="text-sm text-slate-500">Drag to reorder. First image is secondary hover.</p>
                  </div>
                  <label className="cursor-pointer">
                    <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Add Photos
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e.target.files, true)} 
                    />
                  </label>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="gallery" direction="horizontal">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                           grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[160px] p-4 rounded-xl border-2 border-dashed transition-all duration-300
                           ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400' : 'bg-slate-50/50 border-slate-200'}
                        `}
                      >
                        {formData.gallery_images.map((url, index) => (
                          <Draggable key={url} draggableId={url} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`
                                   relative group aspect-square bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200
                                   ${snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-xl rotate-2 scale-105 z-50' : 'hover:border-blue-300 transition-colors'}
                                `}
                              >
                                <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                   <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-5 h-5" />
                                   </div>
                                   <button
                                     type="button"
                                     onClick={() => removeGalleryImage(index)}
                                     className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                   >
                                     <Trash2 className="w-5 h-5" />
                                   </button>
                                </div>
                                
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                                   #{index + 1}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Dropzone visual placeholder at the end */}
                        <label 
                           className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-blue-500"
                           onDragEnter={handleDrag}
                           onDragLeave={handleDrag}
                           onDragOver={handleDrag}
                           onDrop={(e) => handleDrop(e, true)}
                        >
                           <Plus className="w-8 h-8 mb-2" />
                           <span className="text-xs font-medium">Add Image</span>
                           <input 
                             type="file" 
                             accept="image/*" 
                             multiple 
                             className="hidden" 
                             onChange={(e) => handleImageUpload(e.target.files, true)} 
                           />
                        </label>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </TabsContent>

            {/* DETAILS TAB */}
            <TabsContent value="details" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Turnaround Days</Label>
                  <Input 
                    type="number" 
                    value={formData.turnaround_days} 
                    onChange={(e) => handleInputChange('turnaround_days', Number(e.target.value))}
                    className="h-11 border-slate-200 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Display Order</Label>
                  <Input 
                    type="number" 
                    value={formData.order} 
                    onChange={(e) => handleInputChange('order', Number(e.target.value))}
                    className="h-11 border-slate-200 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Tax Code</Label>
                  <Input 
                    value={formData.tax_code} 
                    onChange={(e) => handleInputChange('tax_code', e.target.value)}
                    placeholder="e.g. txcd_10103001"
                    className="h-11 border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold text-slate-900">Product Features</Label>
                    <p className="text-xs text-slate-500">Bullet points shown on the product page</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="w-4 h-4 mr-1" /> Add Feature
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formData.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input 
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder="e.g. Weather-resistant vinyl"
                        className="flex-1 h-10 bg-slate-50/50"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => removeFeature(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.features.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-sm">
                      No features defined yet
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* CALCULATOR TAB - Enhanced */}
            <TabsContent value="calculator" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
              
              {/* Preset Sizes Manager */}
              <PresetSizesManager 
                presetSizes={formData.preset_sizes}
                sizeUnit={formData.size_unit}
                pricingType={formData.pricing_type}
                pricePerSqft={formData.price_per_sqft}
                onSizesChange={(sizes) => handleInputChange('preset_sizes', sizes)}
                onUnitChange={(unit) => handleInputChange('size_unit', unit)}
                onPricingTypeChange={(type) => handleInputChange('pricing_type', type)}
                onPricePerSqftChange={(price) => handleInputChange('price_per_sqft', price)}
              />

              {/* Custom Size Settings */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6">
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-amber-600" />
                    <div>
                      <Label className="text-sm font-semibold text-amber-900">Enable Custom Sizes</Label>
                      <p className="text-xs text-amber-700">Allow customers to enter custom dimensions</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.allow_custom_size}
                    onCheckedChange={(v) => handleInputChange('allow_custom_size', v)}
                  />
                </div>

                {formData.allow_custom_size && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <Label className="text-sm font-semibold text-slate-700">Minimum Dimensions</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Width ({formData.size_unit === 'feet' ? 'ft' : 'in'})</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.min_width}
                            onChange={(e) => handleInputChange('min_width', Number(e.target.value))}
                            className="h-10 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Height ({formData.size_unit === 'feet' ? 'ft' : 'in'})</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.min_height}
                            onChange={(e) => handleInputChange('min_height', Number(e.target.value))}
                            className="h-10 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <Label className="text-sm font-semibold text-slate-700">Maximum Dimensions</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Width ({formData.size_unit === 'feet' ? 'ft' : 'in'})</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.max_width}
                            onChange={(e) => handleInputChange('max_width', Number(e.target.value))}
                            className="h-10 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Height ({formData.size_unit === 'feet' ? 'ft' : 'in'})</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.max_height}
                            onChange={(e) => handleInputChange('max_height', Number(e.target.value))}
                            className="h-10 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default Dimensions */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Default Width</Label>
                    <Input
                      type="number"
                      value={formData.default_width}
                      onChange={(e) => handleInputChange('default_width', Number(e.target.value))}
                      className="h-10 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Default Height</Label>
                    <Input
                      type="number"
                      value={formData.default_height}
                      onChange={(e) => handleInputChange('default_height', Number(e.target.value))}
                      className="h-10 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* OPTIONS TAB - New Configurator */}
            <TabsContent value="options" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
              <ProductOptionsConfigurator
                productOptions={formData.product_options}
                onOptionsChange={(options) => handleInputChange('product_options', options)}
              />
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}
