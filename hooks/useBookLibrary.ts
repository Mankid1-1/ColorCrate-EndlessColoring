import { useState, useEffect } from 'react';
import { BookState, PageData, AgeGroup, ArtStyle } from '../types';

const LIBRARY_KEY = 'cc_library_v1';

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
        try {
            const saved = localStorage.getItem(LIBRARY_KEY);
            if (saved) {
                setBooks(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load library", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save Library on Change
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
        }
    }, [books, isLoading]);

    const createBook = (theme: string, ageGroup: AgeGroup, style: ArtStyle) => {
        const newBook: BookState = {
            theme,
            ageGroup,
            style,
            pages: [],
            lastUpdated: Date.now()
        };
        // Use timestamp as ID
        const id = Date.now().toString();

        setBooks(prev => ({ ...prev, [id]: newBook }));
        setCurrentBookId(id);
        return id;
    };

    const updateCurrentBook = (updater: (prev: BookState) => BookState) => {
        if (!currentBookId) return;

        setBooks(prev => {
            const current = prev[currentBookId];
            if (!current) return prev;

            const updated = updater(current);
            return {
                ...prev,
                [currentBookId]: { ...updated, lastUpdated: Date.now() }
            };
        });
    };

    const deleteBook = (id: string) => {
        setBooks(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (currentBookId === id) setCurrentBookId(null);
    };

    const getBookSummaries = (): BookSummary[] => {
        return Object.entries(books).map(([id, book]) => ({
            id,
            title: book.theme,
            coverImage: book.pages.length > 0 ? (book.pages[0].modifiedUrl || book.pages[0].originalUrl) : null,
            pageCount: book.pages.length,
            createdAt: parseInt(id), // ID is timestamp
            lastUpdated: book.lastUpdated
        })).sort((a, b) => b.lastUpdated - a.lastUpdated);
    };

    return {
        currentBook: currentBookId ? books[currentBookId] : null,
        currentBookId,
        library: getBookSummaries(),
        isLoading,
        openBook: setCurrentBookId,
        createBook,
        updateCurrentBook,
        deleteBook,
        closeBook: () => setCurrentBookId(null)
    };
};
