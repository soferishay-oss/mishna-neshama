"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { ref, get, child } from "firebase/database";
import { db, isMockMode } from "@/lib/firebase";

export default function JoinEvent() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId.trim()) return;
    
    setError("");
    setIsLoading(true);

    const cleanId = eventId.trim();

    try {
      if (isMockMode) {
        const res = await fetch(`/api/mockdb?path=events/${cleanId}`);
        const data = await res.json();
        
        if (data) {
          router.push(`/event/${cleanId}`);
        } else {
          setError("לא נמצא אירוע עם הקוד הזה.");
          setIsLoading(false);
        }
        return;
      }

      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `events/${cleanId}`));
      
      if (snapshot.exists()) {
        router.push(`/event/${cleanId}`);
      } else {
        setError("לא נמצא אירוע עם הקוד הזה.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("שגיאה בחיפוש האירוע. נסה שוב.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
        <Link href="/" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition">
          <ChevronRight className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 mr-2">הצטרפות לאירוע</h1>
      </header>

      <main className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col justify-center pb-32">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">יש לך קוד אירוע?</h2>
          <p className="text-slate-600 mb-8">
            הזן את המספר (קוד האירוע) שקיבלת מהמארגן כדי להצטרף ללימוד.
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input 
                type="text" 
                required
                dir="ltr"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-center text-3xl font-black text-blue-900 tracking-widest focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder="1234"
                value={eventId}
                onChange={e => setEventId(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm font-medium">{error}</div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-blue-600 text-white font-medium text-lg py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md disabled:bg-blue-400 mt-4"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "כניסה לאירוע"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
