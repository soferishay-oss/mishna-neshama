"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, PlusCircle, Trophy, Heart, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { db, isMockMode } from "@/lib/firebase";
import { ref, get } from "firebase/database";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setMounted(true);
    const hasSeenSplash = sessionStorage.getItem("splashShown");
    if (hasSeenSplash) {
      setShowSplash(false);
    }
    
    if (editId) {
      setEditMode(true);
    }
  }, [editId]);

  const handleSplashFinish = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  if (!mounted) return null;

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      {!showSplash && (
        <motion.main 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto"
        >
          <div className="mb-10">
            <div className="bg-blue-100 p-4 rounded-full inline-block mb-6 shadow-sm">
              <BookOpen className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              {editMode ? "עריכת אירוע לימוד" : "משנה-נשמה"}
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              {editMode ? "עדכון פרטי האירוע והגדרות הלימוד" : "מערכת דיגיטלית שיתופית לניהול לימוד משניות לעילוי נשמה"}
            </p>
          </div>

          <div className="w-full space-y-4">
            <Link href={editMode ? `/create?edit=${editId}` : "/create"} className="flex items-center justify-center w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-medium text-lg hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]">
              <PlusCircle className="ml-2 w-6 h-6" />
              {editMode ? "ערוך פרטי אירוע" : "צור אירוע לימוד חדש"}
            </Link>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">או</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <Link href="/join" className="flex items-center justify-center w-full bg-white text-blue-600 py-4 px-6 rounded-2xl font-medium text-lg hover:bg-blue-50 border border-blue-200 transition-all shadow-sm active:scale-[0.98]">
              <Users className="ml-2 w-6 h-6" />
              הצטרף לאירוע קיים
            </Link>

            <button 
              onClick={() => {
                setShowOrganizerModal(true);
                setOrganizerPhone("");
                setLoginError("");
              }}
              className="flex items-center justify-center w-full bg-slate-100 text-slate-700 py-4 px-6 rounded-2xl font-medium text-lg hover:bg-slate-200 border border-slate-200 transition-all shadow-sm active:scale-[0.98] mt-4"
            >
              <ShieldCheck className="ml-2 w-6 h-6 text-slate-500" />
              כניסת מארגן לאירוע קיים
            </button>

            <Link href="/tools" className="flex items-center justify-center w-full bg-teal-50 text-teal-700 py-4 px-6 rounded-2xl font-medium text-lg hover:bg-teal-100 border border-teal-200 transition-all shadow-sm active:scale-[0.98] mt-4">
              <Heart className="ml-2 w-6 h-6 text-teal-500" />
              עזרים לאבלים ולמנחמים
            </Link>

            <Link href="/my-learning" className="flex items-center justify-center w-full bg-amber-50 text-amber-700 py-4 px-6 rounded-2xl font-bold text-lg hover:bg-amber-100 border border-amber-200 transition-all shadow-sm active:scale-[0.98] mt-4">
              <Trophy className="ml-2 w-6 h-6 text-amber-500" />
              האזור האישי - הלימודים שלי
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            {/* Unified login button removed */}
          </div>

          <footer className="mt-16 text-slate-400 text-sm">
            פותח על ידי <span className="font-medium text-slate-500">א.ס. פתרונות מחשוב</span>
          </footer>
        </motion.main>
      )}

      <AnimatePresence>
        {showOrganizerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-800">כניסת מארגן אירוע</h3>
                <button onClick={() => setShowOrganizerModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <p className="text-slate-500 mb-6 text-sm">הזן את מספר הטלפון איתו פתחת את האירוע.</p>
              
              <input 
                type="tel"
                value={organizerPhone}
                onChange={(e) => { setOrganizerPhone(e.target.value); setLoginError(""); }}
                placeholder="מספר טלפון"
                className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-lg mb-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium tracking-wider"
                autoFocus
              />
              
              <div className="min-h-[24px] mb-4 text-center">
                 {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}
              </div>
              
              <button 
                onClick={async () => {
                  if (!organizerPhone) return;
                  try {
                    let foundEventId = null;
                    if (isMockMode) {
                      const res = await fetch("/api/mockdb");
                      const data = await res.json();
                      const events = data.events || {};
                      for (const [id, ev] of Object.entries(events) as any) {
                        if (ev.organizerPhone && ev.organizerPhone.replace(/\D/g, '') === organizerPhone.replace(/\D/g, '')) {
                          foundEventId = id; break;
                        }
                      }
                    } else {
                      const snap = await get(ref(db));
                      if (snap.exists()) {
                        const dbData = snap.val();
                        const events = dbData.events || {};
                        for (const [id, ev] of Object.entries(events) as any) {
                          if (ev.organizerPhone && ev.organizerPhone.replace(/\D/g, '') === organizerPhone.replace(/\D/g, '')) {
                            foundEventId = id; break;
                          }
                        }
                      }
                    }

                    if (foundEventId) {
                      const orgEvents = JSON.parse(localStorage.getItem("organizedEvents") || "[]");
                      if (!orgEvents.includes(foundEventId)) {
                        orgEvents.push(foundEventId);
                        localStorage.setItem("organizedEvents", JSON.stringify(orgEvents));
                      }
                      setShowOrganizerModal(false);
                      router.push(`/event/${foundEventId}`);
                    } else {
                      setLoginError("לא נמצאו אירועים עבור מספר זה.");
                    }
                  } catch (e) {
                    setLoginError("שגיאה בהתחברות.");
                  }
                }}
                className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md"
              >
                כניסה
                <ShieldCheck className="mr-2 w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">טוען...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
