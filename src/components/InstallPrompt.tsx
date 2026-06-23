"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem('hideInstallPrompt') === 'true';

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    if (!isStandalone && !isDismissed) {
      setShowPrompt(true);
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("כדי להתקין באייפון: לחץ על סמל השיתוף בתחתית המסך, ואז בחר ב-'הוסף למסך הבית' (Add to Home Screen).");
      return;
    }

    if (!deferredPrompt) {
      alert("כדי להתקין במכשיר זה: פתח את תפריט הדפדפן (שלוש נקודות) ובחר 'התקן אפליקציה' או 'הוסף למסך הבית'.");
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.setItem('hideInstallPrompt', 'true');
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('hideInstallPrompt', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 print:hidden max-w-md mx-auto">
      <div className="flex flex-col">
        <h3 className="font-bold text-slate-800 text-sm md:text-base">התקן את משנה-נשמה</h3>
        <p className="text-xs md:text-sm text-slate-500">הוסף למסך הבית לגישה מהירה ונוחה</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleClose}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
        <button 
          onClick={handleInstallClick}
          className="bg-blue-600 text-white text-xs md:text-sm font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition flex items-center gap-1"
        >
          {isIOS ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          התקן
        </button>
      </div>
    </div>
  );
}
