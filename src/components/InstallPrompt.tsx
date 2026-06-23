"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our custom prompt
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 print:hidden">
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
          <Download className="w-4 h-4" />
          התקן
        </button>
      </div>
    </div>
  );
}
