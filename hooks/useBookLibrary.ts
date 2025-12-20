import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookState, PageData, AgeGroup, ArtStyle } from '../types';
import localforage from 'localforage';

const LIBRARY_STORE_NAME = 'cc_library_v1';

// Configure localforage
localforage.config({
    name: 'ColorCrate',
    storeName: 'books'
});

export interface BookSummary {
    id: string;
    title: string;
    coverImage: string | null;
    pageCount: number;
    createdAt: number;
    lastUpdated: number;
}

export const useBookLibrary = () => {
    const [books, setBooks] = useState<Record<string, BookState>>({});
    const [currentBookId, setCurrentBookId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load Library on Mount
    useEffect(() => {
        const loadLibrary = async () => {
            try {
                const saved = await localforage.getItem<Record<string, BookState>>(LIBRARY_STORE_NAME);
                if (saved) {
                    setBooks(saved);
                }
            } catch (e) {
                console.error("Failed to load library from localforage", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadLibrary();
    }, []);

    // Save Library on Change (Debounced slightly ideally, but here direct)
    // We cannot use useEffect directly for saving efficiently with large blobs if updates are frequent.
    // Ideally we save only the changed book. But for simplicity in this migration:
    const saveLibrary = async (newBooks: Record<string, BookState>) => {
        try {
            await localforage.setItem(LIBRARY_STORE_NAME, newBooks);
        } catch (e) {
            console.error("Failed to save library", e);
        }
    };

    const createBook = useCallback((theme: string, ageGroup: AgeGroup, style: ArtStyle) => {
        const newBook: BookState = {
            theme,
            ageGroup,
            style,
            pages: [],
            lastUpdated: Date.now()
        };
        // Use timestamp as ID
        const id = Date.now().toString();

        setBooks(prev => {
            const next = { ...prev, [id]: newBook };
            saveLibrary(next);
            return next;
        });
        setCurrentBookId(id);
        return id;
    }, []);

    const updateCurrentBook = useCallback((updater: (prev: BookState) => BookState) => {
        if (!currentBookId) return;

        setBooks(prev => {
            const current = prev[currentBookId];
            if (!current) return prev;

            const updated = updater(current);
            const next = {
                ...prev,
                [currentBookId]: { ...updated, lastUpdated: Date.now() }
            };
            // Fire and forget save
            saveLibrary(next);
            return next;
        });
    }, [currentBookId]);

    const deleteBook = useCallback((id: string) => {
        setBooks(prev => {
            const next = { ...prev };
            delete next[id];
            saveLibrary(next);
            return next;
        });
        if (currentBookId === id) setCurrentBookId(null);
    }, [currentBookId]);

    const closeBook = useCallback(() => setCurrentBookId(null), []);

    const library = useMemo(() => {
        return Object.entries(books).map(([id, book]) => ({
            id,
            title: book.theme,
            coverImage: book.pages.length > 0 ? (book.pages[0].modifiedUrl || book.pages[0].originalUrl) : null,
            pageCount: book.pages.length,
            createdAt: parseInt(id), // ID is timestamp
            lastUpdated: book.lastUpdated
        })).sort((a, b) => b.lastUpdated - a.lastUpdated);
    }, [books]);

    return {
        currentBook: currentBookId ? books[currentBookId] : null,
        currentBookId,
        library,
        isLoading,
        openBook: setCurrentBookId,
        createBook,
        updateCurrentBook,
        deleteBook,
        closeBook
    };
};
