import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Trash2, DollarSign, ChevronDown, ChevronUp, 
  GripVertical, Eye, EyeOff, Settings2, ImagePlus, X, Loader2
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProductOptionsConfigurator({ 
  productOptions = [], 
  onOptionsChange 
}) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add new option group
  const addOptionGroup = () => {
    const newGroup = {
      id: generateId(),
      name: 'New Option',
      is_visible: true,
      choices: [
        { id: generateId(), title: 'None', hint: 'No selection', price: 0, is_visible: true, is_default: true }
      ]
    };
    onOptionsChange([...productOptions, newGroup]);
    setExpandedGroups(prev => ({ ...prev, [newGroup.id]: true }));
  };

  // Update option group
  const updateGroup = (groupId, field, value) => {
    const updated = productOptions.map(group => 
      group.id === groupId ? { ...group, [field]: value } : group
    );
    onOptionsChange(updated);
  };

  // Remove option group
  const removeGroup = (groupId) => {
    onOptionsChange(productOptions.filter(group => group.id !== groupId));
  };

  // Add choice to group
  const addChoice = (groupId) => {
    const updated = productOptions.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          choices: [
            ...group.choices,
            { id: generateId(), title: '', hint: '', price: 0, image_url: null, is_visible: true, is_default: false }
          ]
        };
      }
      return group;
    });
    onOptionsChange(updated);
  };

  // Track uploading state for choices
  const [uploadingChoiceId, setUploadingChoiceId] = useState(null);

  // Handle image upload for a choice
  const handleChoiceImageUpload = async (groupId, choiceId, file) => {
    if (!file) return;
    
    setUploadingChoiceId(choiceId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `choice-${choiceId}-${Date.now()}.${fileExt}`;
      const filePath = `options/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      updateChoice(groupId, choiceId, 'image_url', publicUrl);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingChoiceId(null);
    }
  };

  // Remove image from choice
  const removeChoiceImage = (groupId, choiceId) => {
    updateChoice(groupId, choiceId, 'image_url', null);
  };

  // Update choice in group
  const updateChoice = (groupId, choiceId, field, value) => {
    const updated = productOptions.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          choices: group.choices.map(choice => {
            if (choice.id === choiceId) {
              // If setting as default, unset other defaults
              if (field === 'is_default' && value) {
                return { ...choice, [field]: value };
              }
              return { 
                ...choice, 
                [field]: field === 'price' ? parseFloat(value) || 0 : value 
              };
            }
            // Unset default on other choices if this one is becoming default
            if (field === 'is_default' && value) {
              return { ...choice, is_default: false };
            }
            return choice;
          })
        };
      }
      return group;
    });
    onOptionsChange(updated);
  };

  // Remove choice from group
  const removeChoice = (groupId, choiceId) => {
    const updated = productOptions.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          choices: group.choices.filter(choice => choice.id !== choiceId)
        };
      }
      return group;
    });
    onOptionsChange(updated);
  };

  // Handle drag end for groups
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'groups') {
      const items = Array.from(productOptions);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      onOptionsChange(items);
    } else if (type.startsWith('choices-')) {
      const groupId = type.replace('choices-', '');
      const updated = productOptions.map(group => {
        if (group.id === groupId) {
          const choices = Array.from(group.choices);
          const [reorderedItem] = choices.splice(source.index, 1);
          choices.splice(destination.index, 0, reorderedItem);
          return { ...group, choices };
        }
        return group;
      });
      onOptionsChange(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Product Options Configurator</h3>
          <p className="text-sm text-slate-500">Create custom options like Printed Sides, Grommets, Pole Pockets, etc.</p>
        </div>
        <Button type="button" onClick={addOptionGroup} className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1" /> Add Option Group
        </Button>
      </div>

      {productOptions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <Settings2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No option groups defined</p>
          <p className="text-sm text-slate-400 mt-1">Click "Add Option Group" to create options like Printed Sides, Grommets, etc.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="option-groups" type="groups">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                {productOptions.map((group, groupIdx) => (
                  <Draggable key={group.id} draggableId={group.id} index={groupIdx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-xl overflow-hidden transition-all ${
                          snapshot.isDragging 
                            ? 'shadow-xl ring-2 ring-blue-500' 
                            : group.is_visible 
                              ? 'border-slate-200 bg-white' 
                              : 'border-slate-200 bg-slate-50 opacity-75'
                        }`}
                      >
                        {/* Group Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                          <div {...provided.dragHandleProps} className="cursor-grab text-slate-400 hover:text-slate-600">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          <Input
                            value={group.name}
                            onChange={(e) => updateGroup(group.id, 'name', e.target.value)}
                            className="flex-1 h-9 font-semibold bg-white border-slate-200"
                            placeholder="Option Group Name"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateGroup(group.id, 'is_visible', !group.is_visible)}
                              className={`p-2 rounded-lg transition-colors ${
                                group.is_visible 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                              }`}
                              title={group.is_visible ? 'Visible to customers' : 'Hidden from customers'}
                            >
                              {group.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleGroup(group.id)}
                              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              {expandedGroups[group.id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeGroup(group.id)}
                              className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Group Choices */}
                        <Collapsible open={expandedGroups[group.id] !== false}>
                          <CollapsibleContent>
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500">Choices</span>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => addChoice(group.id)}
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add Choice
                                </Button>
                              </div>

                              <Droppable droppableId={`choices-${group.id}`} type={`choices-${group.id}`}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                    {group.choices.map((choice, choiceIdx) => (
                                      <Draggable key={choice.id} draggableId={choice.id} index={choiceIdx}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                              snapshot.isDragging 
                                                ? 'shadow-lg ring-2 ring-blue-400 bg-white' 
                                                : choice.is_visible
                                                  ? 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                                  : 'bg-slate-100 border-slate-200 opacity-60'
                                            }`}
                                          >
                                            <div {...provided.dragHandleProps} className="cursor-grab text-slate-400 flex-shrink-0">
                                              <GripVertical className="w-4 h-4" />
                                            </div>
                                            
                                            {/* Image Upload Thumbnail */}
                                            <div className="flex-shrink-0">
                                              {choice.image_url ? (
                                                <div className="relative group w-10 h-10">
                                                  <img 
                                                    src={choice.image_url} 
                                                    alt={choice.title || 'Choice'} 
                                                    className="w-10 h-10 object-cover rounded-md border border-slate-200"
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => removeChoiceImage(group.id, choice.id)}
                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                  >
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <label className="w-10 h-10 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                                  {uploadingChoiceId === choice.id ? (
                                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                                  ) : (
                                                    <ImagePlus className="w-4 h-4 text-slate-400" />
                                                  )}
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleChoiceImageUpload(group.id, choice.id, e.target.files?.[0])}
                                                  />
                                                </label>
                                              )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                              <Input
                                                value={choice.title}
                                                onChange={(e) => updateChoice(group.id, choice.id, 'title', e.target.value)}
                                                className="h-8 text-sm bg-white"
                                                placeholder="Title (e.g. None)"
                                              />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                              <Input
                                                value={choice.hint || ''}
                                                onChange={(e) => updateChoice(group.id, choice.id, 'hint', e.target.value)}
                                                className="h-8 text-sm bg-white"
                                                placeholder="Hint (e.g. No pole pockets)"
                                              />
                                            </div>

                                            <div className="w-24 flex-shrink-0">
                                              <div className="relative">
                                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={choice.price || 0}
                                                  onChange={(e) => updateChoice(group.id, choice.id, 'price', e.target.value)}
                                                  className="h-8 text-sm bg-white pl-6"
                                                  placeholder="0.00"
                                                />
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => updateChoice(group.id, choice.id, 'is_visible', !choice.is_visible)}
                                                className={`p-1.5 rounded transition-colors ${
                                                  choice.is_visible 
                                                    ? 'text-green-600 hover:bg-green-50' 
                                                    : 'text-slate-400 hover:bg-slate-100'
                                                }`}
                                                title={choice.is_visible ? 'Visible' : 'Hidden'}
                                              >
                                                {choice.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => removeChoice(group.id, choice.id)}
                                                className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>

                              {group.choices.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-sm">
                                  No choices defined. Add at least one choice.
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
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
  );
}
