"use client";

import { useEffect } from "react";
import { auth, isMockMode } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (isMockMode || !auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed:", error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
