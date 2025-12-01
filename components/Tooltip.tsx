import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      // Handle touch start for mobile tooltip behavior if needed, 
      // though typically tooltips are hover-only or long-press on mobile.
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[100] px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200 border border-slate-700 ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          {content}
          {/* Little Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform rotate-45 border-r border-b border-slate-700 ${
              position === 'top' ? 'top-full -mt-1 border-r-0 border-b-0 border-l border-t' : 'bottom-full -mb-1'
          }`}></div>
        </div>
      )}
    </div>
  );
};