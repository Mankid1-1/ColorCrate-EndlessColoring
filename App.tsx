
import React, { useState, useEffect } from 'react';
import { AgeGroup, AppTier, ArtStyle, BookSize, PageData, BookState } from './types';
import { generateColoringPage } from './services/geminiService';
import { purchaseSubscription, restorePurchases, setPurchaseFlag } from './services/storeService';
import { LoadingOverlay } from './components/LoadingOverlay';
import { UpgradeModal } from './components/UpgradeModal';
import { GeneratorForm } from './components/GeneratorForm';
import { BookViewer } from './components/BookViewer';
import { Tooltip } from './components/Tooltip';

const App: React.FC = () => {
  // Global State
  const [tier, setTier] = useState<AppTier>(AppTier.FREE);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number} | undefined>(undefined);
  
  // Book Data
  const [bookState, setBookState] = useState<BookState>({
      theme: '',
      ageGroup: AgeGroup.PRESCHOOL,
      style: ArtStyle.CARTOON,
      pages: [],
      lastUpdated: 0
  });

  // UI
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load persistence
  useEffect(() => {
      // Load Book
      const savedBook = localStorage.getItem('cc_book_state');
      if (savedBook) {
          try {
              setBookState(JSON.parse(savedBook));
          } catch (e) { console.error("Failed to load book"); }
      }

      // Load Subscription Status (Simulated check on startup)
      const hasPurchased = localStorage.getItem('cc_has_purchased') === 'true';
      if (hasPurchased) setTier(AppTier.PRO);
  }, []);

  // Save Book on change
  useEffect(() => {
      if (bookState.pages.length > 0) {
          localStorage.setItem('cc_book_state', JSON.stringify(bookState));
      }
  }, [bookState]);

  // --- Actions ---

  const handleReset = () => {
    localStorage.removeItem('cc_book_state');
    setBookState({
        theme: '',
        ageGroup: AgeGroup.PRESCHOOL,
        style: ArtStyle.CARTOON,
        pages: [],
        lastUpdated: 0
    });
  };

  // --- Store Handlers ---
  const handleUpgrade = async () => {
      await purchaseSubscription();
      setPurchaseFlag();
      setTier(AppTier.PRO);
  };

  const handleRestore = async () => {
      const restoredTier = await restorePurchases();
      if (restoredTier === AppTier.PRO) {
          setTier(AppTier.PRO);
          alert("Purchases restored successfully!");
      } else {
          alert("No previous purchases found.");
      }
  };
  // ----------------------

  const handleGenerate = async (theme: string, ageGroup: AgeGroup, style: ArtStyle, bookSize: BookSize) => {
    // Tier Checks
    if (tier === AppTier.FREE && bookSize > 1) {
        setShowUpgradeModal(true);
        return;
    }

    setLoading(true);
    setLoadingProgress(bookSize > 1 ? { current: 0, total: bookSize } : undefined);
    
    // Reset book if new generation
    setBookState({ theme, ageGroup, style, pages: [], lastUpdated: Date.now() });

    try {
      const newPages: PageData[] = [];
      for (let i = 0; i < bookSize; i++) {
        if (bookSize > 1) setLoadingProgress({ current: i + 1, total: bookSize });
        
        const imageUrl = await generateColoringPage({
          theme,
          ageGroup,
          style,
          tier,
          variationIndex: i
        });

        const page: PageData = {
            id: Date.now().toString() + i,
            originalUrl: imageUrl,
            modifiedUrl: null,
            promptUsed: theme,
            createdAt: Date.now()
        };
        newPages.push(page);
        
        // Streaming update for better UX on large books
        setBookState(prev => ({ ...prev, pages: [...prev.pages, page] }));
      }
    } catch (err) {
      console.error(err);
      // alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingProgress(undefined);
    }
  };

  const handleRegenerateSinglePage = async (pageId: string) => {
      const pageIndex = bookState.pages.findIndex(p => p.id === pageId);
      if (pageIndex === -1) return;

      try {
          const newUrl = await generateColoringPage({
              theme: bookState.theme,
              ageGroup: bookState.ageGroup,
              style: bookState.style,
              tier,
              variationIndex: Math.floor(Math.random() * 1000)
          });

          setBookState(prev => {
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
  };

  const handleUpdatePage = (pageId: string, newUrl: string) => {
      setBookState(prev => ({
          ...prev,
          pages: prev.pages.map(p => p.id === pageId ? { ...p, modifiedUrl: newUrl } : p)
      }));
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-brand-100 selection:text-brand-900 pb-20 md:pb-0">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 safe-top">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Tooltip content="Reset & Start Over" position="bottom">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
                    <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 transform hover:rotate-12 transition-transform cursor-pointer">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-800 hidden md:block">Color<span className="text-brand-600">Crate</span></span>
                </div>
            </Tooltip>
            
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
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-16">
        
        {/* Intro Hero */}
        {bookState.pages.length === 0 && (
            <div className="text-center space-y-6 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-700 mt-8 md:mt-0">
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
        )}

        {/* Generator Form */}
        <div id="generator" className="max-w-4xl mx-auto">
            <GeneratorForm 
                onGenerate={handleGenerate} 
                isLoading={loading}
                tier={tier}
                onUpgrade={() => setShowUpgradeModal(true)}
            />
        </div>

        {/* Results */}
        {bookState.pages.length > 0 && (
            <div className="border-t border-slate-200 pt-16">
                <BookViewer 
                    pages={bookState.pages}
                    theme={bookState.theme}
                    tier={tier}
                    onRegeneratePage={handleRegenerateSinglePage}
                    onUpdatePage={handleUpdatePage}
                    onUpgrade={() => setShowUpgradeModal(true)}
                />
            </div>
        )}

      </main>

      {/* Overlays */}
      {loading && <LoadingOverlay current={loadingProgress?.current} total={loadingProgress?.total} />}
      
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        onRestore={handleRestore}
      />
    </div>
  );
};

export default App;
