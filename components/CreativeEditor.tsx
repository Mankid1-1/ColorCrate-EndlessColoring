import React, { useEffect, useRef, useState } from 'react';
import { EditorItem, EditorTool } from '../types';
import { MousePointer2, Type, Sticker, PenTool, Eraser, Check, X, Undo, Trash2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface CreativeEditorProps {
  pageId: string;
  baseImage: string;
  onClose: () => void;
  onSave: (newImage: string) => void;
}

const STICKERS = [
  '⭐', '❤️', '🌈', '🦄', '🎨', '🚀', '🦕', '🌸', '👑', '🎈', '🍦', '🐶'
];

export const CreativeEditor: React.FC<CreativeEditorProps> = ({ pageId, baseImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<EditorItem[]>([]);
  const [tool, setTool] = useState<EditorTool>('move');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);

  // Persistence Key
  const STORAGE_KEY = `cc_editor_draft_${pageId}`;

  // Load Draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) {
          setItems(parsed.items);
        }
      }
    } catch (e) {
      console.error("Failed to load editor draft", e);
    }
  }, [pageId]);

  // Save Draft
  useEffect(() => {
    // We only save if there are items, or if we need to clear an empty state that was previously saved
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, timestamp: Date.now() }));
    } else {
      // If items are empty, check if we had a draft and remove it to keep clean
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [items, pageId]);

  // Canvas Setup
  useEffect(() => {
    drawCanvas();
  }, [baseImage, items, currentPath, selectedId]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Load base image
    const img = new Image();
    img.src = baseImage;
    img.crossOrigin = "anonymous"; // Helpful if dealing with external URLs in future
    
    // Draw background white first
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Base
    // Ensure image is loaded before drawing
    if (img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        img.onload = () => {
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             // Trigger re-render of items on top if image loaded late
             drawItems(ctx);
        }
    }

    if (img.complete) {
        drawItems(ctx);
    }
  };

  const drawItems = (ctx: CanvasRenderingContext2D) => {
    items.forEach(item => {
        ctx.save();
        if (item.type === 'path' && item.points) {
            ctx.beginPath();
            ctx.moveTo(item.points[0].x, item.points[0].y);
            for (let i = 1; i < item.points.length; i++) {
                ctx.lineTo(item.points[i].x, item.points[i].y);
            }
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        } else {
            ctx.translate(item.x, item.y);
            ctx.scale(item.scale, item.scale);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (item.type === 'text' || item.type === 'sticker') {
                ctx.font = item.type === 'sticker' ? '50px sans-serif' : 'bold 40px sans-serif';
                ctx.fillStyle = item.color;
                ctx.fillText(item.content, 0, 0);
            }

            // Selection Outline
            if (item.id === selectedId) {
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 2 / item.scale;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(-60, -30, 120, 60); // Approx box
            }
        }
        ctx.restore();
    });

    // Draw Current Path (if drawing)
    if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (tool === 'draw') {
          setIsDrawing(true);
          const coords = getCanvasCoordinates(e);
          setCurrentPath([coords]);
      } else if (tool === 'move') {
          const coords = getCanvasCoordinates(e);
          const hit = items.find(item => {
              // Very rough hit test
              return Math.abs(item.x - coords.x) < 50 && Math.abs(item.y - coords.y) < 50;
          });
          if (hit) setSelectedId(hit.id);
          else setSelectedId(null);
      }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (isDrawing && tool === 'draw') {
          const coords = getCanvasCoordinates(e);
          setCurrentPath(prev => [...prev, coords]);
      } else if (tool === 'move' && selectedId) {
           // Type narrowing for drag check
           let isDragging = false;
           if ('buttons' in e) {
             isDragging = e.buttons === 1;
           } else if ('touches' in e) {
             isDragging = true;
           }
           
           if (isDragging) {
             const coords = getCanvasCoordinates(e);
             setItems(items.map(item => item.id === selectedId ? { ...item, x: coords.x, y: coords.y } : item));
           }
      }
  };

  const handlePointerUp = () => {
      if (isDrawing) {
          setIsDrawing(false);
          if (currentPath.length > 2) {
            const newItem: EditorItem = {
                id: Date.now().toString(),
                type: 'path',
                content: 'path',
                x: 0, 
                y: 0,
                scale: 1,
                color: '#000000',
                points: currentPath
            };
            setItems([...items, newItem]);
          }
          setCurrentPath([]);
      }
  };

  const addSticker = (emoji: string) => {
      const canvas = canvasRef.current;
      setItems([...items, {
          id: Date.now().toString(),
          type: 'sticker',
          content: emoji,
          x: canvas ? canvas.width / 2 : 100,
          y: canvas ? canvas.height / 2 : 100,
          scale: 1.5,
          color: '#000000'
      }]);
      setTool('move');
  };

  const addText = () => {
      if (!textInput.trim()) return;
      const canvas = canvasRef.current;
      setItems([...items, {
        id: Date.now().toString(),
        type: 'text',
        content: textInput,
        x: canvas ? canvas.width / 2 : 100,
        y: canvas ? canvas.height / 2 : 100,
        scale: 1,
        color: '#000000'
      }]);
      setTextInput('');
      setTool('move');
  };

  const handleDelete = () => {
      if (selectedId) {
          setItems(items.filter(i => i.id !== selectedId));
          setSelectedId(null);
      }
  };

  const handleSave = () => {
    setSelectedId(null);
    // Timeout to allow re-render without selection box
    setTimeout(() => {
        drawCanvas();
        if (canvasRef.current) {
            // Remove draft from storage since we are baking it in
            localStorage.removeItem(STORAGE_KEY);
            onSave(canvasRef.current.toDataURL('image/png'));
        }
    }, 50);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-800 text-white">
            <Tooltip content="Close without saving" position="bottom">
              <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full"><X /></button>
            </Tooltip>
            <h3 className="font-bold">Creative Studio</h3>
            <Tooltip content="Save Changes">
              <button onClick={handleSave} className="px-6 py-2 bg-brand-500 rounded-full font-bold hover:bg-brand-400 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save
              </button>
            </Tooltip>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-800 flex items-center justify-center p-4">
             <canvas 
                ref={canvasRef}
                width={1000} // High res internal
                height={1333} // 3:4 aspect
                className="max-h-full max-w-full bg-white shadow-2xl rounded-sm touch-none"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
             />
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 pb-8 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
            <div className="flex justify-center space-x-6 mb-6">
                <Tooltip content="Select & Move items">
                  <button onClick={() => setTool('move')} className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${tool === 'move' ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500' : 'text-slate-400 hover:bg-slate-50'}`}>
                      <MousePointer2 className="w-6 h-6" />
                      <span className="text-xs font-bold">Move</span>
                  </button>
                </Tooltip>
                <Tooltip content="Freehand Drawing">
                  <button onClick={() => setTool('draw')} className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${tool === 'draw' ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500' : 'text-slate-400 hover:bg-slate-50'}`}>
                      <PenTool className="w-6 h-6" />
                      <span className="text-xs font-bold">Draw</span>
                  </button>
                </Tooltip>
                <Tooltip content="Add Emojis">
                  <button onClick={() => setTool('sticker')} className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${tool === 'sticker' ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500' : 'text-slate-400 hover:bg-slate-50'}`}>
                      <Sticker className="w-6 h-6" />
                      <span className="text-xs font-bold">Sticker</span>
                  </button>
                </Tooltip>
                <Tooltip content="Add Text Labels">
                  <button onClick={() => setTool('text')} className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${tool === 'text' ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500' : 'text-slate-400 hover:bg-slate-50'}`}>
                      <Type className="w-6 h-6" />
                      <span className="text-xs font-bold">Text</span>
                  </button>
                </Tooltip>
            </div>

            {/* Sub-tools */}
            <div className="min-h-[60px]">
                {tool === 'sticker' && (
                    <div className="flex gap-4 overflow-x-auto pb-2 px-2 scrollbar-hide">
                        {STICKERS.map(s => (
                            <button key={s} onClick={() => addSticker(s)} className="text-3xl hover:scale-125 transition-transform p-1">{s}</button>
                        ))}
                    </div>
                )}

                {tool === 'text' && (
                    <div className="flex gap-2">
                        <input 
                            value={textInput} 
                            onChange={e => setTextInput(e.target.value)} 
                            className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Enter text..."
                        />
                        <button onClick={addText} className="bg-brand-600 text-white px-4 rounded-xl font-bold">Add</button>
                    </div>
                )}

                {tool === 'move' && selectedId && (
                     <div className="flex justify-center">
                        <Tooltip content="Remove selected item">
                          <button onClick={handleDelete} className="flex items-center gap-2 text-red-500 bg-red-50 px-6 py-2 rounded-xl font-bold border border-red-100">
                              <Trash2 className="w-5 h-5" /> Delete Item
                          </button>
                        </Tooltip>
                     </div>
                )}
                 {tool === 'draw' && (
                     <div className="text-center text-slate-400 text-sm font-medium">
                        Draw freely on the canvas!
                     </div>
                )}
            </div>
        </div>
    </div>
  );
};