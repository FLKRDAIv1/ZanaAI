
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Type, Square, Circle, Pencil, Move, Undo2, ArrowUpRight, Minus, StickyNote } from 'lucide-react';

interface Element {
  id: string;
  type: 'path' | 'text' | 'rect' | 'circle' | 'line' | 'arrow' | 'note';
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  text?: string;
  color: string;
  width: number;
}

interface ImageCropperProps {
  image: string;
  onClose: () => void;
  onCrop: (croppedBase64: string) => void;
}

type Tool = 'crop' | 'draw' | 'text' | 'rect' | 'circle' | 'line' | 'arrow' | 'note';

const COLORS = ['#EF4444', '#22C55E', '#3B82F6', '#FACC15', '#FFFFFF', '#000000'];

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onClose, onCrop }) => {
  const [activeTool, setActiveTool] = useState<Tool>('crop');
  const [activeColor, setActiveColor] = useState('#EF4444');
  
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const [elements, setElements] = useState<Element[]>([]);
  const [currentElement, setCurrentElement] = useState<Element | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 800;
      setImageSize({ width: w, height: h });
      
      if (containerRef.current) {
        const cWidth = containerRef.current.clientWidth || 360;
        const cHeight = containerRef.current.clientHeight || 360;
        const scale = Math.min(cWidth / w, cHeight / h) * 0.9;
        setZoom(scale || 1);
      }
    };
    img.src = image;
  }, [image]);

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getRelativeCoords(e);
    setIsInteracting(true);
    setDragStart(coords);

    if (activeTool === 'crop') {
      setDragStart({ x: coords.x - offset.x, y: coords.y - offset.y });
    } else if (activeTool === 'draw') {
      const newEl: Element = {
        id: crypto.randomUUID(),
        type: 'path',
        points: [{ x: coords.x, y: coords.y }],
        color: activeColor,
        width: 4
      };
      setCurrentElement(newEl);
    } else if (['rect', 'circle', 'line', 'arrow'].includes(activeTool)) {
      const newEl: Element = {
        id: crypto.randomUUID(),
        type: activeTool as any,
        x: coords.x,
        y: coords.y,
        w: 0,
        h: 0,
        color: activeColor,
        width: 3
      };
      setCurrentElement(newEl);
    } else if (activeTool === 'text' || activeTool === 'note') {
      const userInput = prompt(activeTool === 'text' ? 'Text:' : 'Note:', '');
      if (userInput) {
        const newEl: Element = {
          id: crypto.randomUUID(),
          type: activeTool,
          x: coords.x,
          y: coords.y,
          text: userInput,
          color: activeTool === 'note' ? '#000000' : activeColor, 
          width: activeTool === 'note' ? 14 : 24
        };
        setElements(prev => [...prev, newEl]);
      }
      setIsInteracting(false);
    }
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteracting) return;
    const coords = getRelativeCoords(e);

    if (activeTool === 'crop') {
      setOffset({
        x: coords.x - dragStart.x,
        y: coords.y - dragStart.y
      });
    } else if (activeTool === 'draw' && currentElement) {
      setCurrentElement(prev => ({
        ...prev!,
        points: [...(prev!.points || []), { x: coords.x, y: coords.y }]
      }));
    } else if (['rect', 'circle', 'line', 'arrow'].includes(activeTool) && currentElement) {
      setCurrentElement(prev => ({
        ...prev!,
        w: coords.x - (prev!.x || 0),
        h: coords.y - (prev!.y || 0)
      }));
    }
  };

  const handleInteractionEnd = () => {
    if (currentElement) {
      setElements(prev => [...prev, currentElement]);
      setCurrentElement(null);
    }
    setIsInteracting(false);
  };

  const handleUndo = () => setElements(prev => prev.slice(0, -1));
  const handleClear = () => setElements([]);

  const handleDone = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const container = containerRef.current;
    if (!canvas || !img || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerW = container.clientWidth;
    canvas.width = 1024;
    canvas.height = 1024;
    const scale = canvas.width / containerW;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgRect = img.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    
    const drawX = (imgRect.left - contRect.left) * scale;
    const drawY = (imgRect.top - contRect.top) * scale;
    const drawW = imgRect.width * scale;
    const drawH = imgRect.height * scale;
    
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    elements.forEach(el => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'path' && el.points) {
        ctx.beginPath();
        el.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x * scale, p.y * scale);
          else ctx.lineTo(p.x * scale, p.y * scale);
        });
        ctx.stroke();
      } else if (el.type === 'rect') {
        ctx.strokeRect((el.x || 0) * scale, (el.y || 0) * scale, (el.w || 0) * scale, (el.h || 0) * scale);
      } else if (el.type === 'circle') {
        const r = Math.sqrt(Math.pow(el.w || 0, 2) + Math.pow(el.h || 0, 2)) * scale;
        ctx.beginPath();
        ctx.arc((el.x || 0) * scale, (el.y || 0) * scale, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'line' || el.type === 'arrow') {
        const fx = (el.x || 0) * scale;
        const fy = (el.y || 0) * scale;
        const tx = ((el.x || 0) + (el.w || 0)) * scale;
        const ty = ((el.y || 0) + (el.h || 0)) * scale;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        if (el.type === 'arrow') {
            const angle = Math.atan2(ty - fy, tx - fx);
            const head = 12 * scale;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - head * Math.cos(angle - Math.PI / 6), ty - head * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(tx - head * Math.cos(angle + Math.PI / 6), ty - head * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        }
      } else if (el.type === 'text') {
        ctx.font = `bold ${el.width * scale}px Vazirmatn, sans-serif`;
        ctx.fillText(el.text || '', (el.x || 0) * scale, (el.y || 0) * scale);
      } else if (el.type === 'note') {
        const p = 10 * scale;
        ctx.font = `bold ${el.width * scale}px Vazirmatn, sans-serif`;
        const m = ctx.measureText(el.text || '');
        const rw = m.width + p * 2;
        const rh = el.width * scale + p * 2;
        ctx.fillStyle = '#FACC15';
        ctx.fillRect((el.x || 0) * scale, (el.y || 0) * scale - rh, rw, rh);
        ctx.fillStyle = '#000000';
        ctx.fillText(el.text || '', (el.x || 0) * scale + p, (el.y || 0) * scale - p);
      }
    });
    
    onCrop(canvas.toDataURL('image/jpeg', 0.85));
  };

  const isDrawing = activeTool !== 'crop';

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black overflow-hidden animate-fade-in">
      <div className={`flex items-center justify-between p-4 bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 transition-all ${isInteracting ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
        <span className="text-white font-bold text-xs uppercase tracking-widest">Zana AI Editor ✨</span>
        <button onClick={handleDone} className="px-4 py-2 bg-blue-600 text-white rounded-full font-bold shadow-lg flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            <span>ناردن</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div 
          ref={containerRef}
          className={`relative w-full aspect-square max-w-sm rounded-[32px] overflow-hidden bg-zinc-900 border-4 transition-all duration-300 touch-none shadow-2xl
            ${isDrawing ? 'border-blue-500/40 shadow-blue-500/10' : 'border-white/5 shadow-black/50'}
          `}
          onMouseDown={handleInteractionStart}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
        >
          <img 
            ref={imageRef}
            src={image} 
            alt="Source" 
            className="absolute max-w-none select-none pointer-events-none"
            style={{
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              display: imageSize.width > 0 ? 'block' : 'none'
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {[...elements, currentElement].filter(Boolean).map((el) => (
              <g key={el!.id}>
                {el!.type === 'path' && el!.points && (
                  <path d={`M ${el!.points[0].x} ${el!.points[0].y} ${el!.points.map(p => `L ${p.x} ${p.y}`).join(' ')}`} stroke={el!.color} strokeWidth={el!.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {el!.type === 'rect' && (
                  <rect x={el!.w! < 0 ? (el!.x || 0) + el!.w! : el!.x} y={el!.h! < 0 ? (el!.y || 0) + el!.h! : el!.y} width={Math.abs(el!.w || 0)} height={Math.abs(el!.h || 0)} stroke={el!.color} strokeWidth={el!.width} fill="none" />
                )}
                {el!.type === 'circle' && (
                  <circle cx={el!.x} cy={el!.y} r={Math.sqrt(Math.pow(el!.w || 0, 2) + Math.pow(el!.h || 0, 2))} stroke={el!.color} strokeWidth={el!.width} fill="none" />
                )}
                {(el!.type === 'line' || el!.type === 'arrow') && (
                  <g>
                    <line x1={el!.x} y1={el!.y} x2={(el!.x || 0) + (el!.w || 0)} y2={(el!.y || 0) + (el!.h || 0)} stroke={el!.color} strokeWidth={el!.width} strokeLinecap="round" />
                    {el!.type === 'arrow' && <circle cx={(el!.x || 0) + (el!.w || 0)} cy={(el!.y || 0) + (el!.h || 0)} r={el!.width + 1} fill={el!.color} />}
                  </g>
                )}
                {el!.type === 'text' && (
                  <text x={el!.x} y={el!.y} fill={el!.color} fontSize={el!.width} fontWeight="bold" style={{fontFamily: 'Vazirmatn'}}>{el!.text}</text>
                )}
                {el!.type === 'note' && (
                  <g>
                    <rect x={el!.x} y={(el!.y || 0) - el!.width - 15} width={100} height={el!.width + 20} fill="#FACC15" rx="4" />
                    <text x={(el!.x || 0) + 8} y={(el!.y || 0) - 8} fill="black" fontSize={el!.width} fontWeight="bold" style={{fontFamily: 'Vazirmatn'}}>{el!.text}</text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div className={`absolute inset-0 bg-black/60 pointer-events-none transition-opacity duration-300 z-0 ${isInteracting ? 'opacity-100' : 'opacity-0'}`} />

        <div className={`mt-8 w-full max-w-sm flex flex-col gap-5 transition-all duration-300 z-20 ${isInteracting ? 'opacity-0 translate-y-10' : 'opacity-100'}`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setActiveColor(c)} className={`w-7 h-7 rounded-full border-2 transition-transform ${activeColor === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleUndo} className="p-2 text-white/40 hover:text-white"><Undo2 size={20} /></button>
              <button onClick={handleClear} className="p-2 text-red-400/40 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 bg-zinc-900/80 p-2 rounded-[24px] border border-white/5 backdrop-blur-xl shadow-2xl">
            <ToolBtn active={activeTool === 'crop'} onClick={() => setActiveTool('crop')} icon={<Move size={18} />} label="جوڵان" />
            <ToolBtn active={activeTool === 'draw'} onClick={() => setActiveTool('draw')} icon={<Pencil size={18} />} label="ڕەنگ" />
            <ToolBtn active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={18} />} label="دەق" />
            <ToolBtn active={activeTool === 'note'} onClick={() => setActiveTool('note')} icon={<StickyNote size={18} />} label="تێبینی" />
            <ToolBtn active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} icon={<Square size={18} />} label="Box" />
            <ToolBtn active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={<Circle size={18} />} label="O" />
            <ToolBtn active={activeTool === 'line'} onClick={() => setActiveTool('line')} icon={<Minus size={18} className="rotate-45" />} label="—" />
            <ToolBtn active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} icon={<ArrowUpRight size={18} />} label="->" />
          </div>

          <div className="px-3 pb-4">
            <input type="range" min="0.1" max="5" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
            <div className="flex justify-between text-[10px] text-white/30 font-bold mt-2 tracking-widest uppercase">
                <span>Zoom Scale</span>
                <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all ${active ? 'bg-white text-black shadow-lg scale-110' : 'text-white/40 hover:text-white/80'}`}>
    {icon}
    <span className="text-[8px] font-bold tracking-tighter uppercase">{label}</span>
  </button>
);

export default ImageCropper;
