import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgeGroup, AppTier, ArtStyle, BookSize, PageData } from './types';
import { generateColoringPage } from './services/geminiService';
import { useStore } from './services/storeService';
import { useBookLibrary, BookSummary } from './hooks/useBookLibrary';
import { LoadingOverlay } from './components/LoadingOverlay';
import { UpgradeModal } from './components/UpgradeModal';
import { GeneratorForm } from './components/GeneratorForm';
import { BookViewer } from './components/BookViewer';
import { BookCard } from './components/BookCard';
import { Tooltip } from './components/Tooltip';
import { LayoutGrid, Plus, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const { tier, purchase, restore, products } = useStore();
  const { currentBook, library, isLoading: isLibraryLoading, createBook, updateCurrentBook, openBook, closeBook, deleteBook } = useBookLibrary();

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number} | undefined>(undefined);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [view, setView] = useState<'library' | 'create' | 'book'>('library');

  // Abort Controller for Cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle View Routing
  useEffect(() => {
    if (currentBook) {
        setView('book');
    } else if (library.length === 0 && !isLibraryLoading) {
        setView('create');
    } else {
        setView('library');
    }
  }, [currentBook, isLibraryLoading, library.length]);

  // --- Actions ---

  const handleCreateNew = () => {
      closeBook();
      setView('create');
  }

  const handleBackToLibrary = () => {
      closeBook();
      setView('library');
  }

  const handleCancelGeneration = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      setLoading(false);
      setLoadingProgress(undefined);
  };

  const handleGenerate = async (theme: string, ageGroup: AgeGroup, style: ArtStyle, bookSize: BookSize) => {
    // Tier Checks
    if (tier === AppTier.FREE && bookSize > 1) {
        setShowUpgradeModal(true);
        return;
    }

    setLoading(true);
    setLoadingProgress(bookSize > 1 ? { current: 0, total: bookSize } : undefined);
    
    // Init Abort Controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Create new book entry
    const bookId = createBook(theme, ageGroup, style);

    try {
      for (let i = 0; i < bookSize; i++) {
        // Check for cancellation before starting next iteration
        if (signal.aborted) {
            throw new Error("Generation Cancelled");
        }

        if (bookSize > 1) setLoadingProgress({ current: i + 1, total: bookSize });
        
        const imageUrl = await generateColoringPage({
          theme,
          ageGroup,
          style,
          tier,
          variationIndex: i
        });

        // Double check cancellation after await
        if (signal.aborted) {
            throw new Error("Generation Cancelled");
        }

        const page: PageData = {
            id: Date.now().toString() + i,
            originalUrl: imageUrl,
            modifiedUrl: null,
            promptUsed: theme,
            createdAt: Date.now()
        };
        
        // Streaming update into the current book
        updateCurrentBook(prev => ({
            ...prev,
            pages: [...prev.pages, page]
        }));
      }
    } catch (err: any) {
      if (err.message === "Generation Cancelled") {
          console.log("User cancelled generation.");
      } else {
          console.error(err);
          // alert("Something went wrong. Please try again.");
      }
    } finally {
      // Only reset loading if we haven't already (in case of double firing)
      // and ensure controller is cleaned up
      abortControllerRef.current = null;
      setLoading(false);
      setLoadingProgress(undefined);
    }
  };

  const handleRegenerateSinglePage = useCallback(async (pageId: string) => {
      if (!currentBook) return;
      const pageIndex = currentBook.pages.findIndex(p => p.id === pageId);
      if (pageIndex === -1) return;

      try {
          const newUrl = await generateColoringPage({
              theme: currentBook.theme,
              ageGroup: currentBook.ageGroup,
              style: currentBook.style,
              tier,
              variationIndex: Math.floor(Math.random() * 1000)
          });

          updateCurrentBook(prev => {
              const newPages = [...prev.pages];
              newPages[pageIndex] = {
                  ...newPages[pageIndex],
                  originalUrl: newUrl,
                  modifiedUrl: null
              };
              return { ...prev, pages: newPages };
          });
      } catch (e) {
          console.error("Failed to regenerate page", e);
      }
  }, [currentBook, tier, updateCurrentBook]);

  const handleUpdatePage = useCallback((pageId: string, newUrl: string) => {
      updateCurrentBook(prev => ({
          ...prev,
          pages: prev.pages.map(p => p.id === pageId ? { ...p, modifiedUrl: newUrl } : p)
      }));
  }, [updateCurrentBook]);

  const handleUpgrade = useCallback(async () => {
      await purchase(products.MONTHLY);
  }, [purchase, products]);

  const handleOpenUpgradeModal = useCallback(() => setShowUpgradeModal(true), []);

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-brand-100 selection:text-brand-900 pb-20 md:pb-0">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 safe-top">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Tooltip content="Back to Library" position="bottom">
                <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={handleBackToLibrary}
                    aria-label="Back to Library"
                >
                    <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 transform hover:rotate-12 transition-transform cursor-pointer">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-800 hidden md:block">Color<span className="text-brand-600">Crate</span></span>
                </button>
            </Tooltip>
            
            <div className="flex items-center gap-4">
                {view === 'book' && (
                     <button
                         onClick={handleBackToLibrary}
                         className="md:hidden p-2 text-slate-500 hover:text-slate-800"
                         aria-label="Back to Library"
                     >
                         <LayoutGrid className="w-6 h-6" />
                     </button>
                )}

                <button
                    onClick={() => tier === AppTier.FREE && setShowUpgradeModal(true)}
                    className={`px-5 py-2 rounded-full font-bold text-sm transition-all transform hover:scale-105 active:scale-95 ${
                        tier === AppTier.PRO
                        ? 'bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 cursor-default ring-2 ring-yellow-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                    }`}
                >
                    {tier === AppTier.PRO ? '👑 PRO MEMBER' : '🚀 Upgrade to Pro'}
                </button>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* Loading State */}
        {isLibraryLoading ? (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
            </div>
        ) : (
            <>
                {/* View: My Library */}
                {view === 'library' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-black text-slate-900">My Library</h1>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden md:inline">New Book</span>
                            </button>
                        </div>

                        {library.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No books yet!</h3>
                                <p className="text-slate-500 mb-6">Start your collection by creating your first masterpiece.</p>
                                <button onClick={handleCreateNew} className="text-brand-600 font-bold hover:underline">Create a Book</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {library.map((book, index) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        priority={index < 4}
                                        onOpen={openBook}
                                        onDelete={deleteBook}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* View: Create New */}
                {view === 'create' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {/* Intro Hero (Only show if library empty for cleaner UX, or always show? Lets keep it for context) */}
                        <div className="text-center space-y-6 max-w-3xl mx-auto mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-bold border border-brand-100 mb-4 animate-bounce-slight">
                                <span>✨ #1 AI Coloring Book Maker</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-fun-blue">Magic</span><br />
                                Coloring Pages.
                            </h1>
                            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                                Turn any idea into a printable coloring book in seconds. Perfect for parents, teachers, and creative kids.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <GeneratorForm
                                onGenerate={handleGenerate}
                                isLoading={loading}
                                tier={tier}
                                onUpgrade={handleOpenUpgradeModal}
                            />
                        </div>
                    </div>
                )}

                {/* View: Book Viewer */}
                {view === 'book' && currentBook && (
                    <BookViewer
                        pages={currentBook.pages}
                        theme={currentBook.theme}
                        tier={tier}
                        onRegeneratePage={handleRegenerateSinglePage}
                        onUpdatePage={handleUpdatePage}
                        onUpgrade={handleOpenUpgradeModal}
                    />
                )}
            </>
        )}
      </main>

      {/* Overlays */}
      {loading && (
          <LoadingOverlay
            current={loadingProgress?.current}
            total={loadingProgress?.total}
            onCancel={handleCancelGeneration}
          />
      )}
      
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        onRestore={restore}
      />
    </div>
  );
};

export default App;
