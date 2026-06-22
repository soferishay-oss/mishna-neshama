"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, isMockMode } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { getHebrewChapter } from "@/lib/tractates";
import { ArrowRight, BookOpen, Calendar, CheckCircle2, PlayCircle, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { TRACTATE_CHAPTERS } from "@/lib/tractates";

export default function MyLearningPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{name: string, phone: string} | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem("participantProfile");
    if (profileStr) {
      const p = JSON.parse(profileStr);
      setProfile(p);
      loadUserEvents(p.phone);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserEvents = async (phone: string) => {
    setLoading(true);
    const cleanPhone = phone.replace(/\D/g, '');
    let allEvents: any = {};
    
    try {
      if (isMockMode) {
        const res = await fetch("/api/mockdb");
        const data = await res.json();
        allEvents = data.events || {};
      } else {
        const snap = await get(ref(db, "events"));
        if (snap.exists()) {
          allEvents = snap.val();
        }
      }

      const userEvents: any[] = [];

      Object.entries(allEvents).forEach(([eventId, ev]: any) => {
        if (ev.isArchived) return;
        
        let userTractates: any[] = [];
        let totalChapters = 0;
        let completedChapters = 0;
        
        if (ev.tractates) {
          Object.entries(ev.tractates).forEach(([tractateName, tractateObj]: any) => {
            if (tractateObj.chapters) {
              const myChaps: { ch: number, completed: boolean }[] = [];
              Object.entries(tractateObj.chapters).forEach(([chIndex, chapterObj]: any) => {
                const takerPhone = (chapterObj.takerPhone || "").replace(/\D/g, '');
                if (takerPhone === cleanPhone || (chapterObj.takerName === profile?.name && takerPhone === cleanPhone)) {
                  myChaps.push({
                    ch: parseInt(chIndex, 10),
                    completed: !!chapterObj.isCompleted
                  });
                  totalChapters++;
                  if (chapterObj.isCompleted) completedChapters++;
                }
              });
              
              if (myChaps.length > 0) {
                userTractates.push({
                  name: tractateName,
                  chapters: myChaps.sort((a,b) => a.ch - b.ch)
                });
              }
            }
          });
        }

        if (totalChapters > 0) {
          // Calculate days remaining
          let daysRemaining = -1;
          if (ev.shloshimDateStr) {
            const targetDate = new Date(ev.shloshimDateStr);
            targetDate.setHours(23, 59, 59, 999);
            const now = new Date();
            const diffTime = targetDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          const isFullyCompleted = completedChapters === totalChapters;
          const isPast = daysRemaining < 0;

          userEvents.push({
            id: eventId,
            deceasedName: `${ev.deceasedName} ${ev.deceasedTitle || ''}`.trim(),
            targetDateHebrew: ev.shloshimDateHebrew,
            daysRemaining,
            tractates: userTractates,
            totalChapters,
            completedChapters,
            isFullyCompleted,
            isPast,
            // sorting score: active events first, then completed/past
            sortScore: (isFullyCompleted || isPast) ? 100000 + (daysRemaining * -1) : daysRemaining
          });
        }
      });

      userEvents.sort((a, b) => a.sortScore - b.sortScore);
      setMyEvents(userEvents);
      setLoading(false);
      
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    const p = { name: "לומד", phone: phoneInput };
    setProfile(p);
    localStorage.setItem("participantProfile", JSON.stringify(p));
    loadUserEvents(p.phone);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">טוען...</div>;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            הלימודים שלי
          </h1>
          <Link href="/" className="text-white hover:text-blue-200 transition bg-blue-700/50 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-medium">
            חזרה לראשי
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 mt-4">
        {!profile ? (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 max-w-sm mx-auto space-y-4">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-2">כניסה לאזור האישי</h2>
            <p className="text-slate-500 text-sm text-center mb-4">
              הזן את מספר הטלפון שלך כדי לצפות בכל הלימודים שלקחת על עצמך.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">טלפון נייד</label>
                <input 
                  type="tel" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                  placeholder="לדוגמה: 0501234567"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition font-medium text-lg shadow-md">
                היכנס לאזור האישי
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">שלום, {profile.name}</h2>
                <p className="text-sm text-slate-500">הטלפון המחובר: <span dir="ltr">{profile.phone}</span></p>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem("participantProfile");
                  setProfile(null);
                  setMyEvents([]);
                }}
                className="text-sm text-slate-400 hover:text-slate-600 underline"
              >
                החלף משתמש
              </button>
            </div>

            {myEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2">לא נמצאו התחייבויות</h3>
                <p className="text-slate-500 mb-6">לא נמצאו פרקים או מסכתות הרשומים על מספר הטלפון שלך.</p>
                <Link href="/" className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition">
                  חפש אירוע לימוד
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 mb-2">האירועים בהם אתה משתתף:</h3>
                
                {myEvents.map((ev, idx) => {
                  const isDone = ev.isFullyCompleted;
                  const isExpanded = expandedEventId === ev.id;
                  
                  // Separate tractates to Full and Partial
                  const fullTractates: any[] = [];
                  const partialTractates: any[] = [];
                  ev.tractates.forEach((t: any) => {
                    const totalInTractate = TRACTATE_CHAPTERS[t.name as keyof typeof TRACTATE_CHAPTERS];
                    if (t.chapters.length === totalInTractate) {
                      fullTractates.push(t);
                    } else {
                      partialTractates.push(t);
                    }
                  });

                  return (
                    <div key={idx} className={`bg-white rounded-xl border ${isDone ? 'border-green-200' : 'border-slate-200'} shadow-sm overflow-hidden transition-all duration-300`}>
                      {/* Condensed Row (Always Visible) */}
                      <div 
                        onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                        className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition ${isDone ? 'bg-green-50/30' : ''}`}
                      >
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                          <div className="font-bold text-lg text-slate-800 min-w-[150px]">
                            {ev.deceasedName}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {ev.targetDateHebrew}
                            </span>
                            {!isDone && ev.daysRemaining >= 0 && (
                              <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${ev.daysRemaining <= 3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {ev.daysRemaining === 0 ? "היום!" : `עוד ${ev.daysRemaining} ימים`}
                              </span>
                            )}
                            {isDone && (
                              <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> הושלם
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-left hidden sm:block">
                            <div className="font-bold text-base" dir="ltr">
                              <span className={isDone ? 'text-green-600' : 'text-amber-600'}>{ev.completedChapters}</span> 
                              <span className="text-slate-400"> / {ev.totalChapters}</span>
                            </div>
                          </div>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                            <div className="text-sm font-bold text-slate-700">פירוט המסכתות והפרקים:</div>
                            <Link href={`/event/${ev.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 transition shadow-sm flex items-center gap-1">
                              כניסה לאירוע <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                          
                          <div className="space-y-3">
                            {fullTractates.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-bold text-slate-500 py-1.5 ml-2">מסכתות שלמות:</span>
                                {fullTractates.map((t: any, i: number) => {
                                  const isTractateDone = t.chapters.every((c: any) => c.completed);
                                  return (
                                    <div key={i} className={`text-sm px-3 py-1.5 rounded-lg border font-bold ${isTractateDone ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                      {t.name}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {partialTractates.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2">
                                <span className="text-xs font-bold text-slate-500">פרקים ממסכתות:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {partialTractates.map((t: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-sm">
                                      <span className="font-bold text-slate-800 min-w-[70px]">{t.name}:</span>
                                      <div className="flex flex-wrap gap-1 flex-1">
                                        {t.chapters.map((c: any, j: number) => (
                                          <span key={j} className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {getHebrewChapter(c.ch)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {isDone && (
                            <div className="mt-4 bg-green-100 text-green-800 p-2 rounded-lg flex items-center justify-center gap-2 font-bold text-xs border border-green-200">
                              <Trophy className="w-4 h-4 text-green-600" />
                              יישר כוח! סיימת את כל הפרקים שלקחת לעילוי נשמה זו.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
