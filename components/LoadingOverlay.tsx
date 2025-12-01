import React, { useEffect, useState } from 'react';

const MESSAGES = [
  "Mixing the paints...",
  "Sharpening pencils...",
  "Drawing the outlines...",
  "Creating magic...",
  "Designing the scene..."
];

interface LoadingOverlayProps {
  current?: number;
  total?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ current, total }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
           </svg>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-slate-800 animate-pulse text-center">{MESSAGES[msgIndex]}</h3>
      
      {total && total > 1 && current && (
        <div className="mt-6 w-full max-w-xs">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                <span>Generating Book</span>
                <span>{current} / {total}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-brand-400 to-fun-blue transition-all duration-300 ease-out"
                    style={{ width: `${(current / total) * 100}%` }}
                ></div>
            </div>
        </div>
      )}
      
      <p className="text-slate-400 mt-4 text-sm font-medium">Powered by Gemini AI</p>
    </div>
  );
};