import React, { useState, useCallback } from 'react';
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
  CloudUpload, LayoutGrid, Check, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
  });

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

  // Options Management (Materials, Finishes, etc)
  const handleOptionChange = (type, index, field, value) => {
    const options = [...formData[type]];
    options[index] = { ...options[index], [field]: field === 'price_modifier' ? Number(value) : value };
    setFormData(prev => ({ ...prev, [type]: options }));
  };

  const addOption = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { name: '', description: '', price_modifier: 0 }]
    }));
  };

  const removeOption = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
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
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        <form id="product-form" onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
          
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 p-1 bg-slate-100/50 border rounded-xl h-12">
              <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">General</TabsTrigger>
              <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Media</TabsTrigger>
              <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Details</TabsTrigger>
              <TabsTrigger value="calculator" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Calculator</TabsTrigger>
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

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Primary Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(val) => handleInputChange('category_id', val)}
                  >
                    <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
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
                
                <div className="col-span-2 space-y-2">
                   <Label className="text-sm font-medium text-slate-700">Additional Categories</Label>
                   <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30 h-32 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                           <label key={category.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-md transition-colors">
                              <input 
                                type="checkbox"
                                checked={formData.additional_category_ids?.includes(category.id)}
                                onChange={(e) => {
                                   const current = formData.additional_category_ids || [];
                                   let updated;
                                   if(e.target.checked) {
                                      updated = [...current, category.id];
                                   } else {
                                      updated = current.filter(id => id !== category.id);
                                   }
                                   handleInputChange('additional_category_ids', updated);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-600">{category.name}</span>
                           </label>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Base Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.base_price} 
                      onChange={(e) => handleInputChange('base_price', Number(e.target.value))}
                      className="pl-9 h-11 border-slate-200 bg-slate-50/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Sale Price (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.sale_price || ''} 
                      onChange={(e) => handleInputChange('sale_price', Number(e.target.value))} 
                      className="pl-9 h-11 border-slate-200 bg-slate-50/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                     <span>On Sale Status</span>
                     <span className="text-xs text-slate-400 font-normal">{formData.is_on_sale ? 'Active' : 'Inactive'}</span>
                   </Label>
                   <div className="h-11 flex items-center px-4 border border-slate-200 rounded-md bg-slate-50/50">
                     <Switch 
                       checked={formData.is_on_sale}
                       onCheckedChange={(v) => handleInputChange('is_on_sale', v)}
                     />
                     <span className="ml-3 text-sm text-slate-600">{formData.is_on_sale ? 'Item is on sale' : 'Regular price'}</span>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Short Description</Label>
                <Textarea 
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder="Brief summary for product cards..."
                  className="min-h-[80px] border-slate-200 bg-slate-50/50 resize-none"
                />
              </div>

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
            </TabsContent>

            {/* MEDIA TAB - UPDATED MODERN LOOK */}
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

            {/* OPTIONS TAB */}
            <TabsContent value="options" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 mb-6">
                <Label className="mb-2 block font-semibold text-amber-900">Hidden Configuration Options</Label>
                <p className="text-sm text-amber-700/80 mb-4">
                  Specific keys to hide from the product configurator UI. Useful for complex products.
                  <br />
                  <span className="text-xs opacity-75">Available: thickness, printSide, finish, grommets, polePockets, accessory</span>
                </p>
                <Input 
                  value={formData.hidden_options.join(', ')} 
                  onChange={(e) => handleInputChange('hidden_options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. grommets, polePockets"
                  className="bg-white border-amber-200 focus:border-amber-400 text-amber-900"
                />
              </div>

              {/* Material Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <LayoutGrid className="w-4 h-4" />
                     </div>
                     <div>
                        <Label className="text-base font-semibold text-slate-900">Material Options</Label>
                        <p className="text-xs text-slate-500">Define available materials and their price impact</p>
                     </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addOption('material_options')}>
                    <Plus className="w-4 h-4 mr-1" /> Add Material
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.material_options.map((opt, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-200 group hover:border-blue-300 transition-colors">
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                           <Label className="text-xs text-slate-400 mb-1 block">Name</Label>
                           <Input 
                             placeholder="e.g. 13oz Vinyl" 
                             value={opt.name} 
                             onChange={(e) => handleOptionChange('material_options', idx, 'name', e.target.value)}
                             className="h-9 text-sm bg-white"
                           />
                        </div>
                        <div className="col-span-5">
                           <Label className="text-xs text-slate-400 mb-1 block">Description</Label>
                           <Input 
                             placeholder="Internal description" 
                             value={opt.description} 
                             onChange={(e) => handleOptionChange('material_options', idx, 'description', e.target.value)}
                             className="h-9 text-sm bg-white"
                           />
                        </div>
                        <div className="col-span-3">
                           <Label className="text-xs text-slate-400 mb-1 block">Price Mod</Label>
                           <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={opt.price_modifier} 
                                onChange={(e) => handleOptionChange('material_options', idx, 'price_modifier', e.target.value)}
                                className="h-9 text-sm bg-white pl-5"
                              />
                           </div>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mt-5 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeOption('material_options', idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.material_options.length === 0 && (
                     <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-sm">
                        No material options defined yet
                     </div>
                  )}
                </div>
              </div>

              {/* Finish Options */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                        <Check className="w-4 h-4" />
                     </div>
                     <div>
                        <Label className="text-base font-semibold text-slate-900">Finish Options</Label>
                        <p className="text-xs text-slate-500">Post-processing options like hems, grommets, etc.</p>
                     </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addOption('finish_options')}>
                    <Plus className="w-4 h-4 mr-1" /> Add Finish
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.finish_options.map((opt, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-200 group hover:border-green-300 transition-colors">
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                           <Label className="text-xs text-slate-400 mb-1 block">Name</Label>
                           <Input 
                             placeholder="e.g. Hems & Grommets" 
                             value={opt.name} 
                             onChange={(e) => handleOptionChange('finish_options', idx, 'name', e.target.value)}
                             className="h-9 text-sm bg-white"
                           />
                        </div>
                        <div className="col-span-5">
                           <Label className="text-xs text-slate-400 mb-1 block">Description</Label>
                           <Input 
                             placeholder="Description" 
                             value={opt.description} 
                             onChange={(e) => handleOptionChange('finish_options', idx, 'description', e.target.value)}
                             className="h-9 text-sm bg-white"
                           />
                        </div>
                        <div className="col-span-3">
                           <Label className="text-xs text-slate-400 mb-1 block">Price Mod</Label>
                           <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={opt.price_modifier} 
                                onChange={(e) => handleOptionChange('finish_options', idx, 'price_modifier', e.target.value)}
                                className="h-9 text-sm bg-white pl-5"
                              />
                           </div>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mt-5 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeOption('finish_options', idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.finish_options.length === 0 && (
                     <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-sm">
                        No finish options defined yet
                     </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* DETAILS & CALCULATOR TABs - Keeping mostly standard but cleaner */}
            <TabsContent value="details" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-semibold text-slate-900">Features & Benefits</h3>
                         <Button type="button" variant="ghost" size="sm" onClick={addFeature} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                         </Button>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {formData.features.map((feature, index) => (
                            <div key={index} className="flex gap-2 group">
                               <div className="flex-1 relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                  <Input 
                                     value={feature} 
                                     onChange={(e) => handleFeatureChange(index, e.target.value)} 
                                     placeholder="e.g. Weather Resistant"
                                     className="pl-7 bg-slate-50 border-slate-100 focus:bg-white transition-all"
                                  />
                               </div>
                               <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                                  <X className="w-4 h-4" />
                               </Button>
                            </div>
                         ))}
                         {formData.features.length === 0 && (
                            <div className="text-center py-12 text-slate-400 text-sm italic">Add features to highlight product benefits</div>
                         )}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                         <h3 className="font-semibold text-slate-900 mb-4">Visibility & Status</h3>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                               <div className="flex flex-col">
                                  <Label className="text-sm font-medium">Active Status</Label>
                                  <span className="text-xs text-slate-500">Visible in store catalog</span>
                               </div>
                               <Switch 
                                  checked={formData.is_active}
                                  onCheckedChange={(v) => handleInputChange('is_active', v)}
                               />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                               <div className="flex flex-col">
                                  <Label className="text-sm font-medium">Popular / Featured</Label>
                                  <span className="text-xs text-slate-500">Show in featured sections</span>
                               </div>
                               <Switch 
                                  checked={formData.is_popular}
                                  onCheckedChange={(v) => handleInputChange('is_popular', v)}
                               />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                               <div className="flex flex-col">
                                  <Label className="text-sm font-medium">Design Tool</Label>
                                  <span className="text-xs text-slate-500">Allow custom designing</span>
                               </div>
                               <Switch 
                                  checked={formData.has_design_tool}
                                  onCheckedChange={(v) => handleInputChange('has_design_tool', v)}
                               />
                            </div>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label className="text-sm">Sort Order</Label>
                            <Input 
                               type="number" 
                               value={formData.order} 
                               onChange={(e) => handleInputChange('order', Number(e.target.value))} 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-sm">Turnaround (Days)</Label>
                            <Input 
                               type="number" 
                               value={formData.turnaround_days} 
                               onChange={(e) => handleInputChange('turnaround_days', Number(e.target.value))} 
                            />
                         </div>
                         <div className="col-span-2 space-y-2">
                            <Label className="text-sm">Tax Code</Label>
                            <Input 
                               value={formData.tax_code} 
                               onChange={(e) => handleInputChange('tax_code', e.target.value)}
                               placeholder="e.g. P0000000" 
                            />
                         </div>
                      </div>
                   </div>
                </div>
            </TabsContent>

            <TabsContent value="calculator" className="space-y-6 animate-in fade-in-50 duration-300 slide-in-from-bottom-2">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                   <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                         <Settings className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                         <h3 className="text-lg font-bold text-blue-900">Dimensional Constraints</h3>
                         <p className="text-blue-700/80 text-sm mt-1 max-w-2xl">
                            Configure the allowable dimensions for this product. These settings control the inputs available to the customer in the design tool and pricing calculator.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                            <h4 className="font-bold text-slate-900">Fixed Size Mode</h4>
                            <p className="text-xs text-slate-500">Disable custom dimensions</p>
                         </div>
                         <Switch 
                            checked={formData.is_fixed_size}
                            onCheckedChange={(v) => handleInputChange('is_fixed_size', v)}
                         />
                      </div>
                      
                      <div className="space-y-4">
                         <Label className="text-sm font-medium">Default Dimensions (Inches)</Label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">W</span>
                               <Input 
                                  type="number" 
                                  value={formData.default_width} 
                                  onChange={(e) => handleInputChange('default_width', Number(e.target.value))} 
                                  className="pr-8"
                               />
                            </div>
                            <div className="relative">
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">H</span>
                               <Input 
                                  type="number" 
                                  value={formData.default_height} 
                                  onChange={(e) => handleInputChange('default_height', Number(e.target.value))} 
                                  className="pr-8"
                               />
                            </div>
                         </div>
                         <p className="text-xs text-slate-500">
                            {formData.is_fixed_size ? "These will be the ONLY dimensions available." : "These will be the starting values."}
                         </p>
                      </div>
                   </div>

                   <div className={`space-y-6 ${formData.is_fixed_size ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                      <div className="space-y-4">
                         <Label className="text-sm font-medium">Minimum Dimensions</Label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Min Width</span>
                               <Input 
                                  type="number" 
                                  value={formData.min_width} 
                                  onChange={(e) => handleInputChange('min_width', Number(e.target.value))} 
                               />
                            </div>
                            <div className="space-y-1">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Min Height</span>
                               <Input 
                                  type="number" 
                                  value={formData.min_height} 
                                  onChange={(e) => handleInputChange('min_height', Number(e.target.value))} 
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <Label className="text-sm font-medium">Maximum Dimensions</Label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Max Width</span>
                               <Input 
                                  type="number" 
                                  value={formData.max_width} 
                                  onChange={(e) => handleInputChange('max_width', Number(e.target.value))} 
                               />
                            </div>
                            <div className="space-y-1">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Max Height</span>
                               <Input 
                                  type="number" 
                                  value={formData.max_height} 
                                  onChange={(e) => handleInputChange('max_height', Number(e.target.value))} 
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </TabsContent>
          </Tabs>
          
          <div className="h-12" /> {/* Spacer */}
        </form>
      </div>
    </div>
  );
}