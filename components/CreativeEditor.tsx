import React, { useEffect, useRef, useState } from 'react';
import { EditorItem, EditorTool } from '../types';
import { MousePointer2, Type, Sticker, PenTool, Eraser, Check, X, Undo, Trash2, Redo, RotateCw, RotateCcw } from 'lucide-react';
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
  const moveToolRef = useRef<HTMLButtonElement>(null);
  const [items, setItems] = useState<EditorItem[]>([]);
  const [history, setHistory] = useState<EditorItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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

  // History Management
  const addToHistory = (newItems: EditorItem[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newItems);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setItems(newItems);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          setItems(history[historyIndex - 1]);
          setSelectedId(null);
      } else if (historyIndex === 0) {
          // Initial state
          setHistoryIndex(-1);
          setItems([]);
          setSelectedId(null);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
          setItems(history[historyIndex + 1]);
          setSelectedId(null);
      }
  };

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
    img.crossOrigin = "anonymous";
    
    // Draw background white first
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Base
    if (img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        img.onload = () => {
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
        if (item.type === 'path' && item.points && item.points.length > 0) {
            ctx.beginPath();

            // Quadratic Curve Smoothing
            if (item.points.length < 3) {
                 ctx.moveTo(item.points[0].x, item.points[0].y);
                 for (let i = 1; i < item.points.length; i++) {
                     ctx.lineTo(item.points[i].x, item.points[i].y);
                 }
            } else {
                ctx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 1; i < item.points.length - 1; i++) {
                    const xc = (item.points[i].x + item.points[i + 1].x) / 2;
                    const yc = (item.points[i].y + item.points[i + 1].y) / 2;
                    ctx.quadraticCurveTo(item.points[i].x, item.points[i].y, xc, yc);
                }
                ctx.lineTo(item.points[item.points.length - 1].x, item.points[item.points.length - 1].y);
            }

            ctx.strokeStyle = item.color;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        } else {
            ctx.translate(item.x, item.y);
            ctx.scale(item.scale, item.scale);
            if (item.rotation) {
                ctx.rotate((item.rotation * Math.PI) / 180);
            }
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
        // Simple smoothing for preview
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
            addToHistory([...items, newItem]);
          }
          setCurrentPath([]);
      } else if (tool === 'move' && selectedId) {
         // Save state after move
         // Note: optimize to avoid saving on every micro-move, only on release
         // For now, we just save if something changed from history top
         // Ideally compare deep equality but here we assume a move happened if selected
         addToHistory([...items]);
      }
  };

  const addSticker = (emoji: string) => {
      const canvas = canvasRef.current;
      const newItem: EditorItem = {
          id: Date.now().toString(),
          type: 'sticker',
          content: emoji,
          x: canvas ? canvas.width / 2 : 100,
          y: canvas ? canvas.height / 2 : 100,
          scale: 1.5,
          rotation: 0,
          color: '#000000'
      };
      addToHistory([...items, newItem]);
      setTool('move');
      setSelectedId(newItem.id);
      setTimeout(() => moveToolRef.current?.focus(), 0);
  };

  const addText = () => {
      if (!textInput.trim()) return;
      const canvas = canvasRef.current;
      const newItem: EditorItem = {
        id: Date.now().toString(),
        type: 'text',
        content: textInput,
        x: canvas ? canvas.width / 2 : 100,
        y: canvas ? canvas.height / 2 : 100,
        scale: 1,
        rotation: 0,
        color: '#000000'
      };
      addToHistory([...items, newItem]);
      setTextInput('');
      setTool('move');
      setSelectedId(newItem.id);
      setTimeout(() => moveToolRef.current?.focus(), 0);
  };

  const handleDelete = () => {
      if (selectedId) {
          addToHistory(items.filter(i => i.id !== selectedId));
          setSelectedId(null);
      }
  };

  const handleRotate = (degrees: number) => {
      if (selectedId) {
          const newItems = items.map(item => {
              if (item.id === selectedId) {
                  return { ...item, rotation: (item.rotation || 0) + degrees };
              }
              return item;
          });
          setItems(newItems); // Update preview immediately
          // Note: Ideally debounce this for history
      }
  };

  // Commit rotation to history when done (optional, for now we manually button click so we can commit)
  const commitRotate = () => {
      addToHistory(items);
  };

  const handleSave = () => {
    setSelectedId(null);
    setTimeout(() => {
        drawCanvas();
        if (canvasRef.current) {
            localStorage.removeItem(STORAGE_KEY);
            onSave(canvasRef.current.toDataURL('image/png'));
        }
    }, 50);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-800 text-white">
            <div className="flex items-center gap-4">
                <Tooltip content="Close without saving" position="bottom">
                  <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full" aria-label="Close"><X /></button>
                </Tooltip>

                {/* Undo / Redo */}
                <div className="flex bg-slate-700 rounded-lg p-1 gap-1">
                    <Tooltip content="Undo">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex < 0}
                            className={`p-2 rounded hover:bg-slate-600 ${historyIndex < 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            aria-label="Undo"
                        >
                            <Undo className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Redo">
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className={`p-2 rounded hover:bg-slate-600 ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            aria-label="Redo"
                        >
                            <Redo className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <h3 className="font-bold hidden md:block">Creative Studio</h3>

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
                  <button ref={moveToolRef} onClick={() => setTool('move')} className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${tool === 'move' ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500' : 'text-slate-400 hover:bg-slate-50'}`}>
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
                            <button key={s} onClick={() => addSticker(s)} className="text-3xl hover:scale-125 transition-transform p-1" aria-label={`Add sticker ${s}`}>{s}</button>
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
                     <div className="flex justify-center items-center gap-4">
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            <Tooltip content="Rotate Left">
                                <button onClick={() => { handleRotate(-45); commitRotate(); }} className="p-2 hover:bg-white rounded shadow-sm" aria-label="Rotate Left">
                                    <RotateCcw className="w-4 h-4 text-slate-600" />
                                </button>
                            </Tooltip>
                            <Tooltip content="Rotate Right">
                                <button onClick={() => { handleRotate(45); commitRotate(); }} className="p-2 hover:bg-white rounded shadow-sm" aria-label="Rotate Right">
                                    <RotateCw className="w-4 h-4 text-slate-600" />
                                </button>
                            </Tooltip>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <Tooltip content="Remove selected item">
                          <button onClick={handleDelete} className="flex items-center gap-2 text-red-500 bg-red-50 px-6 py-2 rounded-xl font-bold border border-red-100 hover:bg-red-100">
                              <Trash2 className="w-5 h-5" /> Delete
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
