import React, { useState, useCallback } from 'react';
import { PageData, AppTier } from '../types';
import { Printer, Download, RefreshCw, Edit3, X, Share2, Lock } from 'lucide-react';
import { CreativeEditor } from './CreativeEditor';
import { Tooltip } from './Tooltip';
import { BookPageThumbnail } from './BookPageThumbnail';

interface BookViewerProps {
  pages: PageData[];
  theme: string;
  tier: AppTier;
  onRegeneratePage: (pageId: string) => void;
  onUpdatePage: (pageId: string, newUrl: string) => void;
  onUpgrade: () => void;
}

export const BookViewer: React.FC<BookViewerProps> = React.memo(({
  pages, theme, tier, onRegeneratePage, onUpdatePage, onUpgrade 
}) => {
  const [focusedPageId, setFocusedPageId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const focusedPage = pages.find(p => p.id === focusedPageId);

  // Shared print logic that doesn't depend on 'pages' from closure unless passed
  const performPrint = useCallback((pagesToPrint: PageData[]) => {
    // Create a hidden iframe for printing to avoid opening new windows/tabs
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Sanitize theme for title to prevent basic injection
    const safeTitle = theme.replace(/[<>]/g, '');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>${safeTitle} - Coloring Book</title>
          <style>
            @media print {
               @page { size: auto; margin: 0; }
               body { margin: 0; padding: 0; }
               .page { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; page-break-after: always; }
               img { max-width: 90%; max-height: 90%; object-fit: contain; }
            }
            body { font-family: sans-serif; text-align: center; }
            .page { border: 1px dashed #ccc; margin: 20px auto; width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; }
            img { max-width: 95%; max-height: 95%; }
          </style>
        </head>
        <body>
        </body>
      </html>
    `);

    // Inject images safely using DOM methods instead of string interpolation
    const body = doc.body;
    pagesToPrint.forEach(p => {
        const div = doc.createElement('div');
        div.className = 'page';
        const img = doc.createElement('img');
        img.src = p.modifiedUrl || p.originalUrl;
        img.onload = () => {
             // Optional: notify parent
        };
        div.appendChild(img);
        body.appendChild(div);
    });

    doc.close();

    // Give a small delay for images to render in the iframe before printing
    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remove iframe after print dialog closes (or sufficiently long timeout)
        setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  }, [theme]);

  // Handle printing the full book - depends on 'pages'
  const handlePrintBook = useCallback(() => {
    performPrint(pages);
  }, [pages, performPrint]);

  // Handle printing a single page - depends only on stable 'performPrint' (and theme inside it)
  // This ensures that BookPageThumbnail doesn't re-render when other pages are added/modified
  const handlePrintPage = useCallback((page: PageData) => {
    performPrint([page]);
  }, [performPrint]);

  const handleDownload = useCallback((page: PageData) => {
    const link = document.createElement('a');
    link.href = page.modifiedUrl || page.originalUrl;
    link.download = `ColorCrate-${theme.replace(/\s+/g, '-')}-${page.id}.png`;
    link.click();
  }, [theme]);

  const handleShare = useCallback(async (page: PageData) => {
      if (navigator.share) {
          try {
              // Convert base64 to blob for sharing
              const fetchRes = await fetch(page.modifiedUrl || page.originalUrl);
              const blob = await fetchRes.blob();
              const file = new File([blob], "coloring-page.png", { type: "image/png" });

              await navigator.share({
                  title: 'My Coloring Page',
                  text: `Check out this ${theme} coloring page I made with ColorCrate!`,
                  files: [file]
              });
          } catch (e) {
              console.error("Error sharing", e);
          }
      } else {
          // Fallback to clipboard copy
          try {
             await navigator.clipboard.writeText(window.location.href);
             alert("Link copied to clipboard! (Image sharing not supported on this device)");
          } catch (e) {
             alert("Sharing not supported on this device.");
          }
      }
  }, [theme]);

  const handleRegenerateClick = useCallback(async (id: string) => {
      setRegeneratingId(id);
      await onRegeneratePage(id);
      setRegeneratingId(null);
  }, [onRegeneratePage]);

  const handleImageError = useCallback((id: string) => {
      setFailedImages(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleFocusPage = useCallback((id: string) => {
    setFocusedPageId(id);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-xl font-extrabold text-slate-800 capitalize">{theme}</h2>
           <p className="text-sm text-slate-400 font-medium">{pages.length} Pages Generated</p>
        </div>
        <Tooltip content="Print all pages as a PDF book">
          <button 
             onClick={handlePrintBook}
             className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-300"
          >
             <Printer className="w-5 h-5" />
             <span>Print Full Book</span>
          </button>
        </Tooltip>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pages.map((page, idx) => (
            <BookPageThumbnail
                key={page.id}
                page={page}
                index={idx}
                isFailed={!!failedImages[page.id]}
                onImageError={handleImageError}
                onFocus={handleFocusPage}
                onPrint={handlePrintPage}
            />
        ))}
      </div>

      {/* Focus Modal */}
      {focusedPage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div className="relative w-full max-w-6xl h-full flex flex-col md:flex-row gap-6 items-center justify-center">
                
                {/* Close Button */}
                <Tooltip content="Close" position="bottom" className="absolute top-0 right-0 md:-top-4 md:-right-4 z-50">
                  <button 
                      onClick={() => setFocusedPageId(null)}
                      className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                      <X className="w-6 h-6" />
                  </button>
                </Tooltip>

                {/* Main Image */}
                <div className="flex-1 w-full h-full flex items-center justify-center relative">
                    <img 
                        src={focusedPage.modifiedUrl || focusedPage.originalUrl} 
                        className={`max-w-full max-h-full object-contain bg-white rounded-lg shadow-2xl ${regeneratingId === focusedPage.id ? 'opacity-50 blur-sm' : ''}`}
                        fetchPriority="high"
                        loading="eager"
                        decoding="sync"
                    />
                    {regeneratingId === focusedPage.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="w-full md:w-80 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col gap-4 text-white">
                    <h3 className="font-bold text-xl mb-2">Page Options</h3>
                    
                    <Tooltip content={tier === AppTier.FREE ? "Upgrade to customize this page" : "Add stickers, text & drawings"}>
                      <button 
                          onClick={() => {
                              if (tier === AppTier.FREE) {
                                  onUpgrade();
                              } else {
                                  setIsEditorOpen(true);
                              }
                          }}
                          className="w-full py-4 bg-brand-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-500 transition-colors shadow-lg shadow-brand-900/50"
                      >
                          <Edit3 className="w-5 h-5" />
                          Creative Editor
                          {tier === AppTier.FREE && <Lock className="w-4 h-4 ml-2 opacity-50" />}
                      </button>
                    </Tooltip>

                    <Tooltip content="Don't like this result? Try again.">
                      <button 
                          onClick={() => handleRegenerateClick(focusedPage.id)}
                          disabled={!!regeneratingId}
                          className="w-full py-4 bg-white/10 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                      >
                          <RefreshCw className={`w-5 h-5 ${regeneratingId ? 'animate-spin' : ''}`} />
                          Regenerate Page
                      </button>
                    </Tooltip>

                    <div className="h-px bg-white/10 my-2"></div>

                    <div className="grid grid-cols-3 gap-2">
                        <Tooltip content="Print">
                        <button
                            onClick={() => handlePrintPage(focusedPage)}
                            className="w-full py-3 bg-white/5 rounded-xl font-medium flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            <span className="text-[10px]">Print</span>
                        </button>
                        </Tooltip>

                        <Tooltip content="Download">
                        <button
                            onClick={() => handleDownload(focusedPage)}
                            className="w-full py-3 bg-white/5 rounded-xl font-medium flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            <span className="text-[10px]">Save</span>
                        </button>
                        </Tooltip>

                        <Tooltip content="Share">
                        <button
                            onClick={() => handleShare(focusedPage)}
                            className="w-full py-3 bg-white/5 rounded-xl font-medium flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="text-[10px]">Share</span>
                        </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Editor Overlay */}
      {isEditorOpen && focusedPage && (
          <CreativeEditor 
            pageId={focusedPage.id}
            baseImage={focusedPage.modifiedUrl || focusedPage.originalUrl}
            onClose={() => setIsEditorOpen(false)}
            onSave={(newUrl) => {
                onUpdatePage(focusedPage.id, newUrl);
                setIsEditorOpen(false);
            }}
          />
      )}
    </div>
  );
});

BookViewer.displayName = 'BookViewer';
