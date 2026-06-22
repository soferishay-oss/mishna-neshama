"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, BookOpen, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { SEFARIA_NAMES, getHebrewChapter } from "@/lib/tractates";
import { isMockMode, db } from "@/lib/firebase";
import { ref, update } from "firebase/database";

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
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-serif">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10 border-b border-amber-100">
        <Link href={`/event/${id}`} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition">
          <ChevronRight className="w-6 h-6" />
        </Link>
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-xl font-bold text-amber-900">מסכת {decodedTractate}</h1>
          <h2 className="text-sm font-medium text-amber-700">פרק {getHebrewChapter(chapterIndex)}</h2>
        </div>
        
        <div className="flex items-center gap-1">
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

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-800/60 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-medium text-lg">שואב את מילות המשנה...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl text-center border border-red-100">
            {error}
          </div>
        ) : (
          <div className="space-y-12">
            {textLines.map((line, index) => {
               // Remove HTML tags for basic text
               const cleanText = line.replace(/<\/?[^>]+(>|$)/g, "");
               const mishnaLetter = getHebrewChapter(index);
               
               const commentsRaw = activeCommentary === 'bartenura' ? bartenuraLines[index] : activeCommentary === 'rambam' ? rambamLines[index] : activeCommentary === 'tosafot' ? tosafotLines[index] : [];
               const comments = Array.isArray(commentsRaw) ? commentsRaw : commentsRaw ? [commentsRaw] : [];

               return (
                 <div key={index} className="flex gap-4">
                   <div className="text-amber-500 font-bold text-xl pt-1 select-none w-8 shrink-0 text-right">
                     {mishnaLetter}
                   </div>
                   <div className="flex-1">
                     <div className="text-2xl leading-[2.2] text-slate-800 text-justify">
                       {cleanText}
                     </div>
                     
                     {/* Commentary section */}
                     {activeCommentary !== 'none' && comments.length > 0 && (
                       <div className="mt-4 bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3 shadow-inner">
                         <div className="text-sm font-bold text-amber-800 border-b border-amber-200 pb-2 mb-3">
                           {activeCommentary === 'bartenura' ? "רע\"ב:" : activeCommentary === 'rambam' ? "רמב\"ם:" : "תוספות יום טוב:"}
                         </div>
                         {comments.map((comment, cIdx) => (
                           <div key={cIdx} className="text-lg leading-relaxed text-slate-700 text-justify" dangerouslySetInnerHTML={{ __html: comment }} />
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </main>

      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent">
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
    </div>
  );
}
