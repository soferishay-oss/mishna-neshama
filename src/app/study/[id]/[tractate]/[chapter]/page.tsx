"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, BookOpen, MessageSquareText, Bookmark, Type, Printer, ChevronDown } from "lucide-react";
import Link from "next/link";
import { SEFARIA_NAMES, getHebrewChapter } from "@/lib/tractates";
import { isMockMode, db } from "@/lib/firebase";
import { ref, update, get } from "firebase/database";

export default function StudyPage() {
  const { id, tractate, chapter } = useParams();
  const router = useRouter();
  
  const decodedTractate = decodeURIComponent(tractate as string);
  const chapterIndex = parseInt(chapter as string, 10);
  
  const [textLines, setTextLines] = useState<string[]>([]);
  const [bartenuraLines, setBartenuraLines] = useState<string[][]>([]);
  const [rambamLines, setRambamLines] = useState<string[][]>([]);
  const [tosafotLines, setTosafotLines] = useState<string[][]>([]);
  
  const [activeCommentary, setActiveCommentary] = useState<'none' | 'bartenura' | 'rambam' | 'tosafot'>('none');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [textSize, setTextSizeState] = useState(1.2);
  const [bookmarkedIndex, setBookmarkedIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedSize = localStorage.getItem('preferredTextSize');
    if (savedSize) setTextSizeState(parseFloat(savedSize));
  }, []);

  const setTextSize = (updater: number | ((prev: number) => number)) => {
    setTextSizeState(prev => {
      const newSize = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('preferredTextSize', newSize.toString());
      return newSize;
    });
  };

  // Print selection
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printRange, setPrintRange] = useState<[number, number] | null>(null);
  const [printStartIdx, setPrintStartIdx] = useState(0);
  const [printEndIdx, setPrintEndIdx] = useState(0);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (isMockMode) {
          const res = await fetch(`/api/mockdb`);
          const allData = await res.json();
          setEventData(allData?.events?.[id as string] || null);
        } else {
          const snap = await get(ref(db, `events/${id}`));
          if (snap.exists()) setEventData(snap.val());
        }
      } catch (e) {
         console.error(e);
      }
    };
    fetchEventData();
  }, [id]);

  useEffect(() => {
    const bm = localStorage.getItem(`bookmark_${id}_${decodedTractate}_${chapterIndex}`);
    if (bm) setBookmarkedIndex(parseInt(bm, 10));
  }, [id, decodedTractate, chapterIndex]);
  
  useEffect(() => {
     if (!loading && bookmarkedIndex !== null) {
        setTimeout(() => {
          const el = document.getElementById(`mishnah-${bookmarkedIndex}`);
          if (el) {
             el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
     }
  }, [loading]);

  const handleBookmark = (index: number) => {
    if (bookmarkedIndex === index) {
      localStorage.removeItem(`bookmark_${id}_${decodedTractate}_${chapterIndex}`);
      setBookmarkedIndex(null);
    } else {
      localStorage.setItem(`bookmark_${id}_${decodedTractate}_${chapterIndex}`, index.toString());
      setBookmarkedIndex(index);
    }
  };

  useEffect(() => {
    const fetchText = async () => {
      try {
        const sefariaName = SEFARIA_NAMES[decodedTractate];
        if (!sefariaName) {
          setError(`לא נמצא מיפוי בספריא למסכת ${decodedTractate}.`);
          setLoading(false);
          return;
        }

        // Fetch Mishnah Text
        const res = await fetch(`https://www.sefaria.org/api/texts/Mishnah_${sefariaName}.${chapterIndex + 1}?vhe=Torat_Emet_357`);
        const data = await res.json();
        
        let fetchedText: string[] = [];
        if (data && data.he && data.he.length > 0) {
          fetchedText = data.he;
        } else {
          // Fallback to context 0
          const resFallback = await fetch(`https://www.sefaria.org/api/texts/Mishnah_${sefariaName}.${chapterIndex + 1}?context=0`);
          const dataFallback = await resFallback.json();
          if (dataFallback && dataFallback.he && dataFallback.he.length > 0) {
            fetchedText = dataFallback.he;
          } else {
            setError("לא הצלחנו למשוך את הטקסט ממסד הנתונים של ספריא.");
            setLoading(false);
            return;
          }
        }
        setTextLines(fetchedText);

        // Fetch Commentaries Concurrently
        const fetchCommentary = async (commentator: string) => {
          try {
            const res = await fetch(`https://www.sefaria.org/api/texts/${commentator}_on_Mishnah_${sefariaName}.${chapterIndex + 1}?context=0`);
            const data = await res.json();
            return (data && data.he && data.he.length > 0) ? data.he : [];
          } catch (e) {
            console.warn(`Could not fetch ${commentator}`, e);
            return [];
          }
        };

        const [bartenuraRes, rambamRes, tosafotRes] = await Promise.all([
          fetchCommentary('Bartenura'),
          fetchCommentary('Rambam'),
          fetchCommentary('Tosafot_Yom_Tov')
        ]);

        setBartenuraLines(bartenuraRes);
        setRambamLines(rambamRes);
        setTosafotLines(tosafotRes);

      } catch (e) {
        console.error(e);
        setError("שגיאת תקשורת במשיכת הטקסט.");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [decodedTractate, chapterIndex]);

  const handleFinish = async () => {
    setSaving(true);
    
    const updatePath = `events/${id}/tractates/${decodedTractate}/chapters/${chapterIndex}/isCompleted`;
    const updates = { [updatePath]: true };

    try {
      if (isMockMode) {
        await fetch('/api/mockdb', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } else {
        await update(ref(db), updates);
      }
      
      // Navigate back to learner dashboard. The dashboard will automatically update to the next chapter!
      router.push(`/event/${id}`);
    } catch (e) {
      console.error(e);
      alert("אירעה שגיאה בשמירת ההתקדמות.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] print:bg-white flex flex-col font-serif">
      <header className="bg-white shadow-sm p-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10 border-b border-amber-100 print:hidden gap-4 md:gap-0">
        <div className="flex w-full md:w-auto items-center justify-between">
          <Link href={`/event/${id}`} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition">
            <ChevronRight className="w-6 h-6" />
          </Link>
          <div className="flex flex-col justify-center items-center md:absolute md:left-1/2 md:-translate-x-1/2">
            <h1 className="text-xl font-bold text-amber-900">מסכת {decodedTractate}</h1>
            <h2 className="text-sm font-medium text-amber-700">פרק {getHebrewChapter(chapterIndex)}</h2>
          </div>
          <div className="w-10 md:hidden"></div>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-2 max-w-full">
          <div className="flex bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <button onClick={() => setTextSize(prev => Math.max(1, prev - 0.2))} className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold" title="הקטן טקסט">A-</button>
            <div className="w-[1px] bg-slate-200"></div>
            <button onClick={() => setTextSize(prev => Math.min(3, prev + 0.2))} className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold" title="הגדל טקסט">A+</button>
          </div>
          <button 
            onClick={() => {
              setPrintStartIdx(0);
              setPrintEndIdx(textLines.length - 1 > 0 ? textLines.length - 1 : 0);
              setShowPrintModal(true);
            }} 
            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1 print:hidden"
            title="הדפס ללימוד בשבת"
          >
            <Printer className="w-4 h-4" /> הדפס
          </button>
          {bartenuraLines.length > 0 && (
            <button 
              onClick={() => setActiveCommentary(activeCommentary === 'bartenura' ? 'none' : 'bartenura')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${activeCommentary === 'bartenura' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-100'}`}
              title="ברטנורא"
            >
              ברטנורא
            </button>
          )}
          {rambamLines.length > 0 && (
            <button 
              onClick={() => setActiveCommentary(activeCommentary === 'rambam' ? 'none' : 'rambam')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${activeCommentary === 'rambam' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-100'}`}
              title="רמב''ם"
            >
              רמב"ם
            </button>
          )}
          {tosafotLines.length > 0 && (
            <button 
              onClick={() => setActiveCommentary(activeCommentary === 'tosafot' ? 'none' : 'tosafot')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${activeCommentary === 'tosafot' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-100'}`}
              title="תוספות יום טוב"
            >
              תוי"ט
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full pb-32 print:p-0 print:pb-0">
        {/* Print Header */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-800 pb-4 mt-8">
          <h1 className="text-3xl font-bold">לימוד מסכת {decodedTractate} - פרק {getHebrewChapter(chapterIndex)}</h1>
          {eventData && <h2 className="text-xl mt-2">לעילוי נשמת {eventData.deceasedName} {eventData.deceasedTitle || ''}</h2>}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-800/60 gap-4 print:hidden">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-medium text-lg">שואב את מילות המשנה...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl text-center border border-red-100 print:hidden">
            {error}
          </div>
        ) : (
          <div className="border-4 border-blue-100 bg-white rounded-3xl p-6 md:p-10 relative mt-4 shadow-sm print:border-none print:shadow-none print:p-0 print:mt-0">
            {eventData && (
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-800 px-6 py-1.5 rounded-full text-sm font-bold shadow-sm whitespace-nowrap print:hidden">
                 לעילוי נשמת {eventData.deceasedName} {eventData.deceasedTitle || ''}
               </div>
            )}
            <div className="space-y-12 mt-4">
            {textLines.map((line, index) => {
               // Print Range Filter
               if (printRange !== null && (index < printRange[0] || index > printRange[1])) {
                 return <div key={index} className="print:hidden"></div>;
               }

               // Remove HTML tags for basic text
               const cleanText = line.replace(/<\/?[^>]+(>|$)/g, "");
               const mishnaLetter = getHebrewChapter(index);
               
               const commentsRaw = activeCommentary === 'bartenura' ? bartenuraLines[index] : activeCommentary === 'rambam' ? rambamLines[index] : activeCommentary === 'tosafot' ? tosafotLines[index] : [];
               const comments = Array.isArray(commentsRaw) ? commentsRaw : commentsRaw ? [commentsRaw] : [];

               return (
                 <div key={index} id={`mishnah-${index}`} className={`flex flex-col p-4 md:p-6 rounded-3xl transition-colors ${bookmarkedIndex === index ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                   <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                     <div className="text-amber-500 font-black text-2xl select-none print:text-black bg-amber-50 w-10 h-10 flex items-center justify-center rounded-full">
                       {mishnaLetter}
                     </div>
                     <button 
                       onClick={() => handleBookmark(index)}
                       className={`rounded-xl transition-all ${bookmarkedIndex === index ? 'bg-amber-100 border-2 border-amber-500 text-amber-700 px-4 py-1.5 flex items-center gap-2 font-bold shadow-sm' : 'p-2.5 text-slate-400 hover:text-amber-500 bg-slate-50 hover:bg-amber-50 flex items-center gap-1 rounded-full border border-slate-100'} print:hidden`}
                       title="שמור מיקום"
                     >
                       {bookmarkedIndex === index ? (
                         <>
                           <span className="text-sm">עד כאן למדת</span>
                           <ChevronDown className="w-4 h-4 fill-amber-500 text-amber-600" />
                         </>
                       ) : (
                         <Bookmark className="w-5 h-5" />
                       )}
                     </button>
                   </div>
                   <div className="flex-1 w-full">
                     <div className="leading-[2.2] text-slate-800 text-justify transition-all duration-300" style={{ fontSize: `${textSize}rem` }}>
                       {cleanText}
                     </div>
                     
                     {/* Commentary section */}
                     {activeCommentary !== 'none' && comments.length > 0 && (
                       <div className="mt-4 bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3 shadow-inner">
                         <div className="text-sm font-bold text-amber-800 border-b border-amber-200 pb-2 mb-3">
                           {activeCommentary === 'bartenura' ? "רע\"ב:" : activeCommentary === 'rambam' ? "רמב\"ם:" : "תוספות יום טוב:"}
                         </div>
                         {comments.map((comment, cIdx) => (
                           <div key={cIdx} className="leading-relaxed text-slate-700 text-justify transition-all duration-300" style={{ fontSize: `${textSize * 0.8}rem` }} dangerouslySetInnerHTML={{ __html: comment }} />
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               );
            })}
          </div>
          </div>
        )}
      </main>

      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent print:hidden">
          <div className="max-w-2xl mx-auto flex justify-center">
            <button 
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 bg-amber-600 text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-amber-700 transition shadow-lg active:scale-95 disabled:bg-slate-400 disabled:cursor-wait"
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <BookOpen className="w-6 h-6" />
                  סיימתי ללמוד פרק זה
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setShowPrintModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">הגדרות הדפסה</h3>
            <div className="space-y-4">
              <button 
                onClick={() => { setPrintRange(null); setShowPrintModal(false); setTimeout(() => window.print(), 300); }} 
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-4 rounded-2xl font-bold text-lg transition"
              >
                הדפס את כל הפרק
              </button>
              
              <div className="border-t border-slate-200 pt-6 mt-4">
                <h4 className="font-bold text-slate-700 mb-4 text-center">או הדפס משניות נבחרות:</h4>
                <div className="flex items-center justify-center gap-3 mb-6">
                   <div className="text-sm font-medium text-slate-500">ממשנה</div>
                   <select className="border border-slate-200 bg-slate-50 p-2 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={printStartIdx} onChange={e => setPrintStartIdx(Number(e.target.value))}>
                     {textLines.map((_, i) => <option key={i} value={i}>{getHebrewChapter(i)}</option>)}
                   </select>
                   <div className="text-sm font-medium text-slate-500">עד</div>
                   <select className="border border-slate-200 bg-slate-50 p-2 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400" value={printEndIdx} onChange={e => setPrintEndIdx(Number(e.target.value))}>
                     {textLines.map((_, i) => <option key={i} value={i}>{getHebrewChapter(i)}</option>)}
                   </select>
                </div>
                <button 
                  onClick={() => { setPrintRange([printStartIdx, printEndIdx]); setShowPrintModal(false); setTimeout(() => window.print(), 300); }} 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-bold text-lg transition shadow-md"
                >
                  הדפס משניות נבחרות
                </button>
              </div>
              
              <button onClick={() => setShowPrintModal(false)} className="w-full text-slate-500 py-3 mt-2 hover:bg-slate-50 rounded-xl transition font-medium">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
