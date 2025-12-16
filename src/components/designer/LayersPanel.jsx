import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { 
  Eye, EyeOff, Lock, Unlock, Trash2, GripVertical,
  Type, Image, Square, AlertTriangle, Crosshair
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LayersPanel({ 
  elements, 
  selectedElement, 
  setSelectedElement,
  setElements,
  updateElement,
  deleteElement,
  canvasWidth,
  canvasHeight,
  saveToHistory,
}) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    // Since we reverse the array for display, we need to convert indices
    const sourceIndex = elements.length - 1 - result.source.index;
    const destIndex = elements.length - 1 - result.destination.index;
    
    const items = [...elements];
    const [removed] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, removed);
    
    setElements(items);
    if (saveToHistory) saveToHistory(items);
  };

  const isElementOffCanvas = (element) => {
    if (!canvasWidth || !canvasHeight) return false;
    const isCompletelyOutside = 
      (element.x + element.width < 0) || // fully left
      (element.x > canvasWidth) || // fully right
      (element.y + element.height < 0) || // fully above
      (element.y > canvasHeight); // fully below
    return isCompletelyOutside;
  };

  const centerElementOnCanvas = (elementId) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || !canvasWidth || !canvasHeight) return;
    updateElement(elementId, {
      x: (canvasWidth - element.width) / 2,
      y: (canvasHeight - element.height) / 2,
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      default: return Square;
    }
  };

  const getLabel = (element) => {
    switch (element.type) {
      case 'text': return element.text?.substring(0, 20) || 'Text';
      case 'image': return 'Image';
      case 'shape': return element.shape || 'Shape';
      default: return 'Element';
    }
  };

  // Reversed for display (top layer first)
  const reversedElements = [...elements].reverse();

  return (
    <TooltipProvider>
      <div className="p-2">
        {elements.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No layers yet</p>
            <p className="text-xs mt-1">Add elements to see them here</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="layers">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-1"
                >
                  {reversedElements.map((element, index) => {
                    const Icon = getIcon(element.type);
                    const isSelected = selectedElement === element.id;
                    const isOffCanvas = isElementOffCanvas(element);
                    
                    return (
                      <Draggable 
                        key={element.id} 
                        draggableId={String(element.id)} 
                        index={index}
                        isDragDisabled={element.locked}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-600/20 border border-blue-500' : 'hover:bg-gray-700 border border-transparent'
                            } ${isOffCanvas ? 'bg-amber-900/20' : ''} ${
                              snapshot.isDragging ? 'bg-blue-600/30 shadow-lg' : ''
                            }`}
                            onClick={() => setSelectedElement(element.id)}
                          >
                            {/* Drag Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing ${element.locked ? 'opacity-30' : ''}`}
                            >
                              <GripVertical className="w-4 h-4 text-gray-500" />
                            </div>
                            
                            {/* Off-canvas warning indicator */}
                            {isOffCanvas && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-amber-500">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>Element is outside the canvas</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {/* Thumbnail */}
                            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                              element.type === 'shape' ? '' : 'bg-gray-700'
                            }`} style={element.type === 'shape' ? { backgroundColor: element.fill } : {}}>
                              {element.type === 'image' ? (
                                <img src={element.src} alt="" className="w-full h-full object-cover rounded" />
                              ) : (
                                <Icon className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            
                            {/* Label */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white truncate">{getLabel(element)}</div>
                              <div className="text-xs text-gray-400">
                                {element.width?.toFixed(1)}" × {element.height?.toFixed(1)}"
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-0.5">
                              {/* Center on canvas button for off-canvas elements */}
                              {isOffCanvas && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-amber-500 hover:text-amber-400"
                                      onClick={(e) => { e.stopPropagation(); centerElementOnCanvas(element.id); }}
                                    >
                                      <Crosshair className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Center on canvas</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); updateElement(element.id, { visible: !element.visible }); }}
                              >
                                {element.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                onClick={(e) => { e.stopPropagation(); updateElement(element.id, { locked: !element.locked }); }}
                              >
                                {element.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                                onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </TooltipProvider>
  );
}
