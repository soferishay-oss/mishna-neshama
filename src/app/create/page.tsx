"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { HDate, gematriya } from "@hebcal/core";
import { createStudyEvent, updateEventImage } from "@/lib/events";
import { db, isMockMode } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";

const HEBREW_MONTHS_REGULAR = [
  { he: "תשרי", en: "Tishrei" }, { he: "חשוון", en: "Cheshvan" }, { he: "כסלו", en: "Kislev" },
  { he: "טבת", en: "Tevet" }, { he: "שבט", en: "Sh'vat" }, { he: "אדר", en: "Adar" },
  { he: "ניסן", en: "Nisan" }, { he: "אייר", en: "Iyyar" }, { he: "סיוון", en: "Sivan" },
  { he: "תמוז", en: "Tamuz" }, { he: "אב", en: "Av" }, { he: "אלול", en: "Elul" },
];

const HEBREW_MONTHS_LEAP = [
  { he: "תשרי", en: "Tishrei" }, { he: "חשוון", en: "Cheshvan" }, { he: "כסלו", en: "Kislev" },
  { he: "טבת", en: "Tevet" }, { he: "שבט", en: "Sh'vat" }, { he: "אדר א'", en: "Adar I" }, { he: "אדר ב'", en: "Adar II" },
  { he: "ניסן", en: "Nisan" }, { he: "אייר", en: "Iyyar" }, { he: "סיוון", en: "Sivan" },
  { he: "תמוז", en: "Tamuz" }, { he: "אב", en: "Av" }, { he: "אלול", en: "Elul" },
];

const HEBREW_DAYS = Array.from({length: 30}, (_, i) => i + 1);

function CreateEvent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dateMode, setDateMode] = useState<"hebrew" | "gregorian">("hebrew");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    deceasedName: "",
    deceasedGender: "male" as "male" | "female",
    organizerName: "",
    organizerPhone: "",
    organizerEmail: "",
    whatsappGroup: "",
    showGregorian: false,
  });

  const [deceasedTitleOption, setDeceasedTitleOption] = useState('ז"ל');
  const [customDeceasedTitle, setCustomDeceasedTitle] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Gregorian dates
  const [gregPassingDate, setGregPassingDate] = useState("");
  const [gregBurialDate, setGregBurialDate] = useState("");

  // Hebrew dates
  const currentYear = new HDate().getFullYear();
  const [hebPassingDate, setHebPassingDate] = useState({ day: 1, month: "Tishrei", year: currentYear });
  const [hebBurialDate, setHebBurialDate] = useState({ day: 1, month: "Tishrei", year: currentYear });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Load existing data if editing
  useEffect(() => {
    if (editId) {
      setIsEditMode(true);
      const fetchEvent = async () => {
        let ev: any = null;
        if (isMockMode) {
          const res = await fetch(`/api/mockdb`);
          const data = await res.json();
          ev = data?.events?.[editId];
        } else {
          const snap = await get(ref(db, `events/${editId}`));
          if (snap.exists()) ev = snap.val();
        }

        if (ev) {
          setFormData({
            deceasedName: ev.deceasedName,
            deceasedGender: ev.deceasedGender || "male",
            organizerName: ev.organizerName || "",
            organizerPhone: ev.organizerPhone || "",
            organizerEmail: ev.organizerEmail || "",
            whatsappGroup: ev.whatsappGroup || "",
            showGregorian: ev.showGregorian !== false
          });
          if (ev.deceasedTitle) {
            if (['ז"ל', 'זצ"ל', 'ע"ה', ''].includes(ev.deceasedTitle)) {
              setDeceasedTitleOption(ev.deceasedTitle === '' ? 'ללא תוספת' : ev.deceasedTitle);
            } else {
              setDeceasedTitleOption('אחר');
              setCustomDeceasedTitle(ev.deceasedTitle);
            }
          }
          if (ev.passingDateStr && ev.burialDateStr) {
            setDateMode('gregorian');
            setGregPassingDate(ev.passingDateStr);
            setGregBurialDate(ev.burialDateStr);
          }
        }
      };
      fetchEvent();
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let passingDateStr = "";
      let burialDateStr = "";

      if (dateMode === "hebrew") {
        const hPassing = new HDate(hebPassingDate.day, hebPassingDate.month, hebPassingDate.year);
        const hBurial = new HDate(hebBurialDate.day, hebBurialDate.month, hebBurialDate.year);
        passingDateStr = hPassing.greg().toISOString().split('T')[0];
        burialDateStr = hBurial.greg().toISOString().split('T')[0];
      } else {
        passingDateStr = gregPassingDate;
        burialDateStr = gregBurialDate;
      }

      const payload = {
        ...formData,
        deceasedTitle: deceasedTitleOption === 'אחר' ? customDeceasedTitle : (deceasedTitleOption === 'ללא תוספת' ? '' : deceasedTitleOption),
        passingDate: passingDateStr,
        burialDate: burialDateStr,
      };

      if (isEditMode && editId) {
        // Just update existing event
        if (isMockMode) {
          for (const key of Object.keys(payload)) {
             await fetch(`/api/mockdb?path=events/${editId}/${key}`, { method: 'PUT', body: JSON.stringify((payload as any)[key]) });
          }
        } else {
          await update(ref(db, `events/${editId}`), payload);
        }
        
        if (selectedImage) {
          await updateEventImage(editId, selectedImage);
        }
        
        router.push(`/event/${editId}`);
        return;
      }
      
      const eventId = await createStudyEvent(payload, selectedImage);
      
      // Save to localStorage as organizer
      const orgEvents = JSON.parse(localStorage.getItem("organizedEvents") || "[]");
      orgEvents.push(eventId);
      localStorage.setItem("organizedEvents", JSON.stringify(orgEvents));

      router.push(`/event/${eventId}`);
    } catch (error) {
      console.error("Error creating/editing event", error);
      alert("שגיאה, אנא נסה שנית.");
      setIsSubmitting(false);
    }
  };

  const years = Array.from({ length: 23 }, (_, i) => currentYear - 2 + i);

  const HebrewDateSelector = ({ value, onChange, label }: any) => {
    const isLeap = HDate.isLeapYear(value.year);
    const months = isLeap ? HEBREW_MONTHS_LEAP : HEBREW_MONTHS_REGULAR;
    
    // Safety check: if month is Adar I/II but year is not leap, fallback to Adar
    if (!isLeap && (value.month === "Adar I" || value.month === "Adar II")) {
      setTimeout(() => onChange({ ...value, month: "Adar" }), 0);
    }
    // Safety check: if month is Adar but year is leap, fallback to Adar I
    if (isLeap && value.month === "Adar") {
      setTimeout(() => onChange({ ...value, month: "Adar I" }), 0);
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex gap-2" dir="rtl">
          <select 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={value.day}
            onChange={(e) => onChange({ ...value, day: parseInt(e.target.value) })}
          >
            {HEBREW_DAYS.map(d => (
              <option key={d} value={d}>{gematriya(d)}'</option>
            ))}
          </select>
          <select 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={value.month}
            onChange={(e) => onChange({ ...value, month: e.target.value })}
          >
            {months.map(m => (
              <option key={m.en} value={m.en}>{m.he}</option>
            ))}
          </select>
          <select 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={value.year}
            onChange={(e) => onChange({ ...value, year: parseInt(e.target.value) })}
          >
            {years.map(y => (
              <option key={y} value={y}>{gematriya(y)}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-10">
      <header className="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
        <Link href={editId ? `/event/${editId}` : "/"} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition">
          <ChevronRight className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 mr-2">{isEditMode ? "עריכת הגדרות אירוע" : "צור אירוע לימוד חדש"}</h1>
      </header>

      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center">
              פרטי הנפטר
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם הנפטר (המלא)</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="לדוגמה: דוד בן יוסף"
                value={formData.deceasedName}
                onChange={e => setFormData({...formData, deceasedName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">תואר</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['ז"ל', 'זצ"ל', 'ע"ה', 'הי"ד', 'ללא תוספת', 'אחר'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDeceasedTitleOption(option)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${deceasedTitleOption === option ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {deceasedTitleOption === 'אחר' && (
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={'הזן תואר חופשי'}
                  value={customDeceasedTitle}
                  onChange={e => setCustomDeceasedTitle(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">מגדר</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="deceasedGender" 
                    value="male"
                    checked={formData.deceasedGender === "male"}
                    onChange={() => setFormData({...formData, deceasedGender: "male"})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">איש</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="deceasedGender" 
                    value="female"
                    checked={formData.deceasedGender === "female"}
                    onChange={() => setFormData({...formData, deceasedGender: "female"})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">אישה</span>
                </label>
              </div>
            </div>

            <div className="bg-slate-50 p-2 rounded-xl flex gap-2 mb-4">
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${dateMode === 'hebrew' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setDateMode('hebrew')}
              >
                תאריך עברי
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${dateMode === 'gregorian' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setDateMode('gregorian')}
              >
                תאריך לועזי
              </button>
            </div>

            {dateMode === "hebrew" ? (
              <div className="space-y-4">
                <HebrewDateSelector 
                  label="תאריך פטירה עברי"
                  value={hebPassingDate}
                  onChange={setHebPassingDate}
                />
                <HebrewDateSelector 
                  label="תאריך קבורה עברי"
                  value={hebBurialDate}
                  onChange={setHebBurialDate}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">תאריך פטירה לועזי</label>
                  <input 
                    type="date" 
                    required={dateMode === "gregorian"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={gregPassingDate}
                    onChange={e => setGregPassingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">תאריך קבורה לועזי</label>
                  <input 
                    type="date" 
                    required={dateMode === "gregorian"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={gregBurialDate}
                    onChange={e => setGregBurialDate(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="showGregorian" 
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                checked={formData.showGregorian}
                onChange={e => setFormData({...formData, showGregorian: e.target.checked})}
              />
              <label htmlFor="showGregorian" className="text-sm text-slate-700">הצג תאריכים לועזיים במסך האירוע</label>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">הוסף תמונת הנפטר (אופציונלי)</label>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImageChange}
              />
              <div 
                onClick={handleImageClick}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition cursor-pointer hover:border-blue-300 relative overflow-hidden h-32"
              >
                {selectedImage ? (
                  <img 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="תמונה נבחרת" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                ) : null}
                <Camera className={`w-8 h-8 mb-2 ${selectedImage ? 'text-white drop-shadow-md relative z-10' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${selectedImage ? 'text-white drop-shadow-md relative z-10' : ''}`}>
                  {selectedImage ? 'החלף תמונה' : 'לחץ לבחירת תמונה'}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-semibold text-blue-900">פרטי המארגן</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם המארגן</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.organizerName}
                onChange={e => setFormData({...formData, organizerName: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">טלפון נייד</label>
              <input 
                type="tel" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.organizerPhone}
                onChange={e => setFormData({...formData, organizerPhone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">כתובת דוא"ל</label>
              <input 
                type="email" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.organizerEmail}
                onChange={e => setFormData({...formData, organizerEmail: e.target.value})}
              />
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">קישור לקבוצת וואצפ (אופציונלי)</label>
              <input 
                type="url" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-left"
                placeholder="https://chat.whatsapp.com/..."
                dir="ltr"
                value={formData.whatsappGroup}
                onChange={e => setFormData({...formData, whatsappGroup: e.target.value})}
              />
            </div>
          </section>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center bg-blue-600 text-white font-medium text-lg py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isEditMode ? (
              "שמור שינויים"
            ) : (
              "פתח אירוע לימוד"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateEvent />
    </Suspense>
  );
}
