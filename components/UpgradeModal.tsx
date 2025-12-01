
import React, { useState } from 'react';
import { PurchaseStatus, Product } from '../types';
import { SUBSCRIPTION_PRODUCT } from '../services/storeService';
import { Check, ShieldCheck, Star, Zap, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
  onRestore: () => Promise<void>;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, onRestore }) => {
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setStatus('loading');
    setErrorMsg(null);
    try {
      await onUpgrade();
      setStatus('success');
      setTimeout(onClose, 2000); // Auto close after success
    } catch (e) {
      setStatus('error');
      setErrorMsg("Transaction cancelled or failed.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleRestore = async () => {
    setStatus('loading');
    try {
      await onRestore();
      setStatus('idle'); // Just reset state, parent handles the UI feedback via toast/alert usually
      onClose();
    } catch (e) {
      setStatus('error');
      setErrorMsg("No active subscriptions found.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="bg-white w-full md:max-w-md md:rounded-[2rem] rounded-t-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Header Image/Gradient */}
        <div className="relative h-48 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90"></div>
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10 text-center transform translate-y-2">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto shadow-xl flex items-center justify-center mb-3 rotate-6">
               <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">ColorCrate <span className="text-yellow-300">PRO</span></h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          
          {/* Features */}
          <div className="space-y-4 mb-8">
            <FeatureRow 
              icon={<Zap className="w-5 h-5 text-indigo-600" />}
              title="Unlimited Books"
              desc="Generate 28-page books in seconds"
            />
             <FeatureRow 
              icon={<Star className="w-5 h-5 text-pink-600" />}
              title="Creative Studio"
              desc="Add stickers, text & custom drawings"
            />
            <FeatureRow 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
              title="HD Vector Quality"
              desc="Crystal clear lines for printing"
            />
          </div>

          {/* Pricing Card */}
          <div className="border-2 border-indigo-100 rounded-2xl p-4 bg-indigo-50/50 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                BEST VALUE
            </div>
            <p className="text-sm font-semibold text-indigo-900 mb-1">Monthly Subscription</p>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-indigo-700">{SUBSCRIPTION_PRODUCT.price}</span>
                <span className="text-indigo-400 font-medium">/ month</span>
            </div>
            <p className="text-xs text-indigo-400 mt-2">7-day free trial, then {SUBSCRIPTION_PRODUCT.price}/mo</p>
          </div>

          {/* Action Button */}
          <button 
            onClick={handlePurchase}
            disabled={status === 'loading' || status === 'success'}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                status === 'success' ? 'bg-green-500 text-white' :
                status === 'error' ? 'bg-red-500 text-white' :
                'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <Check className="w-5 h-5" />}
            
            {status === 'idle' && "Start Free Trial"}
            {status === 'loading' && "Processing..."}
            {status === 'success' && "You're a Pro!"}
            {status === 'error' && "Try Again"}
          </button>
          
          {errorMsg && (
              <p className="text-center text-red-500 text-xs font-bold mt-2 animate-in fade-in">{errorMsg}</p>
          )}

          {/* Restore Link */}
          <button 
            onClick={handleRestore}
            className="w-full mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
             Restore Purchases
          </button>

          {/* Legal Footer (Required for App Store) */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-relaxed">
             <p className="mb-2">
                Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. 
                Your account will be charged for renewal within 24-hours prior to the end of the current period.
             </p>
             <div className="flex justify-center gap-4">
                <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
                <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-800 text-sm leading-tight">{title}</h4>
      <p className="text-xs text-slate-500 font-medium">{desc}</p>
    </div>
  </div>
);
