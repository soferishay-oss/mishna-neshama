"use client";

import { useState, useEffect } from "react";
import AdditionsHub from "@/components/AdditionsHub";
import { db, isMockMode } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import Link from "next/link";
import { Home } from "lucide-react";

export default function ToolsPage() {
  const [systemTexts, setSystemTexts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (isMockMode) {
          const res = await fetch("/api/mockdb");
          const data = await res.json();
          setSystemTexts(data.system_texts);
        } else {
          const snap = await get(ref(db, "system_texts"));
          if (snap.exists()) {
            setSystemTexts(snap.val());
          }
        }
      } catch (e) {
        console.error("Error fetching system texts", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-10 print:hidden">
        <h1 className="font-bold text-slate-800 text-lg">עזרים לאבלים ולמנחמים</h1>
        <Link href="/" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
          <Home className="w-5 h-5" />
        </Link>
      </header>
      
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <AdditionsHub eventData={null} systemTexts={systemTexts} />
      </main>
    </div>
  );
}
