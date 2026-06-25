import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { HDate } from '@hebcal/core';

interface DailyLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  learningRows: Array<{ tractate: string, uncompletedChapters: number[] }>;
  targetDateStr: string | undefined;
  passingDateStr: string | undefined;
}

export default function DailyLearningModal({ isOpen, onClose, learningRows, targetDateStr, passingDateStr }: DailyLearningModalProps) {
  const [schedule, setSchedule] = useState<{date: string, hebrewDate: string, displayChapters: string[]}[]>([]);
  const [showGregorian, setShowGregorian] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let target = targetDateStr ? new Date(targetDateStr) : undefined;
    if (!target && passingDateStr) {
      const passHDate = new HDate(new Date(passingDateStr));
      target = passHDate.add(29, 'd').greg();
    }
    
    if (!target) {
       setSchedule([]);
       return;
    }
    target.setHours(0, 0, 0, 0);

    const validDays: Date[] = [];
    let current = new Date(today);
    
    while (current <= target) {
      if (current.getDay() !== 6) { // 0=Sun, 1=Mon, ..., 5=Fri
        validDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    const allChapters: { tractate: string, chapter: number }[] = [];
    learningRows.forEach(row => {
      row.uncompletedChapters.forEach(ch => {
        allChapters.push({ tractate: row.tractate, chapter: ch });
      });
    });

    if (validDays.length === 0 || allChapters.length === 0) {
      setSchedule([]);
      return;
    }

    const totalChapters = allChapters.length;
    const chaptersPerDay = totalChapters / validDays.length;
    
    const newSchedule: {date: string, hebrewDate: string, displayChapters: string[]}[] = [];
    let currentChapterIndex = 0;
    
    for (let i = 0; i < validDays.length; i++) {
       const date = validDays[i];
       const hDate = new HDate(date);
       
       let endChapterIndex = Math.round((i + 1) * chaptersPerDay);
       if (i === validDays.length - 1) endChapterIndex = totalChapters; 
       
       const dayChapters = allChapters.slice(currentChapterIndex, endChapterIndex);
       
       // Group dayChapters by tractate
       const grouped: Record<string, number[]> = {};
       dayChapters.forEach(ch => {
          if (!grouped[ch.tractate]) grouped[ch.tractate] = [];
          grouped[ch.tractate].push(ch.chapter);
       });
       
       const displayChapters: string[] = [];
       Object.keys(grouped).forEach(t => {
          const chs = grouped[t];
          if (chs.length === 1) {
             displayChapters.push(`מסכת ${t}: פרק ${getHebrew(chs[0] + 1)}`);
          } else {
             displayChapters.push(`מסכת ${t}: פרקים ${getHebrew(chs[0] + 1)}-${getHebrew(chs[chs.length - 1] + 1)}`);
          }
       });
       
       newSchedule.push({
         date: date.toLocaleDateString('he-IL', { weekday: 'short', month: 'numeric', day: 'numeric' }),
         hebrewDate: hDate.renderGematriya(true),
         displayChapters
       });
       
       currentChapterIndex = endChapterIndex;
    }

    setSchedule(newSchedule);
  }, [isOpen, learningRows, targetDateStr, passingDateStr]);

  const getHebrew = (num: number) => {
    const letters = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ", "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"];
    return letters[num] || num.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">לימוד יומי</h2>
              <p className="text-blue-100 mt-1">תוכנית לחלוקת כלל הפרקים לימים הנותרים</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 print:hidden">
          {schedule.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              אין פרקים זמינים ללמידה או שתאריך היעד כבר עבר.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium mb-4 flex justify-between items-center">
                <span>התוכנית חולקה ל-{schedule.length} ימי חול. השתדל לעמוד בקצב!</span>
                <label className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-200 cursor-pointer shadow-sm">
                  <input type="checkbox" checked={showGregorian} onChange={(e) => setShowGregorian(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                  הצג לועזי
                </label>
              </div>
              {schedule.map((day, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 rounded-lg transition">
                  <div className="flex flex-col w-1/3">
                    <div className="font-bold text-slate-800">{day.hebrewDate}</div>
                    {showGregorian && <div className="text-xs text-slate-500">{day.date}</div>}
                  </div>
                  <div className="flex flex-col gap-1 items-end w-2/3">
                    {day.displayChapters.map((ch, idx) => (
                      <div key={idx} className="font-bold text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                        {ch}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Printable Table */}
        <div className="hidden print:block bg-white p-8 font-serif" dir="rtl">
           <div className="text-center mb-6">
             <h2 className="text-2xl font-bold mb-2">לימוד יומי - חלוקת פרקים</h2>
           </div>
           <table className="w-full text-right border-collapse border-2 border-black text-sm">
             <thead>
               <tr>
                 <th className="border border-black p-2 bg-slate-100 w-1/3 font-bold">תאריך</th>
                 <th className="border border-black p-2 bg-slate-100 w-2/3 font-bold">הלימוד היומי</th>
               </tr>
             </thead>
             <tbody>
               {schedule.map((day, i) => (
                 <tr key={i}>
                   <td className="border border-black p-2 align-top">
                     <div className="font-bold">{day.hebrewDate}</div>
                     {showGregorian && <div className="text-xs">{day.date}</div>}
                   </td>
                   <td className="border border-black p-2 align-top">
                     {day.displayChapters.map((ch, idx) => (
                       <div key={idx} className="font-bold">{ch}</div>
                     ))}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
        
        <div className="p-4 border-t bg-slate-50 shrink-0 flex justify-between print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium px-4 py-2">
            <Printer className="w-4 h-4" /> הדפס תוכנית
          </button>
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
