"use client";

import { useState, useEffect } from "react";
import { db, isMockMode } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import { DEFAULT_SYSTEM_TEXTS } from "@/lib/defaultTexts";
import { Lock, Settings, BarChart3, Save, CheckCircle2, LogOut, FileText, ExternalLink, Trash2, PlusCircle, Undo, Download } from "lucide-react";
import Link from "next/link";
import { TRACTATE_CHAPTERS } from "@/lib/tractates";
import { downloadCSV } from "@/lib/exportUtils";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({ events: 0, chaptersLearned: 0, participants: 0 });
  const [systemTexts, setSystemTexts] = useState<any>(DEFAULT_SYSTEM_TEXTS);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [allEvents, setAllEvents] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Edah tab state for the editor
  const [activeEdah, setActiveEdah] = useState<"mizrach" | "ashkenaz" | "teiman">("mizrach");

  useEffect(() => {
    // Check if authenticated from homepage prompt
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
      loadData();
    } else {
      // Force them back to homepage to login
      window.location.href = "/";
    }
  }, []);

  const migrateOldTexts = (texts: any) => {
    if (!texts) return texts;
    
    // If it already has customPrayers, return as is
    if (texts.customPrayers && texts.customPrayers.length > 0) {
       return texts;
    }

    // Start with the full default array
    let newPrayers = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_TEXTS.customPrayers || []));
    
    const updatePrayer = (edah: string, titleKey: string, content: string) => {
      // Only migrate if it looks like they actually changed it
      if (!content || typeof content !== 'string' || content.trim() === '' || content.includes('מנהל המערכת ישלים')) {
         return;
      }
      
      // Find the corresponding default prayer and overwrite its content
      const existing = newPrayers.find((p: any) => p.edah === edah && p.title.includes(titleKey));
      if (existing) {
        existing.content = content;
      } else {
        // If not found in defaults, add it
        newPrayers.push({
          id: Date.now().toString() + Math.random().toString(),
          edah,
          title: titleKey,
          gender: 'both',
          content
        });
      }
    };

    const edot = ['mizrach', 'ashkenaz', 'teiman'];
    
    edot.forEach(edah => {
      if (texts.birkatHamazon?.[edah]) updatePrayer(edah, 'ברכת המזון', texts.birkatHamazon[edah]);
      if (texts.tzidukHadin?.[edah]) updatePrayer(edah, 'צידוק הדין', texts.tzidukHadin[edah]);
      if (texts.kaddish?.yatom?.[edah]) updatePrayer(edah, 'קדיש יתום', texts.kaddish.yatom[edah]);
      if (texts.kaddish?.derabanan?.[edah]) updatePrayer(edah, 'קדיש דרבנן', texts.kaddish.derabanan[edah]);
      
      // For hashkavot, we match the default titles created earlier
      if (texts.hashkavot?.[edah]?.man) updatePrayer(edah, 'אשכבה', texts.hashkavot[edah].man);
      if (texts.hashkavot?.[edah]?.woman) updatePrayer(edah, 'אשכבה', texts.hashkavot[edah].woman);
      // If they had greatMan/greatWoman, add them as new
      if (texts.hashkavot?.[edah]?.greatMan && !texts.hashkavot[edah].greatMan.includes('מנהל המערכת ישלים') && !texts.hashkavot[edah].greatMan.includes('(אשכבה לאדם גדול')) {
         newPrayers.push({ id: Date.now().toString() + Math.random().toString(), edah, title: 'אשכבה לאדם גדול', gender: 'male', content: texts.hashkavot[edah].greatMan });
      }
      if (texts.hashkavot?.[edah]?.greatWoman && !texts.hashkavot[edah].greatWoman.includes('מנהל המערכת ישלים') && !texts.hashkavot[edah].greatWoman.includes('(אשכבה לאישה גדולה')) {
         newPrayers.push({ id: Date.now().toString() + Math.random().toString(), edah, title: 'אשכבה לאישה גדולה', gender: 'female', content: texts.hashkavot[edah].greatWoman });
      }
    });

    return {
      ...texts,
      customPrayers: newPrayers
    };
  };

  const loadData = async () => {
    setLoading(true);
    if (isMockMode) {
       const res = await fetch("/api/mockdb");
       const data = await res.json();
       const evs = data.events || {};
       setAllEvents(evs);
       calculateStats(evs);
       setSystemTexts(migrateOldTexts(data.system_texts) || DEFAULT_SYSTEM_TEXTS);
       setLoading(false);
       return;
    }

    const rootRef = ref(db);
    const snapshot = await get(rootRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const evs = data.events || {};
      setAllEvents(evs);
      calculateStats(evs);
      setSystemTexts(migrateOldTexts(data.system_texts) || DEFAULT_SYSTEM_TEXTS);
    }
    setLoading(false);
  };

  const calculateStats = (eventsData: any) => {
    let evCount = Object.keys(eventsData).length;
    let chCount = 0;
    let parts = new Set();
    
    Object.values(eventsData).forEach((ev: any) => {
      const tractates = ev.tractates || {};
      Object.values(tractates).forEach((tObj: any) => {
        const chapters = tObj.chapters || {};
        Object.values(chapters).forEach((c: any) => {
          if (c.takerName) parts.add(c.takerName + c.takerPhone);
          if (c.isCompleted) chCount++;
        });
      });
    });

    setStats({ events: evCount, chaptersLearned: chCount, participants: parts.size });
  };

  const handleSave = async () => {
    setSaving(true);
    if (isMockMode) {
      await fetch("/api/mockdb?path=system_texts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemTexts)
      });
    } else {
      await update(ref(db), { system_texts: systemTexts });
    }
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    window.location.href = "/";
  };

  const handleAdminDeleteEvent = async (eventId: string) => {
    if (!confirm("האם למחוק אירוע זה לצמיתות ממסד הנתונים? פעולה זו אינה ניתנת לביטול.")) return;
    
    if (isMockMode) {
      await fetch(`/api/mockdb?path=events/${eventId}`, { method: 'DELETE' });
    } else {
      await remove(ref(db, `events/${eventId}`));
    }
    
    // Update local state
    setAllEvents((prev: any) => {
      const newEvents = { ...prev };
      delete newEvents[eventId];
      calculateStats(newEvents);
      return newEvents;
    });
  };

  const handleAdminRestoreEvent = async (eventId: string) => {
    if (!confirm("האם ברצונך לשחזר את האירוע? האירוע יחזור להופיע למשתתפים ולמארגן.")) return;
    
    if (isMockMode) {
      await fetch(`/api/mockdb?path=events/${eventId}/isArchived`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(false)
      });
    } else {
      await update(ref(db, `events/${eventId}`), { isArchived: null });
    }
    
    // Update local state
    setAllEvents((prev: any) => {
      const newEvents = { ...prev };
      if (newEvents[eventId]) {
        newEvents[eventId].isArchived = false;
      }
      return newEvents;
    });
  };

  const handleExportAll = () => {
    const dataToExport = Object.entries(allEvents).map(([id, ev]: any) => ({
      "קוד אירוע": id,
      "שם הנפטר": `${ev.deceasedName} ${ev.deceasedTitle || ''}`.trim(),
      "תאריך פטירה": ev.passingDate || "",
      "תאריך יעד": ev.shloshimDateHebrew || "",
      "שם המארגן": ev.organizerName || "",
      "טלפון מארגן": ev.organizerPhone || "",
      "דואל מארגן": ev.organizerEmail || "",
      "מצב סיום": checkEventCompletion(ev),
      "נמחק": ev.isArchived ? "כן" : "לא"
    }));
    downloadCSV(dataToExport, "all_events.csv");
  };

  const checkEventCompletion = (ev: any) => {
    let allChapters = 0;
    let takenChapters = 0;
    let completedChapters = 0;

    Object.keys(TRACTATE_CHAPTERS).forEach(t => {
      const chCount = TRACTATE_CHAPTERS[t];
      allChapters += chCount;
      const tObj = ev.tractates?.[t];
      if (tObj && tObj.chapters) {
        Object.keys(tObj.chapters).forEach(k => {
          if (parseInt(k) < chCount) {
            const c = tObj.chapters[k];
            if (c.takerName) takenChapters++;
            if (c.isCompleted) completedChapters++;
          }
        });
      }
    });

    if (completedChapters === allChapters) return "הושלם בלימוד";
    if (takenChapters === allChapters) return "כל הפרקים נלקחו";
    return `נלקחו ${takenChapters} מתוך ${allChapters}`;
  };

  const handleAddPrayer = () => {
    const newPrayer = {
      id: Date.now().toString(),
      edah: activeEdah,
      title: "כותרת חדשה",
      content: "תוכן הטקסט...",
      gender: "both"
    };
    setSystemTexts((prev: any) => ({
      ...prev,
      customPrayers: [...(prev.customPrayers || []), newPrayer]
    }));
  };

  const handleUpdatePrayer = (id: string, field: string, value: string) => {
    setSystemTexts((prev: any) => ({
      ...prev,
      customPrayers: (prev.customPrayers || []).map((p: any) => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleDeletePrayer = (id: string) => {
    if (!confirm("האם למחוק טקסט זה?")) return;
    setSystemTexts((prev: any) => ({
      ...prev,
      customPrayers: (prev.customPrayers || []).filter((p: any) => p.id !== id)
    }));
  };

  if (!isAuthenticated) return null; // handled by redirect
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">טוען נתונים...</div>;

  const EDOT_LABELS = {
    mizrach: "עדות המזרח",
    ashkenaz: "אשכנז",
    teiman: "תימן (בלדי)"
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
      <header className="bg-slate-800 text-white p-6 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-amber-400" />
              פאנל מנהל מערכת
            </h1>
            <button onClick={handleLogout} className="text-slate-300 hover:text-white flex items-center gap-1 text-sm bg-slate-700 px-3 py-1.5 rounded-lg transition">
              <LogOut className="w-4 h-4" />
              יציאה למסך ראשי
            </button>
          </div>
          <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition">
            {saving ? "שומר..." : savedOk ? <><CheckCircle2 className="w-5 h-5"/> נשמר</> : <><Save className="w-5 h-5"/> שמור שינויים</>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 mt-6">
        
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-slate-500 mb-1 font-medium">סה"כ אירועים</div>
            <div className="text-4xl font-bold text-slate-800">{stats.events}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-slate-500 mb-1 font-medium">לומדים פעילים (משוער)</div>
            <div className="text-4xl font-bold text-blue-600">{stats.participants}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-slate-500 mb-1 font-medium">פרקים שהושלמו בהצלחה</div>
            <div className="text-4xl font-bold text-green-600">{stats.chaptersLearned}</div>
          </div>
        </section>

        {/* Events Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <FileText className="w-6 h-6 text-slate-400" />
              רשימת אירועי לימוד במערכת
            </h2>
            <button 
              onClick={handleExportAll}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> ייצוא נתונים לאקסל
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-3 font-medium">שם הנפטר</th>
                  <th className="p-3 font-medium">תאריך פטירה (לועזי)</th>
                  <th className="p-3 font-medium">שם המארגן</th>
                  <th className="p-3 font-medium">טלפון מארגן</th>
                  <th className="p-3 font-medium">דוא"ל מארגן</th>
                  <th className="p-3 font-medium">סטטוס לימוד</th>
                  <th className="p-3 font-medium text-center">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allEvents).map(([id, ev]: any) => (
                  <tr key={id} className={`border-b border-slate-50 hover:bg-slate-50 ${ev.isArchived ? 'opacity-60 bg-red-50/30' : ''}`}>
                    <td className="p-3 font-bold text-slate-800">
                      {ev.deceasedName} {ev.deceasedTitle || ''}
                      {ev.isArchived && <span className="block text-xs text-red-500 font-bold mt-1">ארכיון (נמחק)</span>}
                    </td>
                    <td className="p-3 text-slate-600">{ev.passingDate || "-"}</td>
                    <td className="p-3 text-slate-600">{ev.organizerName || "-"}</td>
                    <td className="p-3 text-slate-600" dir="ltr">{ev.organizerPhone || "-"}</td>
                    <td className="p-3 text-slate-600">{ev.organizerEmail || "-"}</td>
                    <td className="p-3 text-blue-600 font-medium">{checkEventCompletion(ev)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-3">
                        {!ev.isArchived && (
                          <Link href={`/event/${id}`} target="_blank" className="text-amber-600 hover:text-amber-700 flex items-center gap-1" title="לצפייה באירוע">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        {ev.isArchived && (
                          <button onClick={() => handleAdminRestoreEvent(id)} className="text-green-600 hover:text-green-700 transition" title="שחזור אירוע מחוק">
                            <Undo className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleAdminDeleteEvent(id)} className="text-red-400 hover:text-red-600 transition" title="מחיקה לצמיתות">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {Object.keys(allEvents).length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">לא נמצאו אירועים במערכת</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admin Password */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
           <h3 className="font-bold text-lg text-amber-700 mb-2 border-b pb-2">הגדרות מערכת</h3>
            <div className="max-w-xs mt-4">
              <label className="block text-sm font-bold text-slate-600 mb-1">סיסמת כניסה למנהל מערכת</label>
              <input 
                type="text" 
                className="w-full border rounded-xl p-3 text-left font-mono" 
                dir="ltr"
                value={systemTexts.adminPassword || "4614320"} 
                onChange={e => setSystemTexts({...systemTexts, adminPassword: e.target.value})} 
              />
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-600 mb-2">טקסט 'אודות המערכת' (יופיע לכל המשתמשים תחת כרטיסיית 'אודות')</label>
              <textarea 
                className="w-full border rounded-xl p-3 min-h-[150px] font-sans" 
                value={systemTexts.aboutUs || DEFAULT_SYSTEM_TEXTS.aboutUs} 
                onChange={e => setSystemTexts({...systemTexts, aboutUs: e.target.value})} 
              />
              <p className="text-xs text-slate-400 mt-1">כאן מומלץ לתת קרדיט למפתחים ולמקורות הטקסט כגון Sefaria ותורת אמת.</p>
            </div>
        </section>

        {/* Texts Editor with Tabs */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-slate-400" />
            עריכת טקסטים ועזרים לאבלים
          </h2>
          
          <div className="flex border-b mb-6">
            {(["mizrach", "ashkenaz", "teiman"] as const).map(edah => (
              <button 
                key={edah}
                className={`py-3 px-6 font-bold transition-colors ${activeEdah === edah ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveEdah(edah)}
              >
                נוסח {EDOT_LABELS[edah]}
              </button>
            ))}
          </div>
          
          <div className="space-y-6">
            {(systemTexts.customPrayers || DEFAULT_SYSTEM_TEXTS.customPrayers || []).filter((p: any) => p.edah === activeEdah).map((prayer: any) => (
              <div key={prayer.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                <button 
                  onClick={() => handleDeletePrayer(prayer.id)} 
                  className="absolute top-4 left-4 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl transition"
                  title="מחק טקסט"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-12 md:pr-0">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">כותרת (לדוגמה: אשכבה, קדיש יתום, אל מלא רחמים)</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-200 rounded-xl p-3 font-bold" 
                      value={prayer.title} 
                      onChange={e => handleUpdatePrayer(prayer.id, 'title', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">מיועד עבור (מגדר)</label>
                    <select 
                      className="w-full border border-slate-200 rounded-xl p-3 bg-white"
                      value={prayer.gender}
                      onChange={e => handleUpdatePrayer(prayer.id, 'gender', e.target.value)}
                    >
                      <option value="both">לשני המינים (יוצג תמיד)</option>
                      <option value="male">לגבר בלבד (יוצג אם הנפטר איש)</option>
                      <option value="female">לאישה בלבד (יוצג אם הנפטרת אישה)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">תוכן הטקסט (השתמש ב- 'פלוני בן פלוני' או 'פלונית בת פלונית' והם יוחלפו אוטומטית בשם הנפטר/ת)</label>
                  <textarea 
                    className="w-full border border-slate-200 rounded-xl p-4 min-h-[150px] font-serif text-lg leading-loose" 
                    value={prayer.content} 
                    onChange={e => handleUpdatePrayer(prayer.id, 'content', e.target.value)} 
                    dir="rtl"
                  />
                </div>
              </div>
            ))}
            
            <button 
              onClick={handleAddPrayer} 
              className="w-full py-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition flex justify-center items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> הוסף קטע טקסט חדש לנוסח {EDOT_LABELS[activeEdah]}
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
