import React, { useEffect, useState, useRef } from 'react';
import { XCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

const THINKING_STEPS = [
  "Analyzing your request...",
  "Imagining the scene...",
  "Sketching the outlines...",
  "Adding details...",
  "Refining the lines...",
  "Finalizing the masterpiece..."
];

interface LoadingOverlayProps {
  current?: number;
  total?: number;
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ current, total, onCancel }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cycle through messages
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % THINKING_STEPS.length);
    }, 2500);

    // Focus trap / accessibility
    modalRef.current?.focus();

    return () => clearInterval(interval);
  }, []);

  // Calculate progress
  const progress = (total && total > 0 && current) ? (current / total) * 100 : 0;

  return (
    <div
        ref={modalRef}
        className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Generating coloring page"
        tabIndex={-1}
    >
      <div className="relative w-32 h-32 mb-10">
        {/* Animated Rings */}
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full animate-ping"></div>
        <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin duration-1000"></div>

        {/* Central Icon */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
           <svg className="w-12 h-12 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
           </svg>
        </div>
      </div>
      
      <div className="text-center space-y-4 max-w-sm w-full">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight" aria-live="polite">
            {THINKING_STEPS[msgIndex]}
          </h3>

          {total && total > 1 && current !== undefined && (
            <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 to-fun-blue transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-slate-400 font-medium">Page {current} of {total}</p>
            </div>
          )}
      </div>
      
      {/* Cancel Button */}
      {onCancel && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 delay-500">
             <Tooltip content="Stop generation">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors px-6 py-2 rounded-full hover:bg-red-50 font-bold text-sm"
                >
                    <XCircle className="w-5 h-5" />
                    <span>Cancel</span>
                </button>
             </Tooltip>
          </div>
      )}
    </div>
  );
};
