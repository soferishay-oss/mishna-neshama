import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { HDate } from '@hebcal/core';

interface DailyLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  tractate: string;
  totalChapters: number;
  targetDateStr: string | undefined;
  passingDateStr: string | undefined;
}

export default function DailyLearningModal({ isOpen, onClose, tractate, totalChapters, targetDateStr, passingDateStr }: DailyLearningModalProps) {
  const [schedule, setSchedule] = useState<{date: string, hebrewDate: string, chapters: string}[]>([]);

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

    if (validDays.length === 0) {
      setSchedule([]);
      return;
    }

    const chaptersPerDay = totalChapters / validDays.length;
    
    let currentChapter = 1;
    const newSchedule: {date: string, hebrewDate: string, chapters: string}[] = [];
    
    for (let i = 0; i < validDays.length; i++) {
       const date = validDays[i];
       const hDate = new HDate(date);
       
       let endChapter = currentChapter + chaptersPerDay;
       if (i === validDays.length - 1) endChapter = totalChapters + 1; 
       
       let chStart = Math.floor(currentChapter);
       let chEnd = Math.floor(endChapter - 0.001); 
       
       let text = "";
       if (chStart === chEnd) {
          text = `פרק ${getHebrew(chStart)}`;
       } else {
          text = `פרק ${getHebrew(chStart)} - ${getHebrew(chEnd)}`;
       }
       
       newSchedule.push({
         date: date.toLocaleDateString('he-IL', { weekday: 'short', month: 'numeric', day: 'numeric' }),
         hebrewDate: hDate.renderGematriya(true),
         chapters: text
       });
       
       currentChapter = endChapter;
    }

    setSchedule(newSchedule);
  }, [isOpen, tractate, totalChapters, targetDateStr, passingDateStr]);

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
              <h2 className="text-2xl font-bold">משנה יומית</h2>
              <p className="text-blue-100 mt-1">תוכנית לימוד אישית למסכת {tractate}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 print:p-0">
          {schedule.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              לא נותרו מספיק ימי חול עד לתאריך היעד או שתאריך היעד כבר עבר.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium mb-4 print:hidden">
                התוכנית חולקה ל-{schedule.length} ימי חול (ללא ימי שבת). השתדל לעמוד בקצב!
              </div>
              {schedule.map((day, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 rounded-lg transition">
                  <div>
                    <div className="font-bold text-slate-800">{day.date}</div>
                    <div className="text-xs text-slate-500">{day.hebrewDate}</div>
                  </div>
                  <div className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg print:bg-transparent print:border print:border-slate-300">
                    {day.chapters}
                  </div>
                </div>
              ))}
            </div>
          )}
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
