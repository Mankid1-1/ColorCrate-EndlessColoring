import React from 'react';
import { PageData } from '../types';
import { Printer, ZoomIn, AlertTriangle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface BookPageThumbnailProps {
    page: PageData;
    index: number;
    isFailed: boolean;
    onImageError: (id: string) => void;
    onFocus: (id: string) => void;
    onPrint: (page: PageData) => void;
}

export const BookPageThumbnail = React.memo<BookPageThumbnailProps>(({
    page,
    index,
    isFailed,
    onImageError,
    onFocus,
    onPrint
}) => (
    <div className="group relative aspect-[3/4] bg-white rounded-2xl shadow-sm border-2 border-slate-100 hover:border-brand-300 transition-all overflow-hidden hover:shadow-xl hover:-translate-y-1">
        {isFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-50 text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-amber-500" />
                <span className="text-xs font-bold">Failed to load image</span>
            </div>
        ) : (
            <img
                src={page.modifiedUrl || page.originalUrl}
                className="w-full h-full object-contain p-2"
                alt={`Page ${index + 1}`}
                onError={() => onImageError(page.id)}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
            />
        )}

        {/* Number Badge */}
        <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center font-black text-slate-400 text-xs shadow-sm border border-slate-100">
            {index + 1}
        </div>

        {/* Hover Overlay */}
        {!isFailed && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <Tooltip content="View & Edit Page">
                    <button
                        onClick={() => onFocus(page.id)}
                        className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                        aria-label={`View and edit page ${index + 1}`}
                    >
                        <ZoomIn className="w-6 h-6" />
                    </button>
                </Tooltip>
                <Tooltip content="Print This Page">
                    <button
                        onClick={() => onPrint(page)}
                        className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                        aria-label={`Print page ${index + 1}`}
                    >
                        <Printer className="w-6 h-6" />
                    </button>
                </Tooltip>
            </div>
        )}
    </div>
));

BookPageThumbnail.displayName = 'BookPageThumbnail';
