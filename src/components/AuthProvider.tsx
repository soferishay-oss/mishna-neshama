"use client";

import { useEffect, useState } from "react";
import { auth, isMockMode } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(isMockMode);

  useEffect(() => {
    if (isMockMode || !auth) {
      setIsReady(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsReady(true);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed:", error);
          setIsReady(true); // Proceed anyway to avoid endless loop, though requests will fail
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="mt-4 text-slate-500 font-medium text-sm animate-pulse">מתחבר לשרת...</div>
      </div>
    );
  }

  return <>{children}</>;
}
