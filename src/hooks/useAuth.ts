"use client";

import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth, isMockMode } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      setUser({ uid: "mock-user-123" } as User);
      setLoading(false);
      return;
    }
    if (!auth) {
      setUser({ uid: "local-dev-user" } as User);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Automatically sign in anonymously if not logged in
        signInAnonymously(auth).catch((error) => {
          console.warn("Firebase Auth not configured in console (auth/configuration-not-found). Using local dummy user.");
          setUser({ uid: "local-dummy-user" } as User);
          setLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
