import React from 'react';
import { BookOpen, Clock, Trash2 } from 'lucide-react';
import { BookSummary } from '../hooks/useBookLibrary';

interface BookCardProps {
    book: BookSummary;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
}

export const BookCard = React.memo<BookCardProps>(({ book, onOpen, onDelete }) => {
    const [isConfirming, setIsConfirming] = React.useState(false);

    // Reset confirmation state when book id changes or after timeout
    React.useEffect(() => {
        if (isConfirming) {
            const timer = setTimeout(() => setIsConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming]);

    return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-brand-200 transition-all">
        <button
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset"
            onClick={() => onOpen(book.id)}
        >
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                {book.coverImage ? (
                    <img
                        src={book.coverImage}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        alt=""
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="p-5">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1">{book.title}</h3>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {book.pageCount} Pages
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(book.lastUpdated).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </button>
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (isConfirming) {
                    onDelete(book.id);
                } else {
                    setIsConfirming(true);
                }
            }}
            onBlur={() => setIsConfirming(false)}
            className={`absolute top-3 right-3 p-2 backdrop-blur rounded-full transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isConfirming
                    ? 'bg-red-500 text-white opacity-100 w-auto px-3'
                    : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
            aria-label={isConfirming ? "Confirm delete" : `Delete ${book.title}`}
        >
            <div className="flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
                {isConfirming && <span className="text-xs font-bold whitespace-nowrap">Confirm?</span>}
            </div>
        </button>
    </div>
)});

BookCard.displayName = 'BookCard';
