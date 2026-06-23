"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"emerge" | "mishna" | "neshama" | "fly" | "done">("emerge");

  // משנה -> מ ש נ ה
  const mishnaOrder = [
    { id: "m", char: "מ" },
    { id: "sh", char: "ש" },
    { id: "n", char: "נ" },
    { id: "h", char: "ה" },
  ];

  // נשמה -> נ ש מ ה
  const neshamaOrder = [
    { id: "n", char: "נ" },
    { id: "sh", char: "ש" },
    { id: "m", char: "מ" },
    { id: "h", char: "ה" },
  ];

  const currentOrder = phase === "mishna" || phase === "emerge" ? mishnaOrder : neshamaOrder;

  useEffect(() => {
    // 0. Letters emerge from the book
    const t0 = setTimeout(() => {
      setPhase("mishna");
    }, 500);

    // 1. Show 'משנה' briefly, then trigger the swap
    const t1 = setTimeout(() => {
      setPhase("neshama");
    }, 1800);

    // 2. Wait for swap animation to finish, then trigger the fly up
    const t2 = setTimeout(() => {
      setPhase("fly");
    }, 3200);

    // 3. After flying up, finish the splash
    const t3 = setTimeout(() => {
      setPhase("done");
      onFinish();
    }, 4200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  if (phase === "done") return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDFBF7] overflow-hidden"
    >
      <div className="relative flex flex-col items-center justify-center h-full w-full">
        <AnimatePresence>
          {phase !== "fly" && (
            <motion.div
              key="word"
              initial={{ y: 80, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -200, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-row text-6xl md:text-8xl font-black bg-gradient-to-l from-blue-700 via-blue-500 to-amber-500 bg-clip-text text-transparent tracking-wider mb-8 z-10 drop-shadow-sm pb-4"
              dir="rtl"
            >
              {currentOrder.map((letter) => (
                <motion.span
                  key={letter.id}
                  layout
                  transition={{ type: "spring", stiffness: 60, damping: 14 }}
                  className="inline-block"
                >
                  {letter.char}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase !== "fly" && (
            <motion.div
              key="book"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
              transition={{ duration: 1 }}
              className="absolute mt-32 z-0"
            >
              <BookOpen className="w-24 h-24 text-blue-200 opacity-60" strokeWidth={1.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
