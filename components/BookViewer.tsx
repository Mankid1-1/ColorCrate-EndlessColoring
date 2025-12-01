import React, { useState } from 'react';
import { PageData, AppTier } from '../types';
import { Printer, Download, RefreshCw, Edit3, X, ZoomIn, Lock } from 'lucide-react';
import { CreativeEditor } from './CreativeEditor';
import { Tooltip } from './Tooltip';

interface BookViewerProps {
  pages: PageData[];
  theme: string;
  tier: AppTier;
  onRegeneratePage: (pageId: string) => void;
  onUpdatePage: (pageId: string, newUrl: string) => void;
  onUpgrade: () => void;
}

export const BookViewer: React.FC<BookViewerProps> = ({ 
  pages, theme, tier, onRegeneratePage, onUpdatePage, onUpgrade 
}) => {
  const [focusedPageId, setFocusedPageId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const focusedPage = pages.find(p => p.id === focusedPageId);

  const handlePrint = (page?: PageData) => {
    const list = page ? [page] : pages;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${theme} - Coloring Book</title>
          <style>
            @media print {
               @page { size: auto; margin: 0; }
               body { margin: 0; padding: 0; }
               .page { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; page-break-after: always; }
               img { max-width: 90%; max-height: 90%; object-fit: contain; }
            }
            body { font-family: sans-serif; text-align: center; }
            .no-print { padding: 20px; background: #f0fdfa; color: #0f766e; }
            .page { border: 1px dashed #ccc; margin: 20px auto; width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; }
            img { max-width: 95%; max-height: 95%; }
          </style>
        </head>
        <body>
          <div class="no-print">
            <h1>Ready to Print!</h1>
            <p>Press Ctrl+P / Cmd+P to print or save as PDF.</p>
          </div>
          ${list.map(p => `
            <div class="page">
              <img src="${p.modifiedUrl || p.originalUrl}" />
            </div>
          `).join('')}
          <script>window.onload = () => setTimeout(() => window.print(), 500)</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = (page: PageData) => {
    const link = document.createElement('a');
    link.href = page.modifiedUrl || page.originalUrl;
    link.download = `ColorCrate-${theme.replace(/\s+/g, '-')}-${page.id}.png`;
    link.click();
  };

  const handleRegenerateClick = async (id: string) => {
      setRegeneratingId(id);
      await onRegeneratePage(id);
      setRegeneratingId(null);
  };

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
             onClick={() => handlePrint()}
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
            <div key={page.id} className="group relative aspect-[3/4] bg-white rounded-2xl shadow-sm border-2 border-slate-100 hover:border-brand-300 transition-all overflow-hidden hover:shadow-xl hover:-translate-y-1">
                <img 
                    src={page.modifiedUrl || page.originalUrl} 
                    className="w-full h-full object-contain p-2" 
                    alt={`Page ${idx+1}`} 
                />
                
                {/* Number Badge */}
                <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center font-black text-slate-400 text-xs shadow-sm border border-slate-100">
                    {idx + 1}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <Tooltip content="View & Edit Page">
                      <button 
                          onClick={() => setFocusedPageId(page.id)}
                          className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                      >
                          <ZoomIn className="w-6 h-6" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Print This Page">
                      <button 
                          onClick={() => handlePrint(page)}
                          className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                      >
                          <Printer className="w-6 h-6" />
                      </button>
                    </Tooltip>
                </div>
            </div>
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

                    <Tooltip content="Print just this page">
                      <button 
                          onClick={() => handlePrint(focusedPage)}
                          className="w-full py-3 bg-white/5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                      >
                          <Printer className="w-5 h-5" />
                          Print Page
                      </button>
                    </Tooltip>

                    <Tooltip content="Save PNG to device">
                      <button 
                          onClick={() => handleDownload(focusedPage)}
                          className="w-full py-3 bg-white/5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                      >
                          <Download className="w-5 h-5" />
                          Download Image
                      </button>
                    </Tooltip>
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
};