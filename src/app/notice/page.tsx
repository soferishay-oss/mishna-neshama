"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import NoticeHub from "@/components/NoticeHub";

export default function NoticePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-10 print:hidden">
        <h1 className="font-bold text-slate-800 text-lg">עיצוב מודעת אבל</h1>
        <Link href="/" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
          <Home className="w-5 h-5" />
        </Link>
      </header>
      
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <NoticeHub eventData={null} />
      </main>
    </div>
  );
}
