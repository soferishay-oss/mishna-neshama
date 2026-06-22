"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, PlusCircle, Trophy } from "lucide-react";
import { motion } from "framer-motion";
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
              {editMode ? "עדכון פרטי האירוע והגדרות הלימוד" : "מערכת דיגיטלית שיתופית לניהול לימוד משניות לעילוי נשמת"}
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

            <Link href="/my-learning" className="flex items-center justify-center w-full bg-amber-50 text-amber-700 py-4 px-6 rounded-2xl font-bold text-lg hover:bg-amber-100 border border-amber-200 transition-all shadow-sm active:scale-[0.98] mt-4">
              <Trophy className="ml-2 w-6 h-6 text-amber-500" />
              האזור האישי - הלימודים שלי
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={async () => {
                const pass = prompt("לכניסת מנהל מערכת, הקלד סיסמה. למארגן אירוע, הקלד מספר טלפון:");
                if (!pass) return;
                // Fetch to check admin password or organizer
                try {
                  let adminPassword = "4614320";
                  let foundEventId = null;
                  if (isMockMode) {
                    const res = await fetch("/api/mockdb");
                    const data = await res.json();
                    adminPassword = data.system_texts?.adminPassword || "4614320";
                    const events = data.events || {};
                    for (const [id, ev] of Object.entries(events) as any) {
                      if (ev.organizerPhone && ev.organizerPhone.replace(/\D/g, '') === pass.replace(/\D/g, '')) {
                        foundEventId = id; break;
                      }
                    }
                  } else {
                    const snap = await get(ref(db));
                    if (snap.exists()) {
                      const dbData = snap.val();
                      adminPassword = dbData.system_texts?.adminPassword || "4614320";
                      const events = dbData.events || {};
                      for (const [id, ev] of Object.entries(events) as any) {
                        if (ev.organizerPhone && ev.organizerPhone.replace(/\D/g, '') === pass.replace(/\D/g, '')) {
                          foundEventId = id; break;
                        }
                      }
                    }
                  }

                  if (pass === adminPassword) {
                    sessionStorage.setItem('adminAuth', 'true');
                    router.push("/admin");
                    return;
                  }

                  if (foundEventId) {
                    const orgEvents = JSON.parse(localStorage.getItem("organizedEvents") || "[]");
                    if (!orgEvents.includes(foundEventId)) {
                      orgEvents.push(foundEventId);
                      localStorage.setItem("organizedEvents", JSON.stringify(orgEvents));
                    }
                    router.push(`/event/${foundEventId}`);
                  } else {
                    alert("שגיאה: הסיסמה שגויה, או שלא נמצאו אירועים עבור מספר טלפון זה.");
                  }
                } catch (e) {
                  alert("שגיאה בהתחברות.");
                }
              }} 
              className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              כניסת מנהל מערכת / מארגן
            </button>
          </div>

          <footer className="mt-16 text-slate-400 text-sm">
            פותח על ידי <span className="font-medium text-slate-500">א.ס. פתרונות מחשוב</span>
          </footer>
        </motion.main>
      )}
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
