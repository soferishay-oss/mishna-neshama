import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Download } from 'lucide-react';
import { EventData } from '@/lib/events';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tractate: string;
  event: EventData | null;
  eventId: string;
}

export default function CalendarModal({ isOpen, onClose, tractate, event, eventId }: CalendarModalProps) {
  const [reminderType, setReminderType] = useState('1week');
  const [recurringDays, setRecurringDays] = useState(3);

  if (!isOpen || !event) return null;

  const handleDownloadICS = () => {
    let targetDateStr = event.shloshimDateStr || event.yahrzeitDateStr || event.passingDate;
    if (!targetDateStr) {
       alert("לא הוגדר תאריך יעד לאירוע זה.");
       return;
    }
    const targetDate = new Date(targetDateStr);
    const dtstart = targetDate.toISOString().replace(/[-:]/g, '').substring(0,8);
    
    const eventName = `סיום מסכת ${tractate} - ${event.deceasedName}`;
    const description = `תזכורת לסיום מסכת ${tractate} לעילוי נשמת ${event.deceasedTitle ? event.deceasedTitle + ' ' : ''}${event.deceasedName}.\\n\\nקישור ללימוד:\\n${window.location.origin}/event/${eventId}`;

    let alarm = '';
    if (reminderType === '1week') {
      alarm = `BEGIN:VALARM\\nTRIGGER:-P1W\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת: בעוד שבוע יעד סיום מסכת ${tractate}\\nEND:VALARM`;
    } else if (reminderType === '1day') {
      alarm = `BEGIN:VALARM\\nTRIGGER:-P1D\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת: מחר יעד סיום מסכת ${tractate}\\nEND:VALARM`;
    } else if (reminderType === '3days') {
      alarm = `BEGIN:VALARM\\nTRIGGER:-P3D\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת: בעוד 3 ימים יעד סיום מסכת ${tractate}\\nEND:VALARM`;
    } else if (reminderType === 'daily') {
      // Actually creating a daily recurring alarm is complex in ICS, we'll just add multiple alarms
      alarm = `BEGIN:VALARM\\nTRIGGER:-P1W\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת סיום מסכת\\nEND:VALARM\\nBEGIN:VALARM\\nTRIGGER:-P5D\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת סיום מסכת\\nEND:VALARM\\nBEGIN:VALARM\\nTRIGGER:-P3D\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת סיום מסכת\\nEND:VALARM\\nBEGIN:VALARM\\nTRIGGER:-P1D\\nACTION:DISPLAY\\nDESCRIPTION:תזכורת מחר סיום מסכת\\nEND:VALARM`;
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mishna Neshama//HE
BEGIN:VEVENT
UID:${Date.now()}@mishna-neshama.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').substring(0,15)}Z
DTSTART;VALUE=DATE:${dtstart}
SUMMARY:${eventName}
DESCRIPTION:${description}
${alarm}
BEGIN:VALARM
TRIGGER:-PT9H
ACTION:DISPLAY
DESCRIPTION:היום יעד סיום מסכת ${tractate}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `siyum_${tractate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onClose();
  };

  const handleGoogleCalendar = () => {
    let targetDateStr = event.shloshimDateStr || event.yahrzeitDateStr || event.passingDate;
    if (!targetDateStr) {
       alert("לא הוגדר תאריך יעד לאירוע זה.");
       return;
    }
    const finalTargetDate = new Date(targetDateStr);
    finalTargetDate.setHours(0,0,0,0);
    
    let eventDate = new Date(finalTargetDate);
    let eventName = "";
    let rrule = "";

    if (reminderType === '1week') {
      eventDate.setDate(eventDate.getDate() - 7);
      eventName = `נותר שבוע לסיום מסכת ${tractate} - ${event.deceasedName}`;
    } else if (reminderType === '3days') {
      eventDate.setDate(eventDate.getDate() - 3);
      eventName = `נותרו 3 ימים לסיום מסכת ${tractate} - ${event.deceasedName}`;
    } else if (reminderType === '1day') {
      eventDate.setDate(eventDate.getDate() - 1);
      eventName = `מחר יעד סיום מסכת ${tractate} - ${event.deceasedName}`;
    } else if (reminderType === 'recurring') {
      eventDate = new Date(); // start today
      eventName = `תזכורת ללימוד מסכת ${tractate} לעילוי נשמת ${event.deceasedName} עד יום היעד`;
      const untilDate = new Date(finalTargetDate);
      untilDate.setDate(untilDate.getDate() + 1);
      const dtendRecur = untilDate.toISOString().replace(/[-:]/g, '').substring(0,8);
      rrule = `&recur=RRULE:FREQ=DAILY;INTERVAL=${recurringDays};UNTIL=${dtendRecur}`;
    }

    const dtstart = eventDate.toISOString().replace(/[-:]/g, '').substring(0,8);
    // For full day event in Google calendar, end date must be the next day
    const endDate = new Date(eventDate);
    endDate.setDate(endDate.getDate() + 1);
    const dtend = endDate.toISOString().replace(/[-:]/g, '').substring(0,8);
    
    const description = `תזכורת ללימוד מסכת ${tractate} לעילוי נשמת ${event.deceasedTitle ? event.deceasedTitle + ' ' : ''}${event.deceasedName}.\\n\\nקישור ללימוד:\\n${window.location.origin}/event/${eventId}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventName)}&dates=${dtstart}/${dtend}&details=${encodeURIComponent(description)}${rrule}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 p-4 rounded-full mb-3">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">הוסף ליומן</h2>
            <p className="text-blue-100 mt-1 text-sm">קבל תזכורת לסיום מסכת {tractate}</p>
          </div>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">מתי תרצה לקבל תזכורת?</label>
          <select 
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none mb-4"
          >
            <option value="1week">שבוע לפני תאריך היעד</option>
            <option value="3days">3 ימים לפני תאריך היעד</option>
            <option value="1day">יום לפני תאריך היעד</option>
            <option value="recurring">כל כמה ימים (מרובה)</option>
          </select>
          
          {reminderType === 'recurring' && (
            <div className="mb-4">
               <label className="block text-sm font-bold text-slate-700 mb-2">כל כמה ימים?</label>
               <input 
                 type="number" 
                 min="1" 
                 value={recurringDays} 
                 onChange={(e) => setRecurringDays(Math.max(1, parseInt(e.target.value) || 1))}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
               />
            </div>
          )}

          <div className="space-y-3">
            <button onClick={handleGoogleCalendar} className="w-full bg-slate-800 text-white rounded-xl py-3 font-bold text-lg hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-sm">
              <CalendarIcon className="w-5 h-5" />
              הוסף ל-Google Calendar
            </button>
            <button onClick={handleDownloadICS} className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm">
              <Download className="w-5 h-5" />
              הורד ל-Apple / Outlook
            </button>
          </div>
          {reminderType === 'recurring' ? (
             <p className="text-center text-xs text-slate-500 mt-4">
               * ייצור אירוע מחזורי ביומן שחוזר כל {recurringDays} ימים עד תאריך היעד.
             </p>
          ) : (
             <p className="text-center text-xs text-slate-500 mt-4">
               * יומן גוגל ייפתח בדפדפן וייצור את האירוע ביום המבוקש.
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
