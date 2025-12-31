import React, { useEffect, useState } from 'react';
import { AgeGroup, AppTier, ArtStyle, BookSize } from '../types';
import { Sparkles, Zap, Lock, BookOpen, Dice5, X } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface GeneratorFormProps {
  onGenerate: (theme: string, age: AgeGroup, style: ArtStyle, size: BookSize) => void;
  isLoading: boolean;
  tier: AppTier;
  onUpgrade: () => void;
}

const INSPIRATION_PROMPTS = [
  { emoji: '🦖', text: 'T-Rex Skateboarding' },
  { emoji: '🏰', text: 'Underwater Mermaid Castle' },
  { emoji: '🚀', text: 'Cute Hamster Astronaut' },
  { emoji: '🦄', text: 'Unicorns in a Candy Forest' },
  { emoji: '🏎️', text: 'Fast Race Cars in the Desert' },
  { emoji: '🐱', text: 'Cat Wizard mixing Potions' },
];

const AGE_DESCRIPTIONS: Record<AgeGroup, string> = {
  [AgeGroup.TODDLER]: "Thick lines, big shapes, very simple.",
  [AgeGroup.PRESCHOOL]: "Simple scenes, easy to color.",
  [AgeGroup.SCHOOL_AGE]: "More details, fun characters & backgrounds.",
  [AgeGroup.TEEN]: "Intricate patterns, fine lines, complex scenes."
};

const SIZE_DESCRIPTIONS: Record<number, string> = {
  1: "Just one masterpiece.",
  4: "A small collection.",
  12: "A full story chapter.",
  28: "A complete coloring book."
};

const THEME_IDEAS = [
    "A magical dragon tea party",
    "Space cats playing soccer",
    "A treehouse city in the jungle",
    "Underwater robots exploring a reef",
    "A superhero dog saving a kitten",
    "A castle made of ice cream",
    "Pirate penguins on a treasure hunt"
];

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isLoading, tier, onUpgrade }) => {
  const [theme, setTheme] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(AgeGroup.PRESCHOOL);
  const [style, setStyle] = useState<ArtStyle>(ArtStyle.CARTOON);
  const [bookSize, setBookSize] = useState<BookSize>(BookSize.SINGLE);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset bookSize if tier changes to FREE and current size is > 1
  useEffect(() => {
    if (tier === AppTier.FREE && bookSize > 1) {
        setBookSize(BookSize.SINGLE);
    }
  }, [tier, bookSize]);

  const handleSubmit = () => {
    if (!theme) return;
    onGenerate(theme, ageGroup, style, bookSize);
  };

  const handleRandomize = () => {
      const randomTheme = THEME_IDEAS[Math.floor(Math.random() * THEME_IDEAS.length)];
      const ageGroups = Object.values(AgeGroup);
      const styles = Object.values(ArtStyle);

      setTheme(randomTheme);
      setAgeGroup(ageGroups[Math.floor(Math.random() * ageGroups.length)]);
      setStyle(styles[Math.floor(Math.random() * styles.length)]);

 palette-generator-form-focus-improvement-1273565699741201130
      // Focus the input to encourage user customization
      inputRef.current?.focus();

      // We don't randomize bookSize to avoid locking users out unexpectedly or defaulting to single always

      // Focus input so user can immediately edit the randomized prompt
      // We use a small timeout to ensure the value has visually updated (though not strictly necessary for focus)
      setTimeout(() => inputRef.current?.focus(), 0);
 ColorCratemain
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-brand-900/5 border border-slate-100 overflow-hidden">
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Theme Section */}
        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            <div className="flex items-center space-x-2">
                <span className="bg-fun-yellow text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                <span>What do you want to create?</span>
            </div>
            <Tooltip content="Surprise Me!">
                <button
                    onClick={handleRandomize}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full hover:bg-brand-100 transition-colors"
                >
                    <Dice5 className="w-4 h-4" />
                    <span>Randomize</span>
                </button>
            </Tooltip>
          </label>
          
          <Tooltip content="Describe your coloring page idea here!" position="top" className="w-full">
            <div className="relative group w-full">
              <input 
                ref={inputRef}
                type="text" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. A robot baking a giant cake..."
                aria-label="Theme description"
                className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 outline-none transition-all text-xl font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors">
                {theme ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('');
                      // Return focus to input for better UX
                      inputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label="Clear theme"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-slate-300 pointer-events-none group-focus-within:text-brand-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </Tooltip>

          {/* Inspiration Rail */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x" role="list" aria-label="Inspiration prompts">
            {INSPIRATION_PROMPTS.map((prompt) => (
              <Tooltip key={prompt.text} content="Click to use this idea">
                <button
                  onClick={() => {
                    setTheme(prompt.text);
 palette-generator-form-focus-improvement-1273565699741201130

                    // Focus input to allow immediate editing
 ColorCratemain
                    inputRef.current?.focus();
                  }}
                  className="snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all text-sm font-bold text-slate-600 shadow-sm active:scale-95 group"
                  aria-label={`Use prompt: ${prompt.text}`}
                >
                  <span className="group-hover:scale-125 transition-transform">{prompt.emoji}</span>
                  <span>{prompt.text}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Settings Column */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                <span className="bg-fun-pink text-pink-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                <span>For who?</span>
              </label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Target audience">
                {Object.values(AgeGroup).map((age) => (
                  <Tooltip key={age} content={AGE_DESCRIPTIONS[age]} className="w-full h-full">
                    <button
                      onClick={() => setAgeGroup(age)}
                      aria-checked={ageGroup === age}
                      role="radio"
                      className={`w-full h-full px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        ageGroup === age 
                          ? 'border-brand-500 bg-brand-50 text-brand-700' 
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {age.split(' (')[0]}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                   <span className="bg-fun-purple text-purple-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                   <span>Book Size</span>
                </div>
                {tier === AppTier.FREE && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">Pro unlocks larger books</span>
                )}
              </label>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Book size">
                {[1, 4, 12, 28].map((size) => {
                   const isLocked = tier === AppTier.FREE && size > 1;
                   return (
                    <Tooltip key={size} content={isLocked ? "Upgrade to unlock" : SIZE_DESCRIPTIONS[size]} className="w-full">
                      <button 
                          onClick={() => isLocked ? onUpgrade() : setBookSize(size as BookSize)}
                          aria-checked={bookSize === size}
                          role="radio"
                          aria-label={isLocked ? `Unlock ${size} pages with Pro` : `${size} page${size > 1 ? 's' : ''}`}
                          className={`w-full relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                              bookSize === size && !isLocked
                              ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm ring-2 ring-brand-100 ring-offset-1' 
                              : 'border-slate-100 bg-white text-slate-400'
                          } ${!isLocked && 'hover:border-brand-200'} ${isLocked && 'opacity-60 cursor-pointer bg-slate-50 hover:bg-slate-100'}`}
                      >
                          <span className="font-black text-xl">{size}</span>
                          <span className="text-[10px] font-bold uppercase">Pages</span>
                          {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
                                  <Lock className="w-4 h-4 text-slate-400" />
                              </div>
                          )}
                      </button>
                    </Tooltip>
                   );
                })}
              </div>
            </div>
          </div>

          {/* Style Column */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                <span className="bg-fun-blue text-blue-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                <span>Art Style</span>
            </label>
            <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto pr-1 custom-scrollbar" role="radiogroup" aria-label="Art style">
                {Object.values(ArtStyle).map((s) => (
                    <Tooltip key={s} content={`Generate in ${s} style`} position="top" className="w-full">
                      <button 
                          onClick={() => setStyle(s)}
                          aria-checked={style === s}
                          role="radio"
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all group ${
                              style === s 
                              ? 'border-brand-500 bg-brand-50' 
                              : 'border-slate-100 bg-white hover:border-brand-200'
                          }`}
                      >
                          <div className={`w-full h-16 rounded-lg mb-2 bg-slate-100 overflow-hidden relative ${style === s ? 'ring-2 ring-brand-200' : ''}`}>
                              {/* Abstract representation of style using SVG patterns */}
                              <div className="absolute inset-0 opacity-50" style={{
                                  backgroundImage: 'radial-gradient(circle at center, #cbd5e1 1px, transparent 1px)',
                                  backgroundSize: s === ArtStyle.PIXEL ? '4px 4px' : '16px 16px'
                              }}></div>
                              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                  {getStyleEmoji(s)}
                              </div>
                          </div>
                          <span className={`text-xs font-bold ${style === s ? 'text-brand-700' : 'text-slate-600'}`}>
                              {s}
                          </span>
                      </button>
                    </Tooltip>
                ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Tooltip content={!theme ? "Please enter a theme first" : "Generate your book!"} className="w-full">
          <button
            onClick={handleSubmit}
            disabled={!theme || isLoading}
            className={`w-full py-6 rounded-2xl text-white font-black text-xl shadow-xl shadow-brand-500/20 transition-all transform active:scale-[0.98] hover:-translate-y-1 relative overflow-hidden ${
              !theme || isLoading 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-brand-500 to-fun-blue hover:from-brand-400 hover:to-blue-400'
            }`}
          >
              <div className="flex items-center justify-center gap-3 relative z-10">
                  {isLoading ? (
                      <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Creating Magic...</span>
                      </>
                  ) : (
                      <>
                          <Zap className="w-6 h-6 fill-current" />
                          <span>Generate {bookSize > 1 ? `${bookSize}-Page Book` : 'Masterpiece'}</span>
                      </>
                  )}
              </div>
          </button>
        </Tooltip>

      </div>
    </div>
  );
};

// Helper for style visuals
const getStyleEmoji = (style: ArtStyle) => {
    switch(style) {
        case ArtStyle.CARTOON: return '🐻';
        case ArtStyle.REALISTIC: return '📸';
        case ArtStyle.MANDALA: return '🌀';
        case ArtStyle.FANTASY: return '🐉';
        case ArtStyle.PIXEL: return '👾';
        case ArtStyle.MINIMALIST: return '✨';
        case ArtStyle.ABSTRACT: return '🎨';
        case ArtStyle.STAINED_GLASS: return '⛪';
        case ArtStyle.KAWAII: return '🎀';
        case ArtStyle.COMIC: return '💥';
        default: return '✏️';
    }
}
