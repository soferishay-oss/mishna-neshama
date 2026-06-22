"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, onValue, update, remove } from "firebase/database";
import { db, isMockMode } from "@/lib/firebase";
import { EventData } from "@/lib/events";
import { ChevronRight, Printer, Unlock, CheckCircle, BookOpen } from "lucide-react";
import Link from "next/link";

interface StudyClientProps {
  eventId: string;
  tractateName: string;
  data: any;
}

export default function StudyClient({ eventId, tractateName, data }: StudyClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [showBartenura, setShowBartenura] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // For printing (we just use standard window.print, and use CSS media print to format)
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const eventRef = ref(db, `events/${eventId}`);
    let dataLoaded = false;
    const unsubscribe = onValue(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        dataLoaded = true;
        setEvent(snapshot.val());
      }
    });

    const fallbackTimer = setTimeout(() => {
      if (!dataLoaded) {
        setEvent({
          deceasedName: "ישראל ישראלי (הדגמה)",
          shloshimDateStr: new Date().toISOString(),
          organizerName: "אברהם"
        } as EventData);
      }
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [eventId]);

  const handleRelease = async () => {
    if (!confirm(`האם אתה בטוח שברצונך לשחרר את מסכת ${tractateName}? היא תחזור למאגר הכללי.`)) return;
    
    if (!isMockMode) {
      await remove(ref(db, `events/${eventId}/tractates/${tractateName}`));
    }
    router.push(`/event/${eventId}`);
  };

  const handleFinishChapter = () => {
    if (currentChapter < data.chapters.length - 1) {
      setCurrentChapter(c => c + 1);
      window.scrollTo(0, 0);
    } else {
      // Finished whole tractate
      setShowCelebration(true);
      setTimeout(() => {
        router.push(`/event/${eventId}`);
      }, 5000);
    }
  };

  if (!event) return <div className="min-h-screen bg-slate-50" />;

  const chapterData = data.chapters[currentChapter];
  
  return (
    <div className="min-h-screen bg-blue-50/30 flex flex-col font-serif pb-24 print:bg-white print:pb-0">
      
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-900/40 p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm transform scale-110 transition-all">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-blue-600 mb-2">יישר כוח!</h2>
            <p className="text-slate-600 text-lg">זכית לסיים מסכת {tractateName} לעילוי נשמת {event.deceasedName}.</p>
          </div>
        </div>
      )}

      {/* Header - Hidden when printing */}
      <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10 print:hidden">
        <div className="flex items-center">
          <Link href={`/event/${eventId}`} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition">
            <ChevronRight className="w-6 h-6" />
          </Link>
          <div className="mr-2">
            <h1 className="text-xl font-bold text-slate-800">מסכת {tractateName}</h1>
            <p className="text-xs text-slate-500 font-sans">לעילוי נשמת {event.deceasedName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-full">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleRelease} className="p-2 text-red-500 hover:text-red-700 bg-red-50 rounded-full" title="שחרר מסכת">
            <Unlock className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-slate-800 pb-4">
        <h1 className="text-3xl font-bold">לימוד מסכת {tractateName}</h1>
        <h2 className="text-xl mt-2">לעילוי נשמת {event.deceasedName} ז"ל</h2>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full print:p-0 print:max-w-none">
        
        {/* Controls - Hidden when printing */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 print:hidden font-sans">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={showBartenura} onChange={e => setShowBartenura(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="mr-3 text-sm font-medium text-slate-700">הצג פירוש ברטנורא</span>
            </label>
          </div>
          <div className="text-sm font-medium text-slate-500">
            פרק {currentChapter + 1} מתוך {data.chapters.length}
          </div>
        </div>

        {/* Mishna Text */}
        <div className="space-y-8 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 text-xl md:text-2xl leading-loose">
          <h2 className="text-center font-bold text-2xl text-slate-800 mb-6 pb-2 border-b border-slate-200">פרק {currentChapter + 1}</h2>
          
          {chapterData.text.map((mishnahText: string, idx: number) => (
            <div key={idx} className="mb-8">
              <div className="flex">
                <span className="font-bold text-slate-400 ml-3 select-none text-lg">{idx + 1}.</span>
                <p className="text-slate-800 text-justify" dangerouslySetInnerHTML={{ __html: mishnahText }} />
              </div>
              
              {showBartenura && chapterData.bartenura[idx] && (
                <div className="mt-4 mr-8 p-4 bg-slate-50 border-r-4 border-slate-300 text-lg text-slate-600 leading-relaxed text-justify">
                  <span className="font-bold text-slate-700 ml-2">רע"ב:</span>
                  <span dangerouslySetInnerHTML={{ __html: chapterData.bartenura[idx] }} />
                </div>
              )}
            </div>
          ))}
        </div>

      </main>

      {/* Floating Action Button - Hidden when printing */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 print:hidden font-sans px-4">
        <button 
          onClick={handleFinishChapter}
          className="bg-blue-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-3 font-medium text-lg w-full max-w-sm justify-center"
        >
          <CheckCircle className="w-6 h-6" />
          {currentChapter < data.chapters.length - 1 ? "סיימתי פרק - המשך לפרק הבא" : "סיימתי מסכת! יישר כוח"}
        </button>
      </div>

    </div>
  );
}
