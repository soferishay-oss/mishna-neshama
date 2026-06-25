"use client";

import React, { useEffect, useState, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, onValue, update, remove, get } from "firebase/database";
import { db, isMockMode } from "@/lib/firebase";
import { HDate } from "@hebcal/core";
import { EventData } from "@/lib/events";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Users, Share2, MessageCircle, BookOpen, CheckCircle2, Trash2, Undo2, X, Link as LinkIcon, Mail, Copy, ListTree, PlayCircle, Info, Settings, Menu, Home, PlusCircle, Settings2, Briefcase, ChevronDown, Download, ImageIcon, Trophy, Flame, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import { SEDARIM, TRACTATE_CHAPTERS, getHebrewChapter } from "@/lib/tractates";
import Link from "next/link";
import AdditionsHub from "@/components/AdditionsHub";
import NoticeHub from "@/components/NoticeHub";
import DailyLearningModal from "@/components/DailyLearningModal";
import CalendarModal from "@/components/CalendarModal";
import { downloadCSV } from "@/lib/exportUtils";
import { generateCompletionPoster } from "@/lib/posterGenerator";
import { DEFAULT_SYSTEM_TEXTS } from "@/lib/defaultTexts";

function getInitials(name: string) {
  if (!name) return "";
  return name.split(' ').map(n => n[0]).join('. ') + '.';
}

export default function EventPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [tractatesData, setTractatesData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [isOrganizerRole, setIsOrganizerRole] = useState(false);
  const [activeView, setActiveView] = useState<'learning' | 'additions' | 'notice' | 'organizer' | 'settings' | 'about'>('learning');
  const [showSidebar, setShowSidebar] = useState(false);
  const [systemTexts, setSystemTexts] = useState<any>(DEFAULT_SYSTEM_TEXTS);
  
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [participantProfile, setParticipantProfile] = useState<any>(null);

  // Admin login state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState(false);
  
  const [isPrintingEmptyTable, setIsPrintingEmptyTable] = useState(false);

  const [selectedTractateForCalendar, setSelectedTractateForCalendar] = useState<string | null>(null);
  const [selectedTractateForDaily, setSelectedTractateForDaily] = useState<string | null>(null);
  const [selectedTractateTotalChapters, setSelectedTractateTotalChapters] = useState(0);

  const [manualAssignName, setManualAssignName] = useState("");
  const [quickAssignNames, setQuickAssignNames] = useState<Record<string, string>>({});
  
  const checkIsOrganizer = (profile: any, eventData: any) => {
    if (!profile || !eventData) return false;
    let matches = 0;
    if (profile.name && eventData.organizerName && profile.name.trim() === eventData.organizerName.trim()) matches++;
    if (profile.phone && eventData.organizerPhone && profile.phone.trim() === eventData.organizerPhone.trim()) matches++;
    if (profile.email && eventData.organizerEmail && profile.email.trim() === eventData.organizerEmail.trim()) matches++;
    return matches >= 2;
  };

  const [knownProfiles, setKnownProfiles] = useState<any[]>([]);
  const [showNewLearnerForm, setShowNewLearnerForm] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [selectedTractate, setSelectedTractate] = useState<string | null>(null);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);

  const [showOrganizerTractateModal, setShowOrganizerTractateModal] = useState<string | null>(null);

  // Modals state
  const [showShareModal, setShowShareModal] = useState(false);
  const [commsTemplate, setCommsTemplate] = useState("general");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    const organizedEvents = JSON.parse(localStorage.getItem("organizedEvents") || "[]");
    const createdHere = organizedEvents.includes(id);
    setIsOrganizerRole(createdHere);

    const savedView = localStorage.getItem(`activeView_${id}`);
    if (savedView) {
      setActiveView(savedView as any);
    } else if (createdHere) {
      setActiveView('organizer');
    }

    const profileStr = localStorage.getItem("participantProfile");
    const profile = profileStr ? JSON.parse(profileStr) : null;
    
    const savedProfiles = JSON.parse(localStorage.getItem("knownProfiles") || "[]");
    setKnownProfiles(savedProfiles);
    if (savedProfiles.length === 0) {
      setShowNewLearnerForm(true);
    }
    
    if (!profile?.name && !createdHere) {
      setShowJoinForm(true);
    } else if (profile) {
      setParticipantProfile(profile);
    }

    let unsubscribe: any = null;

    const fetchMockData = async () => {
      try {
        const res = await fetch(`/api/mockdb`);
        const allData = await res.json();
        const data = allData?.events?.[id as string];
        if (!data) {
          router.push("/");
          return;
        }

        if (data.isArchived) {
           alert("אירוע זה נמחק על ידי המארגן ולא ניתן לגשת אליו יותר.");
           router.push("/");
           return;
        }
        
        setEvent(data);
          setTractatesData(data.tractates || {});
          
          const profileStr = localStorage.getItem("participantProfile");
          if (profileStr) {
            const profile = JSON.parse(profileStr);
            setIsOrganizerRole(checkIsOrganizer(profile, data));
          } else {
            setIsOrganizerRole(createdHere);
          }
        if (allData?.system_texts) {
          setSystemTexts(allData.system_texts);
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    if (isMockMode) {
      fetchMockData();
    } else {
      const dbRef = ref(db, `events/${id}`);
      unsubscribe = onValue(dbRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setEvent(data);
          setTractatesData(data.tractates || {});
          
          const sysRef = ref(db, `system_texts`);
          const sysSnap = await get(sysRef);
          if (sysSnap.exists()) {
            setSystemTexts(sysSnap.val());
          }
          
          if (data.isArchived) {
             alert("אירוע זה נמחק על ידי המארגן ולא ניתן לגשת אליו יותר.");
             router.push("/");
             return;
          }

          const profileStr = localStorage.getItem("participantProfile");
          if (profileStr) {
            const profile = JSON.parse(profileStr);
            const isNowOrg = checkIsOrganizer(profile, data);
            setIsOrganizerRole(isNowOrg);
            if (isNowOrg) {
              if (!localStorage.getItem(`activeView_${id}`)) {
                setActiveView('organizer');
              }
            }
          } else {
             setIsOrganizerRole(createdHere);
          }
        } else {
          router.push("/");
        }
        setLoading(false);
      }, (error) => {
        console.error("Firebase onValue error:", error);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const refreshMockData = async () => {
    if (!isMockMode) return;
    try {
      const res = await fetch(`/api/mockdb`);
      const allData = await res.json();
      const data = allData?.events?.[id as string];
      if (data) {
        setEvent(data);
        setTractatesData(data.tractates || {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetView = (view: typeof activeView) => {
    setActiveView(view);
    localStorage.setItem(`activeView_${id}`, view);
    setShowSidebar(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = systemTexts?.adminPassword || DEFAULT_SYSTEM_TEXTS.adminPassword;
    if (adminPasswordInput === correctPassword) {
      sessionStorage.setItem('adminAuth', 'true');
      router.push('/admin');
    } else {
      setAdminLoginError(true);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !joinPhone.trim()) return;
    
    const profile = { name: joinName, phone: joinPhone, email: joinEmail };
    const updatedProfiles = [...knownProfiles.filter((p: any) => p.phone !== joinPhone), profile];
    localStorage.setItem("knownProfiles", JSON.stringify(updatedProfiles));
    setKnownProfiles(updatedProfiles);
    
    localStorage.setItem("participantProfile", JSON.stringify(profile));
    setParticipantProfile(profile);
    
    if (event) {
      const isNowOrg = checkIsOrganizer(profile, event);
      setIsOrganizerRole(isNowOrg);
      if (isNowOrg) {
        handleSetView('organizer');
      } else {
        handleSetView('learning');
      }
    }
    
    setShowJoinForm(false);
  };

  const handleTakeTractateFull = async (tractateName: string) => {
    if (!participantProfile || !participantProfile.name) {
      alert("יש להזין שם כדי לקחת מסכת");
      setShowJoinForm(true);
      return;
    }

    const totalChapters = TRACTATE_CHAPTERS[tractateName];
    const updates: any = {};
    
    const takerData = {
      takerName: participantProfile.name,
      takerPhone: participantProfile.phone || "",
      takerEmail: participantProfile.email || "",
      takerId: user?.uid || "anon",
      takenAt: new Date().toISOString(),
      isCompleted: false
    };

    for (let i = 0; i < totalChapters; i++) {
      const currentChapter = tractatesData[tractateName]?.chapters?.[i];
      if (!currentChapter) {
        updates[`events/${id}/tractates/${tractateName}/chapters/${i}`] = takerData;
      }
    }
    
    if (Object.keys(updates).length === 0) return;

    if (isMockMode) {
      await fetch('/api/mockdb', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setSelectedTractate(null);
      refreshMockData();
      return;
    }

    await update(ref(db), updates);
    setSelectedTractate(null);
  };

  const handleTakeSelectedChapters = async () => {
    if (!selectedTractate || selectedChapters.length === 0) return;
    
    let assignName = participantProfile?.name;
    let assignPhone = participantProfile?.phone || "";
    let assignEmail = participantProfile?.email || "";

    if (isOrganizerRole && activeView === 'organizer' && manualAssignName.trim() !== "") {
      assignName = manualAssignName.trim();
      assignPhone = ""; 
      assignEmail = "";
    }

    if (!assignName) {
      alert("יש להזין שם כדי לקחת פרקים");
      setShowJoinForm(true);
      return;
    }

    const updates: any = {};
    const takerData = {
      takerName: assignName,
      takerPhone: assignPhone,
      takerEmail: assignEmail,
      takerId: user?.uid || "anon",
      takenAt: new Date().toISOString(),
      isCompleted: false
    };

    for (const ch of selectedChapters) {
      updates[`events/${id}/tractates/${selectedTractate}/chapters/${ch}`] = takerData;
    }

    if (isMockMode) {
      await fetch('/api/mockdb', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setShowChaptersModal(false);
      setSelectedTractate(null);
      setSelectedChapters([]);
      refreshMockData();
      return;
    }

    await update(ref(db), updates);
    setShowChaptersModal(false);
    setSelectedTractate(null);
    setSelectedChapters([]);
    setManualAssignName("");
  };

  const handleReleaseChapter = async (tractateName: string, chIndex: number) => {
    if (!confirm(`האם ברצונך לבטל את בחירת פרק ${getHebrewChapter(chIndex)} במסכת ${tractateName}?`)) return;
    
    if (isMockMode) {
      await fetch(`/api/mockdb?path=events/${id}/tractates/${tractateName}/chapters/${chIndex}`, { method: 'DELETE' });
      refreshMockData();
    } else {
      await remove(ref(db, `events/${id}/tractates/${tractateName}/chapters/${chIndex}`));
    }
  };

  const handleReleaseTractateComplete = async (tractateName: string) => {
    if (!confirm(`האם ברצונך לבטל את ההתחייבות לפרקים שטרם נלמדו במסכת ${tractateName}?`)) return;
    
    const chaptersObj = tractatesData[tractateName]?.chapters || {};
    const updates: any = {};
    const deletePromises: any[] = [];
    
    Object.keys(chaptersObj).forEach(ch => {
        const c = chaptersObj[ch];
        if (participantProfile && c.takerName === participantProfile.name && c.takerPhone === participantProfile.phone && !c.isCompleted) {
            if (isMockMode) {
              deletePromises.push(fetch(`/api/mockdb?path=events/${id}/tractates/${tractateName}/chapters/${ch}`, { method: 'DELETE' }));
            } else {
              updates[`events/${id}/tractates/${tractateName}/chapters/${ch}`] = null;
            }
        }
    });

    if (deletePromises.length === 0 && Object.keys(updates).length === 0) {
      alert("אין פרקים פנויים לביטול (כל הפרקים שלקחת כבר נלמדו).");
      return;
    }

    if (isMockMode) {
      await Promise.all(deletePromises);
      refreshMockData();
    } else {
      await update(ref(db), updates);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את האירוע? האירוע יוסתר מכלל המשתתפים. (מחיקה לצמיתות מתבצעת על ידי מנהל המערכת בלבד).")) return;
    
    if (!isMockMode) {
      await update(ref(db, `events/${id}`), { isArchived: true });
    } else {
      await fetch(`/api/mockdb?path=events/${id}/isArchived`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(true)
      });
    }
    
    const organizedEvents = JSON.parse(localStorage.getItem("organizedEvents") || "[]");
    const updatedEvents = organizedEvents.filter((eId: string) => eId !== id);
    localStorage.setItem("organizedEvents", JSON.stringify(updatedEvents));
    
    router.push("/");
  };

  const handleAssignFullTractate = async (displayTractate: string) => {
    const learnerName = quickAssignNames[displayTractate] || "";
    if (!learnerName.trim()) return;
    if (!confirm(`האם להקצות את ${displayTractate} ל-${learnerName}?`)) return;

    let tractateName = displayTractate;
    let chaptersToAssign: number[] = [];
    if (displayTractate === "כלים (א-י)") {
       chaptersToAssign = [0,1,2,3,4,5,6,7,8,9];
       tractateName = "כלים";
    } else if (displayTractate === "כלים (יא-כ)") {
       chaptersToAssign = [10,11,12,13,14,15,16,17,18,19];
       tractateName = "כלים";
    } else if (displayTractate === "כלים (כא-ל)") {
       chaptersToAssign = [20,21,22,23,24,25,26,27,28,29];
       tractateName = "כלים";
    } else {
       const totalCh = TRACTATE_CHAPTERS[tractateName];
       chaptersToAssign = Array.from({length: totalCh}, (_, i) => i);
    }

    const updates: any = {};
    const timestamp = Date.now();
    chaptersToAssign.forEach(ch => {
       updates[`events/${id}/tractates/${tractateName}/chapters/${ch}`] = {
           takerName: learnerName,
           takerPhone: "",
           takenAt: timestamp,
           isCompleted: false
       };
    });

    if (isMockMode) {
      await Promise.all(chaptersToAssign.map(ch => 
         fetch(`/api/mockdb?path=events/${id}/tractates/${tractateName}/chapters/${ch}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates[`events/${id}/tractates/${tractateName}/chapters/${ch}`])
         })
      ));
      refreshMockData();
    } else {
       await update(ref(db), updates);
    }
    
    setQuickAssignNames(prev => ({ ...prev, [displayTractate]: "" }));
    alert(`הוקצתה המסכת ${displayTractate} ל-${learnerName}`);
  };

  const handleReleaseFullTractateByOrganizer = async (displayTractate: string) => {
    let tractateName = displayTractate;
    let chapterIndices: number[] = [];
    if (displayTractate === "כלים (א-י)") {
       chapterIndices = [0,1,2,3,4,5,6,7,8,9];
       tractateName = "כלים";
    } else if (displayTractate === "כלים (יא-כ)") {
       chapterIndices = [10,11,12,13,14,15,16,17,18,19];
       tractateName = "כלים";
    } else if (displayTractate === "כלים (כא-ל)") {
       chapterIndices = [20,21,22,23,24,25,26,27,28,29];
       tractateName = "כלים";
    } else {
       chapterIndices = Array.from({length: TRACTATE_CHAPTERS[displayTractate]}, (_, i) => i);
    }

    const updates: Record<string, any> = {};
    const deletePromises: Promise<any>[] = [];
    
    chapterIndices.forEach(ch => {
       updates[`events/${id}/tractates/${tractateName}/chapters/${ch}`] = null;
       deletePromises.push(
          fetch(`/api/mockdb?path=events/${id}/tractates/${tractateName}/chapters/${ch}`, { method: 'DELETE' })
       );
    });

    if (isMockMode) {
      await Promise.all(deletePromises);
      refreshMockData();
    } else {
       await update(ref(db), updates);
    }
  };

  const handleAssignAllBulk = async () => {
    const toAssign = Object.entries(quickAssignNames).filter(([_, name]) => name.trim() !== "");
    if (toAssign.length === 0) return;

    const updates: Record<string, any> = {};
    const promises: Promise<any>[] = [];
    const timestamp = Date.now();

    for (const [displayTractate, learnerName] of toAssign) {
       let tractateName = displayTractate;
       let chaptersToAssign: number[] = [];
       if (displayTractate === "כלים (א-י)") {
          chaptersToAssign = [0,1,2,3,4,5,6,7,8,9];
          tractateName = "כלים";
       } else if (displayTractate === "כלים (יא-כ)") {
          chaptersToAssign = [10,11,12,13,14,15,16,17,18,19];
          tractateName = "כלים";
       } else if (displayTractate === "כלים (כא-ל)") {
          chaptersToAssign = [20,21,22,23,24,25,26,27,28,29];
          tractateName = "כלים";
       } else {
          chaptersToAssign = Array.from({length: TRACTATE_CHAPTERS[displayTractate]}, (_, i) => i);
       }

       chaptersToAssign.forEach(ch => {
           updates[`events/${id}/tractates/${tractateName}/chapters/${ch}`] = {
               takerName: learnerName.trim(),
               takerPhone: "",
               takenAt: timestamp,
               isCompleted: false
           };
       });
       
       if (isMockMode) {
           promises.push(...chaptersToAssign.map(ch => 
              fetch(`/api/mockdb?path=events/${id}/tractates/${tractateName}/chapters/${ch}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(updates[`events/${id}/tractates/${tractateName}/chapters/${ch}`])
              })
           ));
       }
    }

    if (isMockMode) {
      await Promise.all(promises);
      refreshMockData();
    } else {
       await update(ref(db), updates);
    }
    
    setQuickAssignNames({});
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      return false;
    }
  };

  const safeCopy = (text: string, successMsg: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert(successMsg)).catch(() => {
        fallbackCopyTextToClipboard(text) ? alert(successMsg) : alert("שגיאה בהעתקה, אנא העתק ידנית.");
      });
    } else {
      fallbackCopyTextToClipboard(text) ? alert(successMsg) : alert("שגיאה בהעתקה, אנא העתק ידנית.");
    }
  };

  const replacePlaceholders = (template: string, pName?: string) => {
    const title = event?.deceasedTitle ? ` ${event?.deceasedTitle}` : '';
    const eventName = `${event?.deceasedName || ""}${title}`;
    
    let totalChapters = 0;
    let takenChapters = 0;
    Object.keys(TRACTATE_CHAPTERS).forEach(t => {
      totalChapters += TRACTATE_CHAPTERS[t];
      takenChapters += Object.keys(tractatesData[t]?.chapters || {}).length;
    });
    
    const percent = totalChapters > 0 ? Math.round((takenChapters / totalChapters) * 100) : 0;
    const left = totalChapters - takenChapters;
    
    return template
      .replace(/{event_name}/g, eventName)
      .replace(/{link}/g, window.location.href)
      .replace(/{left}/g, left.toString())
      .replace(/{taken}/g, takenChapters.toString())
      .replace(/{total}/g, totalChapters.toString())
      .replace(/{percent}/g, percent.toString())
      .replace(/{participant_name}/g, pName || "")
      .replace(/{{participantName}}/g, pName || "");
  };

  const copyLink = () => {
    const tmpl = systemTexts?.shareTemplates?.eventLink || DEFAULT_SYSTEM_TEXTS.shareTemplates.eventLink;
    safeCopy(replacePlaceholders(tmpl), "הקישור הועתק ללוח!");
  };

  const copyTextAndLink = () => {
    const tmpl = systemTexts?.shareTemplates?.inviteMessage || DEFAULT_SYSTEM_TEXTS.shareTemplates.inviteMessage;
    safeCopy(replacePlaceholders(tmpl), "ההודעה והקישור הועתקו ללוח!");
  };

  const copyAppShare = () => {
    const tmpl = systemTexts?.shareTemplates?.appShare || DEFAULT_SYSTEM_TEXTS.shareTemplates.appShare;
    safeCopy(replacePlaceholders(tmpl), "הודעת השיתוף הועתקה ללוח!");
  };

  const getMessageText = (template: string, participantName: string, tractatesList: string) => {
    const url = window.location.href;
    const title = event?.deceasedTitle ? ` ${event.deceasedTitle}` : ' ז"ל';
    const deceased = `${event?.deceasedName || ""}${title}`;
    const targetDate = event?.shloshimDateHebrew || "";
    
    let text = `שלום ${participantName},\n`;
    
    switch (template) {
      case "general":
        text += `קיבלנו בלי נדר על עצמנו ללמוד משניות לעילוי נשמת ${deceased} עד התאריך ${targetDate}.\nלכניסה למערכת ובחירת מסכתות: ${url}`;
        break;
      case "reminder":
        text += `תזכורת: נותרו עוד כמה מסכתות ללימוד לעילוי נשמת ${deceased} (עד ${targetDate}).\nנשמח אם תוכל/י לקחת מסכת נוספת!\nלכניסה: ${url}`;
        break;
      case "checkin":
        text += `מה המצב? ראיתי שלקחת על עצמך ללמוד לעילוי נשמת ${deceased}.\nהאם אתה מצליח לסיים או שצריך עזרה ממישהו?\nלכניסה לעמוד הלימוד: ${url}`;
        break;
      case "custom":
        text += `${customMessage}\n\n${url}`;
        break;
    }
    return encodeURIComponent(text);
  };

  const sendPersonalWhatsApp = (phone: string, participantName: string, tractatesList: string) => {
    if (!phone) {
      alert("למשתתף זה לא רשום מספר טלפון.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, ''); 
    const text = getMessageText(commsTemplate, participantName, tractatesList);
    window.open(`https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}?text=${text}`, "_blank");
  };

  const handleContactOrganizer = () => {
    if (!event) return;
    const cleanPhone = (event.organizerPhone || "").replace(/\D/g, '');
    if (!cleanPhone) return;
    const participant = participantProfile?.name || "לומד/ת";
    const title = event.deceasedTitle ? ` ${event.deceasedTitle}` : '';
    const text = encodeURIComponent(`שלום ${event.organizerName || 'מארגן הלימוד'},\nבקשר ללימוד המשניות לעילוי נשמת ${event.deceasedName}${title}.\n(מאת: ${participant})`);
    window.open(`https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}?text=${text}`, "_blank");
  };

  const handleExportParticipants = () => {
    if (!tractatesData || Object.keys(tractatesData).length === 0) {
      alert("אין עדיין משתתפים באירוע");
      return;
    }
    
    const dataToExport: any[] = [];
    Object.keys(tractatesData).forEach(tractateName => {
      const chaps = tractatesData[tractateName]?.chapters || {};
      Object.keys(chaps).forEach(ch => {
        const c = chaps[ch];
        if (c.takerName) {
          dataToExport.push({
            "שם המשתתף": c.takerName,
            "טלפון": c.takerPhone || "",
            "מסכת": tractateName,
            "פרק": getHebrewChapter(parseInt(ch, 10)),
            "הושלם": c.isCompleted ? "כן" : "לא",
            "תאריך בחירה": new Date(c.takenAt).toLocaleDateString("he-IL")
          });
        }
      });
    });
    
    if (dataToExport.length === 0) {
      alert("אין עדיין משתתפים באירוע");
      return;
    }
    downloadCSV(dataToExport, `participants_${event?.deceasedName || 'event'}.csv`);
  };

  const handlePrintEmptyTable = () => {
    setIsPrintingEmptyTable(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrintingEmptyTable(false), 500);
    }, 100);
  };

  const handleGeneratePoster = async (withNames: boolean = true) => {
    if (!event) return;
    const participantsList = withNames ? Object.keys(participantsMap) : [];
    try {
      const title = event.deceasedTitle ? ` ${event.deceasedTitle}` : ' ז"ל';
      const fullName = `${event.deceasedName}${title}`.trim();
      await generateCompletionPoster(fullName, event.shloshimDateHebrew || "", participantsList);
    } catch (e) {
      alert("שגיאה ביצירת המודעה");
    }
  };

  const toggleChapterSelection = (ch: number) => {
    if (selectedChapters.includes(ch)) {
      setSelectedChapters(prev => prev.filter(c => c !== ch));
    } else {
      setSelectedChapters(prev => [...prev, ch]);
    }
  };

  const selectAllAvailableChapters = () => {
    const totalChapters = TRACTATE_CHAPTERS[selectedTractate!];
    const available = [];
    for (let i = 0; i < totalChapters; i++) {
      if (!tractatesData[selectedTractate!]?.chapters?.[i]) {
        available.push(i);
      }
    }
    setSelectedChapters(available);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">טוען נתונים...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-slate-500">אירוע לא נמצא</div>;

  // Admin login modal
  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleAdminLogin} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full space-y-4">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-2">ניהול מערכת</h2>
          <p className="text-slate-500 text-sm text-center mb-4">
            הזן סיסמת מנהל מערכת כדי להמשיך
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
            <input 
              type="password" required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={adminPasswordInput} onChange={e => { setAdminPasswordInput(e.target.value); setAdminLoginError(false); }}
            />
            {adminLoginError && <p className="text-red-500 text-xs mt-1">סיסמה שגויה</p>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setShowAdminLogin(false)} className="w-1/3 bg-slate-100 text-slate-600 py-4 rounded-xl hover:bg-slate-200 transition font-medium">
              ביטול
            </button>
            <button type="submit" className="w-2/3 bg-slate-800 text-white py-4 rounded-xl hover:bg-slate-900 transition font-medium shadow-md">
              היכנס למערכת
            </button>
          </div>
        </form>
      </div>
    );
  }

  // We explicitly wait to show anything else if showJoinForm is true to block the screen
  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full space-y-4">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-2">הצטרפות ללימוד</h2>
          <p className="text-slate-500 text-sm text-center mb-4">
            לעילוי נשמת {event.deceasedName} {event.deceasedTitle || ''}
          </p>

          {knownProfiles.length > 0 && !showNewLearnerForm && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-bold text-slate-500 mb-2">בחר פרופיל קיים:</h3>
              {knownProfiles.map((p, idx) => (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => {
                    localStorage.setItem("participantProfile", JSON.stringify(p));
                    setParticipantProfile(p);
                    if (event) {
                      const isNowOrg = p.phone === event.organizerPhone;
                      setIsOrganizerRole(isNowOrg);
                      handleSetView(isNowOrg ? 'organizer' : 'learning');
                    }
                    setShowJoinForm(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-right"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-inner">
                    {getInitials(p.name)}
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">{p.name}</div>
                    <div className="text-xs text-blue-600">{p.phone}</div>
                  </div>
                </button>
              ))}
              <button 
                type="button"
                onClick={() => setShowNewLearnerForm(true)}
                className="w-full mt-4 text-sm text-blue-600 font-bold hover:underline flex justify-center items-center gap-1 py-2"
              >
                <PlusCircle className="w-4 h-4" /> כניסה כמשתמש חדש
              </button>
            </div>
          )}

          {showNewLearnerForm && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={joinName} onChange={e => setJoinName(e.target.value)}
                />
              </div>

              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">טלפון נייד</label>
                <input 
                  type="tel" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={joinPhone} onChange={e => setJoinPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">אימייל <span className="text-slate-400 font-normal">(רשות)</span></label>
                <input 
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={joinEmail} onChange={e => setJoinEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition font-medium text-lg mt-2 shadow-md">
                היכנס
              </button>
              
              {knownProfiles.length > 0 && (
                <button type="button" onClick={() => setShowNewLearnerForm(false)} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2">
                  חזור לרשימת הפרופילים
                </button>
              )}
            </form>
          )}

          {event?.whatsappGroup && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600 mb-3 font-medium">כדאי גם להצטרף לקבוצת העדכונים של הלימוד בוואצפ:</p>
              <a href={event.whatsappGroup} target="_blank" rel="noopener noreferrer" className="inline-block w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl transition shadow-md">
                הצטרפות לקבוצת וואצפ
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  let totalChaptersAvailable = 0;
  let totalChaptersCompleted = 0;
  let takenCountNum = 0;
  
  Object.keys(TRACTATE_CHAPTERS).forEach(t => {
    const total = TRACTATE_CHAPTERS[t];
    totalChaptersAvailable += total;
    const chaptersObj = tractatesData[t]?.chapters || {};
    Object.keys(chaptersObj).forEach((k) => {
      if (parseInt(k) < total) {
        const c = chaptersObj[k] as any;
        if (c.isCompleted) totalChaptersCompleted++;
        if (c.takerName) takenCountNum++;
      }
    });
  });
  
  const takenCount = Math.floor((totalChaptersCompleted / totalChaptersAvailable) * 100);

  const participantsMap: Record<string, { phone: string, email: string, tractates: Set<string> }> = {};
  Object.keys(tractatesData).forEach(t => {
    const chapters = tractatesData[t]?.chapters || {};
    Object.keys(chapters).forEach(ch => {
      const data = chapters[ch];
      if (data.takerName) {
        if (!participantsMap[data.takerName]) {
          participantsMap[data.takerName] = { phone: data.takerPhone, email: data.takerEmail, tractates: new Set() };
        }
        participantsMap[data.takerName].tractates.add(t);
      }
    });
  });

  const myLearningRows: Array<{ tractate: string, nextChapterToLearn: number | null, nextMishnahLabel: string, completedCount: number, totalOwned: number }> = [];
  
  if (participantProfile?.name) {
    Object.keys(tractatesData).forEach(t => {
      const chapters = tractatesData[t]?.chapters || {};
      const ownedChapters: number[] = [];
      let completedCount = 0;
      
      Object.keys(chapters).forEach(ch => {
        if (chapters[ch].takerName === participantProfile.name && chapters[ch].takerPhone === participantProfile.phone) {
          const chNum = parseInt(ch, 10);
          ownedChapters.push(chNum);
          if (chapters[ch].isCompleted) {
            completedCount++;
          }
        }
      });
      
      if (ownedChapters.length > 0) {
        ownedChapters.sort((a, b) => a - b);
        let nextChapterToLearn = null;
        let nextMishnahLabel = "";
        for (const ch of ownedChapters) {
          if (!chapters[ch].isCompleted) {
            nextChapterToLearn = ch;
            const bookmarkKey = `bookmark_${id}_${t}_${ch}`;
            const savedIndexStr = typeof window !== 'undefined' ? localStorage.getItem(bookmarkKey) : null;
            if (savedIndexStr !== null) {
              const savedIndex = parseInt(savedIndexStr, 10);
              nextMishnahLabel = ` משנה ${getHebrewChapter(savedIndex + 1)}`;
            }
            break;
          }
        }
        
        myLearningRows.push({
          tractate: t,
          nextChapterToLearn,
          nextMishnahLabel,
          completedCount,
          totalOwned: ownedChapters.length
        });
      }
    });
  }

  let daysRemaining: number | null = null;
  let computedTargetDateStr = event?.shloshimDateStr;
  
  // Fallback: if shloshimDateStr is missing but passingDate is available
  if (!computedTargetDateStr && event?.passingDate) {
      try {
          const passHDate = new HDate(new Date(event.passingDate));
          // Default to 30 days if no burial date
          computedTargetDateStr = passHDate.add(29, 'd').greg().toISOString();
      } catch(e) {}
  }

  if (computedTargetDateStr) {
    const targetDate = new Date(computedTargetDateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const lateParticipants: Array<{name: string, phone: string, tractates: string[]}> = [];
  const takersMapGlobal: Record<string, { phone: string, owned: number, completed: number, tractates: Set<string> }> = {};
  if (activeView === 'organizer') {
    Object.keys(tractatesData).forEach(t => {
        const chObj = tractatesData[t]?.chapters || {};
        Object.values(chObj).forEach((c: any) => {
            if (c.takerName) {
                if (!takersMapGlobal[c.takerName]) {
                    takersMapGlobal[c.takerName] = { phone: c.takerPhone, owned: 0, completed: 0, tractates: new Set() };
                }
                takersMapGlobal[c.takerName].owned++;
                if (c.isCompleted) takersMapGlobal[c.takerName].completed++;
                takersMapGlobal[c.takerName].tractates.add(t);
            }
        });
    });
    
    Object.keys(takersMapGlobal).forEach(name => {
        const t = takersMapGlobal[name];
        if (t.owned > t.completed) {
            lateParticipants.push({ name, phone: t.phone, tractates: Array.from(t.tractates) });
        }
    });
  }

  const sendLateReminder = (name: string, phone: string) => {
      if (!phone) {
          alert("אין מספר טלפון רשום למשתתף זה.");
          return;
      }
      const daysText = daysRemaining !== null && daysRemaining >= 0 ? `נותרו ${daysRemaining} ימים` : "תאריך היעד עבר";
      const cleanPhone = phone.replace(/\D/g, ''); 
      const tmpl = systemTexts?.shareTemplates?.reminderMessage || DEFAULT_SYSTEM_TEXTS.shareTemplates.reminderMessage;
      let text = replacePlaceholders(tmpl, name);
      // We manually add the user's name if the template doesn't support placeholders
      if (!tmpl.includes("{participant_name}") && !tmpl.includes("{{participantName}}")) {
          text = `שלום ${name},\n${text}`;
      }
      
      window.open(`https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyGeneralStatus = () => {
      const tmpl = systemTexts?.shareTemplates?.generalStatus || DEFAULT_SYSTEM_TEXTS.shareTemplates.generalStatus;
      let msg = replacePlaceholders(tmpl);
      
      const emptyTractates: string[] = [];
      const partialTractates: string[] = [];
      
      SEDARIM.forEach(seder => {
          seder.tractates.forEach(t => {
              const totalCh = TRACTATE_CHAPTERS[t];
              const chaptersTaken = Object.keys(tractatesData[t]?.chapters || {}).length;
              if (chaptersTaken === 0) {
                  emptyTractates.push(t);
              } else if (chaptersTaken < totalCh) {
                  partialTractates.push(t);
              }
          });
      });
      
      if (emptyTractates.length > 0) {
          msg += `\n\n*מסכתות שלמות פנויות:*\n${emptyTractates.join(", ")}`;
      }
      if (partialTractates.length > 0) {
          msg += `\n\n*מסכתות חסרות פרקים:*\n${partialTractates.join(", ")}`;
      }
      
      safeCopy(msg, "הסטטוס הועתק ללוח!");
  };

  const renderTractatesGrid = (isOrganizerMode: boolean) => {
    // Helper to render a group of tractates for a specific condition
    const renderTractateGroup = (condition: (isFullyTaken: boolean) => boolean) => {
      let hasAnyTractates = false;
      const content = SEDARIM.map((seder) => {
        let sederTaken = 0;
        let sederTotal = 0;
        
        // Compute stats for the whole seder for the header
        seder.tractates.forEach(t => {
          const tot = TRACTATE_CHAPTERS[t];
          sederTotal += tot;
          sederTaken += Object.keys(tractatesData[t]?.chapters || {}).length;
        });

        // Filter tractates in this seder based on condition
        const filteredTractates = seder.tractates.filter(t => {
          const totalCh = TRACTATE_CHAPTERS[t];
          const chaptersTaken = Object.keys(tractatesData[t]?.chapters || {}).length;
          return condition(chaptersTaken === totalCh);
        });

        if (filteredTractates.length === 0) return null;
        hasAnyTractates = true;

        return (
          <div key={seder.name} className="space-y-3">
            <div className="flex items-center gap-3">
              <h4 className="text-md font-bold text-blue-800">{seder.name}</h4>
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="text-xs text-slate-400 font-medium">פרקים שנלקחו: {sederTaken}/{sederTotal}</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTractates.map((t) => {
                const totalCh = TRACTATE_CHAPTERS[t];
                const chaptersObj = tractatesData[t]?.chapters || {};
                const chaptersTaken = Object.keys(chaptersObj).length;
                const isFullyTaken = chaptersTaken === totalCh;
                
                let completedCount = 0;
                const takersSet = new Set<string>();
                let isTakenByMe = false;
                Object.values(chaptersObj).forEach((c: any) => {
                  if (c.isCompleted) completedCount++;
                  if (c.takerName) takersSet.add(c.takerName);
                  if (participantProfile && c.takerName === participantProfile.name && c.takerPhone === participantProfile.phone) {
                    isTakenByMe = true;
                  }
                });
                const isFullyCompleted = completedCount === totalCh;

                const firstTaker = chaptersTaken > 0 ? Object.values(chaptersObj)[0] as any : null;
                const takerName = firstTaker ? firstTaker.takerName : "";
                const multipleTakers = takersSet.size > 1;
                
                const displayTaker = multipleTakers ? "מספר לומדים" : getInitials(takerName);
                const progressPct = (completedCount / totalCh) * 100;

                return (
                  <div key={t} className={`relative flex items-stretch border-2 rounded-xl transition overflow-hidden ${
                    isFullyCompleted 
                      ? "border-green-300 bg-green-50" 
                      : isFullyTaken
                        ? "border-blue-200 bg-blue-50/50"
                        : chaptersTaken > 0 
                          ? "border-blue-300 bg-white"
                          : "border-slate-100 hover:border-blue-300 hover:bg-slate-50"
                  }`}>
                    <div 
                      className={`flex-1 p-3 text-right cursor-pointer ${
                        isOrganizerMode ? 'active:bg-slate-100' : (isFullyTaken && !isTakenByMe) ? 'cursor-default' : 'active:bg-blue-100'
                      }`}
                      onClick={() => {
                        if (isOrganizerMode) {
                          setShowOrganizerTractateModal(t);
                        } else {
                          if (chaptersTaken === 0) {
                            handleTakeTractateFull(t);
                          } else if (!isFullyTaken) {
                            setSelectedTractate(t);
                            setShowChaptersModal(true);
                            setSelectedChapters([]);
                          } else if (isTakenByMe) {
                            setSelectedTractate(t);
                            setShowChaptersModal(true);
                            setSelectedChapters([]);
                          }
                        }
                      }}
                    >
                      <div className={`font-bold text-sm ${isFullyCompleted ? "text-green-800" : isFullyTaken ? "text-blue-800" : "text-slate-700"}`}>{t}</div>
                      {isFullyCompleted ? (
                        <div className="text-[10px] text-green-700 font-medium mt-1 truncate" title={multipleTakers ? "מספר לומדים" : takerName}>הושלם ({displayTaker})</div>
                      ) : isFullyTaken ? (
                        <div className="text-[10px] text-blue-600 font-medium mt-1 truncate" title={multipleTakers ? "מספר לומדים" : takerName}>
                          תפוס ({displayTaker})
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progressPct}%` }}></div>
                          </div>
                        </div>
                      ) : chaptersTaken > 0 ? (
                        <div className="w-full mt-2">
                           <div className="text-[10px] text-slate-500 mb-1">תפוס חלקית</div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progressPct}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium mt-1">פנוי לגמרי</div>
                      )}
                    </div>

                    {!isFullyTaken && !isOrganizerMode && (
                      <div 
                        className="w-10 border-l border-slate-200 flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTractate(t);
                          setShowChaptersModal(true);
                          setSelectedChapters([]);
                        }}
                        title="בחר פרקים ספציפיים"
                      >
                        <ListTree className="w-4 h-4" />
                      </div>
                    )}
                    
                    {isOrganizerMode && chaptersTaken > 0 && (
                      <div 
                        className="absolute left-2 top-2 text-blue-400 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOrganizerTractateModal(t);
                        }}
                      >
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      });

      return hasAnyTractates ? <div className="space-y-8">{content}</div> : null;
    };

    const availableTractates = renderTractateGroup((isFullyTaken) => !isFullyTaken);
    const takenTractates = renderTractateGroup((isFullyTaken) => isFullyTaken);

    return (
      <div className="space-y-10">
        {availableTractates && (
          <div>
            {takenTractates && <h3 className="text-lg font-bold text-green-700 mb-4 px-2 border-r-4 border-green-500 bg-green-50 py-2 rounded-l-lg">מסכתות פנויות ללימוד</h3>}
            {availableTractates}
          </div>
        )}
        
        {takenTractates && (
          <div className="pt-8 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-500 mb-4 px-2 border-r-4 border-slate-300 bg-slate-50 py-2 rounded-l-lg">מסכתות שנתפסו</h3>
            <div className="opacity-80">
               {takenTractates}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      <div className="print:hidden">
        <header className="bg-gradient-to-b from-blue-700 to-blue-600 text-white p-6 shadow-md rounded-b-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          {event.photoUrl ? (
            <img src={event.photoUrl} alt="תמונת הנפטר" className="w-20 h-20 rounded-full object-cover border-4 border-white/20 mb-3 shadow-lg" />
          ) : (
            <BookOpen className="w-8 h-8 mb-2 text-blue-200 opacity-80" />
          )}
          <h1 className="text-xl font-medium text-blue-100">סיום ש"ס משניות לעילוי נשמת</h1>
          <h2 className="text-3xl font-black text-center mt-1 text-white">{event.deceasedName} {event.deceasedTitle || ''}</h2>
          
          <div className="flex flex-col items-center gap-1 mt-6 text-blue-100 text-sm bg-black/10 p-3 rounded-xl backdrop-blur-sm px-6 border border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 opacity-80" />
              <span className="font-medium text-base">יעד סיום: {event.shloshimDateHebrew || "לא נקבע"}</span>
            </div>
            {event.showGregorian && (
              <span className="text-xs opacity-75">{new Date(event.shloshimDateStr).toLocaleDateString("he-IL")}</span>
            )}
            <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-center gap-2 w-full font-mono text-base font-bold tracking-widest bg-white/10 rounded-lg py-1">
              קוד אירוע: {id}
            </div>
          </div>
        </div>
        {/* Unified Top Header with Hamburger Menu */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
          <button onClick={() => setShowSidebar(true)} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all shadow-md active:scale-95" title="תפריט">
            <Menu className="w-6 h-6" />
          </button>
          <button onClick={() => setShowShareModal(true)} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all shadow-md active:scale-95" title="שתף אירוע">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        

      </header>

      {/* Participant Info Bar */}
      {participantProfile && (
        <div className="max-w-4xl mx-auto px-4 mt-4 relative z-40">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shadow-inner">
                {getInitials(participantProfile.name)}
              </div>
              <span className="text-sm font-bold text-slate-700">שלום, {participantProfile.name}</span>
            </div>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1 font-bold"
            >
              החלף לומד <ChevronDown className="w-4 h-4" />
            </button>
            
            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] text-slate-800">
                  <div className="max-h-56 overflow-y-auto">
                    {knownProfiles.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          localStorage.setItem("participantProfile", JSON.stringify(p));
                          setParticipantProfile(p);
                          if (event) {
                            const isNowOrg = checkIsOrganizer(p, event);
                            setIsOrganizerRole(isNowOrg);
                            if (!isNowOrg && activeView === 'organizer') handleSetView('learning');
                            if (isNowOrg) handleSetView('organizer');
                          }
                          setShowProfileDropdown(false);
                        }}
                        className={`w-full text-right px-4 py-3 border-b border-slate-50 hover:bg-blue-50 transition flex items-center gap-3 ${participantProfile.phone === p.phone ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {getInitials(p.name)}
                        </div>
                        <div className="truncate text-sm font-bold">{p.name}</div>
                        {participantProfile.phone === p.phone && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 mr-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      localStorage.removeItem("participantProfile");
                      setParticipantProfile(null);
                      setIsOrganizerRole(false);
                      setShowNewLearnerForm(true);
                      setShowJoinForm(true);
                    }}
                    className="w-full text-right px-4 py-4 bg-slate-50 hover:bg-slate-100 text-blue-600 text-sm font-bold flex items-center gap-2 transition"
                  >
                    <PlusCircle className="w-5 h-5" /> כניסה כמשתמש חדש
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global Event Completion Banner */}
      {takenCount === 100 && (
        <div className="max-w-4xl mx-auto px-4 mt-4 relative z-30">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl shadow-sm border border-amber-200 p-6 flex flex-col items-center justify-center text-center text-amber-900">
            <Flame className="w-10 h-10 mb-3 text-amber-600" />
            <h2 className="text-xl font-bold mb-2">אשריך שזכית!</h2>
            <p className="mb-2 font-medium">להיות שותף בסיום ש"ס משניות, לעילוי נשמת {event?.deceasedName} {event?.deceasedTitle || ''}</p>
            <p className="font-bold text-lg mb-4">ת.נ.צ.ב.ה.</p>
            
            {isOrganizerRole && (
              <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleGeneratePoster(true)}
                  className="bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-amber-700 transition flex justify-center items-center gap-2 shadow-sm text-sm"
                >
                  <ImageIcon className="w-4 h-4" />
                  הפק מודעה עם שמות
                </button>
                <button 
                  onClick={() => handleGeneratePoster(false)}
                  className="bg-white border border-amber-300 text-amber-700 font-bold py-2.5 px-6 rounded-xl hover:bg-amber-50 transition flex justify-center items-center gap-2 shadow-sm text-sm"
                >
                  <ImageIcon className="w-4 h-4" />
                  הפק מודעה ללא שמות
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end" onClick={() => setShowSidebar(false)}>
          <div className="bg-white w-72 h-full shadow-2xl flex flex-col transform transition-transform" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h2 className="font-bold text-blue-900 text-lg">תפריט ניווט</h2>
              <button onClick={() => setShowSidebar(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-2">
                {/* Active for Everyone */}
                <button onClick={() => handleSetView('learning')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeView === 'learning' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <BookOpen className="w-5 h-5" /> הלימוד שלי
                </button>
                <button onClick={() => handleSetView('additions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeView === 'additions' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Briefcase className="w-5 h-5" /> מאגר תפילות ותוכן
                </button>
                <button onClick={() => handleSetView('notice')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeView === 'notice' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <BookOpen className="w-5 h-5" /> עיצוב מודעת אבל
                </button>
                <button onClick={() => router.push('/create')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition">
                  <PlusCircle className="w-5 h-5" /> יצירת אירוע חדש
                </button>
                <button onClick={() => handleSetView('about')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeView === 'about' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Info className="w-5 h-5" /> אודות
                </button>
                
                <div className="my-4 border-t border-slate-100"></div>
                <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">אזור מארגן</div>
                
                {/* Organizer Options (Greyed out if not organizer) */}
                <button 
                  onClick={() => isOrganizerRole && handleSetView('organizer')} 
                  disabled={!isOrganizerRole}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${isOrganizerRole ? (activeView === 'organizer' ? 'bg-amber-100 text-amber-700' : 'text-slate-800 hover:bg-slate-50') : 'text-slate-300 cursor-not-allowed'}`}
                >
                  <Users className="w-5 h-5" /> פאנל מארגן
                </button>
                <button 
                  onClick={() => isOrganizerRole && router.push(`/create?edit=${id}`)} 
                  disabled={!isOrganizerRole}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${isOrganizerRole ? 'text-slate-800 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
                >
                  <Settings2 className="w-5 h-5" /> הגדרות אירוע
                </button>
                
                <div className="my-4 border-t border-slate-100"></div>
                
                {/* Admin Area */}
                <button onClick={() => { setShowSidebar(false); setShowAdminLogin(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
                  <Settings className="w-5 h-5" /> ניהול מערכת
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'additions' ? (
        <AdditionsHub eventData={event} systemTexts={systemTexts} />
      ) : activeView === 'notice' ? (
        <div className="max-w-5xl mx-auto mt-4 h-[calc(100vh-100px)]">
          <NoticeHub eventData={event} />
        </div>
      ) : activeView === 'about' ? (
        <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-3xl shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">אודות המערכת</h2>
          <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
            {systemTexts?.aboutUs || DEFAULT_SYSTEM_TEXTS.aboutUs}
          </div>
        </div>
      ) : (
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {activeView === 'organizer' && isOrganizerRole && (
          <div className="space-y-6">

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 text-lg">סטטוס האירוע</h3>
              <div className="mb-6">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                  <span>התקדמות למידה בפועל</span>
                  <span>{takenCount}% מכלל הפרקים הושמו</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${takenCount}%` }}></div>
                </div>
              </div>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
              <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                תקשורת והתראות
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={copyGeneralStatus} 
                  className="w-full bg-blue-50 text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-100 transition border border-blue-200"
                >
                  העתק 'קול קורא' לוואצפ להשלמת מסכתות נותרות
                </button>
                
                {lateParticipants.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-bold text-slate-600 mb-3">משתתפים שטרם סיימו את לימודם:</h4>
                    <div className="space-y-2">
                      {lateParticipants.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-xs text-slate-500">לוקח/ת: {p.tractates.join(", ")}</div>
                          </div>
                          <button 
                            onClick={() => sendLateReminder(p.name, p.phone)}
                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-600 transition"
                          >
                            שלח תזכורת
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lateParticipants.length === 0 && takenCount > 0 && (
                  <div className="text-center text-sm text-green-600 bg-green-50 p-4 rounded-xl font-bold flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                    כל הלומדים סיימו את חובתם עד כה!
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg font-bold text-slate-800">מעקב מסכתות</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrintEmptyTable}
                    className="bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> הדפס טבלה לומדים
                  </button>
                  <button 
                    onClick={handleExportParticipants}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-100 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> הורד דוח לומדים
                  </button>
                </div>
              </div>
              {renderTractatesGrid(true)}
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">הקצאה ידנית מהירה של מסכתות</h3>
              <div className="space-y-6">
                {SEDARIM.map((seder) => (
                  <div key={seder.name} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-amber-800 mb-3 border-b border-slate-200 pb-2">{seder.name}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {seder.tractates.flatMap(tractate => {
                         const isKelim = tractate === "כלים";
                         const items = isKelim ? ["כלים (א-י)", "כלים (יא-כ)", "כלים (כא-ל)"] : [tractate];
                         
                         return items.map(displayTractate => {
                           let tData = tractatesData[tractate];
                           let takersStr = "";
                           if (tData && tData.chapters) {
                              let takers = new Set<string>();
                              let chapterIndices: number[] = [];
                              if (displayTractate === "כלים (א-י)") chapterIndices = [0,1,2,3,4,5,6,7,8,9];
                              else if (displayTractate === "כלים (יא-כ)") chapterIndices = [10,11,12,13,14,15,16,17,18,19];
                              else if (displayTractate === "כלים (כא-ל)") chapterIndices = [20,21,22,23,24,25,26,27,28,29];
                              else chapterIndices = Array.from({length: TRACTATE_CHAPTERS[tractate]}, (_, i) => i);
                              
                              chapterIndices.forEach(idx => {
                                if (tData.chapters[idx]?.takerName) takers.add(tData.chapters[idx].takerName);
                              });
                              takersStr = Array.from(takers).join(", ");
                           }

                           return (
                             <div key={displayTractate} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                               <div className="font-bold text-slate-700">{displayTractate}</div>
                               <div className="flex items-center gap-2">
                                 {takersStr ? (
                                    <div className="flex items-center justify-between w-full bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                      <span className="text-sm font-medium text-slate-700 truncate" title={takersStr}>{takersStr}</span>
                                      <button 
                                        onClick={() => handleReleaseFullTractateByOrganizer(displayTractate)} 
                                        className="text-red-500 hover:bg-red-200 bg-red-100 p-1 rounded-full transition shrink-0" 
                                        title="בטל התחייבות זו"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                 ) : (
                                    <input 
                                      type="text" 
                                      placeholder="שם הלומד..." 
                                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                      value={quickAssignNames[displayTractate] || ""}
                                      onChange={e => setQuickAssignNames(p => ({ ...p, [displayTractate]: e.target.value }))}
                                    />
                                 )}
                               </div>
                             </div>
                           );
                         });
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={handleAssignAllBulk}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-md w-full md:w-auto text-lg"
                >
                  שמור שינויים (שייך הכל)
                </button>
              </div>
            </section>

            <section className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-200">
              <h3 className="font-bold text-red-800 mb-4 text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                ניהול וסיום האירוע
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-red-700">
                  פעולה זו תסתיר את האירוע מכלל המשתתפים. (ניתן לשחזר רק דרך מנהל המערכת).
                </p>
                <button 
                  onClick={handleDeleteEvent}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
                >
                  הסתר אירוע
                </button>
              </div>
            </section>
          </div>
        )}

        {activeView === 'learning' && (
          <div className="space-y-6">
            {daysRemaining !== null && (
              <div className="flex justify-center mb-6">
                <div className="bg-white text-blue-800 px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {daysRemaining > 0 
                    ? `נותרו עוד ${daysRemaining} ימים ללימוד!` 
                    : daysRemaining === 0 
                      ? "היום יום השלושים!" 
                      : `תאריך פטירה: ${event?.passingDate ? new HDate(new Date(event.passingDate)).renderGematriya(true) : "עבר"}`}
                </div>
              </div>
            )}
            
            {myLearningRows.length > 0 && (
              <section className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  רצף הלמידה שלי
                </h3>
                <div className="space-y-3">
                  {myLearningRows.map((row, idx) => {
                    const isAllDone = row.nextChapterToLearn === null;
                    return (
                      <div key={idx} className={`bg-white border ${isAllDone ? 'border-green-200' : 'border-amber-100'} rounded-xl p-4 shadow-sm relative overflow-hidden`}>
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <div className="font-bold text-slate-800 text-lg">מסכת {row.tractate}</div>
                            <div className={`text-sm mt-1 font-medium ${isAllDone ? 'text-green-600' : 'text-amber-700'}`}>
                              {isAllDone ? `סיימת את כל ${row.totalOwned} הפרקים שלקחת!` : `הבא בתור: פרק ${getHebrewChapter(row.nextChapterToLearn!)}${row.nextMishnahLabel}`}
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-2">
                            {!isAllDone && (
                              <div className="flex flex-wrap gap-2 justify-center mb-1">
                                <button onClick={() => setSelectedTractateForCalendar(row.tractate)} className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 py-1.5 px-3 rounded-lg font-bold transition flex items-center gap-1 border border-amber-300">
                                  <Calendar className="w-3 h-3" /> יומן
                                </button>
                                <button onClick={() => {
                                  setSelectedTractateForDaily(row.tractate);
                                  setSelectedTractateTotalChapters(TRACTATE_CHAPTERS[row.tractate] || 1);
                                }} className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 py-1.5 px-3 rounded-lg font-bold transition flex items-center gap-1 border border-amber-300">
                                  <BookOpen className="w-3 h-3" /> משנה יומית
                                </button>
                              </div>
                            )}
                            {!isAllDone && (
                              <button onClick={() => handleReleaseTractateComplete(row.tractate)} className="text-xs text-slate-400 hover:text-slate-600 underline font-medium transition px-2">ביטול התחייבות</button>
                            )}
                            {!isAllDone ? (
                              <Link href={`/study/${id}/${encodeURIComponent(row.tractate)}/${row.nextChapterToLearn}`} className="bg-amber-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition flex items-center gap-2 shadow-md active:scale-95"><PlayCircle className="w-5 h-5" /> למד כעת</Link>
                            ) : (
                              <div className="bg-green-100 text-green-700 p-2 rounded-full"><CheckCircle2 className="w-8 h-8" /></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">בחירת מסכתות ללימוד</h3>
              {renderTractatesGrid(false)}
            </section>

                        {event?.organizerPhone && !isOrganizerRole && (
                          <div className="mt-8 no-print">
                            <button 
                              onClick={handleContactOrganizer}
                              className="w-full bg-slate-100 border border-slate-200 text-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition"
                            >
                              <MessageCircle className="w-5 h-5 text-green-500" />
                              צור קשר עם המארגן ({event.organizerName || "מארגן האירוע"})
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </main>
                  )}
                  </div>

                  {/* Printable Table for Organizer */}
                  {isPrintingEmptyTable && (
                    <div className="hidden print:block fixed print:absolute inset-0 print:inset-auto print:top-0 print:left-0 bg-white z-[9999] p-8 w-full min-h-screen h-auto font-serif" dir="rtl">
                       <style dangerouslySetInnerHTML={{__html: `
                         @media print {
                           @page { size: A4 portrait; margin: 1cm; }
                           .print-table-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; background: white; }
                         }
                       `}} />
                       <div className="print-table-container max-w-[21cm] mx-auto text-black">
                         <div className="text-center mb-4">
                           <div className="text-sm mb-1">בס"ד</div>
                           <h2 className="text-2xl font-bold mb-1">לימוד משניות לעילוי נשמת {event?.deceasedName} {event?.deceasedTitle || ''}</h2>
                           <div className="text-lg mb-1">נא לסיים עד תאריך: {event?.shloshimDateHebrew || "___________"}</div>
                           <div className="text-lg font-bold">ת.נ.צ.ב.ה.</div>
                         </div>
                         
                         <div className="flex border-4 border-black w-full" dir="rtl">
                           {[
                             ["סדר זרעים", "סדר מועד"],
                             ["סדר נשים", "סדר נזיקין"],
                             ["סדר קדשים", "סדר טהרות"]
                           ].map((sederPair, pairIdx) => (
                             <div key={pairIdx} className={`flex-1 ${pairIdx < 2 ? 'border-l-4 border-black' : ''}`}>
                               <table className="w-full text-center text-sm border-collapse">
                                 <thead>
                                   <tr>
                                     <th className="border border-black p-1 bg-slate-100 w-1/3">מסכת</th>
                                     <th className="border border-black p-1 bg-slate-100 w-2/3">שם הלומד</th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {sederPair.map(sederName => {
                                      const sederObj = SEDARIM.find(s => s.name === sederName);
                                      if (!sederObj) return null;
                                      return (
                                        <React.Fragment key={sederName}>
                                          <tr>
                                            <td colSpan={2} className="border border-black bg-slate-200 font-bold p-1">{sederName}</td>
                                          </tr>
                                          {sederObj.tractates.flatMap(tractate => {
                                             const isKelim = tractate === "כלים";
                                             const items = isKelim ? ["כלים (א-י)", "כלים (יא-כ)", "כלים (כא-ל)"] : [tractate];
                                             
                                             return items.map(displayTractate => {
                                               const tData = tractatesData[tractate];
                                               let takers = new Set<string>();
                                               if (tData && tData.chapters) {
                                                  let chapterIndices: number[] = [];
                                                  if (displayTractate === "כלים (א-י)") chapterIndices = [0,1,2,3,4,5,6,7,8,9];
                                                  else if (displayTractate === "כלים (יא-כ)") chapterIndices = [10,11,12,13,14,15,16,17,18,19];
                                                  else if (displayTractate === "כלים (כא-ל)") chapterIndices = [20,21,22,23,24,25,26,27,28,29];
                                                  else chapterIndices = Array.from({length: TRACTATE_CHAPTERS[tractate]}, (_, i) => i);
                                                  
                                                  chapterIndices.forEach(idx => {
                                                    if (tData.chapters[idx]?.takerName) takers.add(tData.chapters[idx].takerName);
                                                  });
                                               }
                                               const takersStr = Array.from(takers).join(', ');
                                               
                                               return (
                                                 <tr key={displayTractate}>
                                                   <td className="border border-black p-1 font-bold whitespace-nowrap">{displayTractate}</td>
                                                   <td className="border border-black p-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] h-6">{takersStr || ""}</td>
                                                 </tr>
                                               );
                                             });
                                          })}
                                        </React.Fragment>
                                      );
                                   })}
                                 </tbody>
                               </table>
                             </div>
                           ))}
                         </div>

                         <div className="mt-4 text-center text-xl font-bold">
                           תזכו למצוות
                         </div>
                       </div>
                    </div>
                  )}

                  {showChaptersModal && selectedTractate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">מסכת {selectedTractate} - בחירת פרקים</h3>
              <button onClick={() => { setShowChaptersModal(false); setSelectedTractate(null); setManualAssignName(""); }} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
               <button onClick={selectAllAvailableChapters} className="text-sm text-blue-600 font-medium hover:underline">בחר את כל הפרקים הפנויים</button>
            </div>
            <div className="overflow-y-auto flex-1 grid grid-cols-3 gap-2 pb-4">
              {Array.from({ length: TRACTATE_CHAPTERS[selectedTractate] }).map((_, i) => {
                const isTaken = !!tractatesData[selectedTractate]?.chapters?.[i];
                const c = isTaken ? tractatesData[selectedTractate].chapters[i] : null;
                const isTakenByMe = participantProfile && isTaken && c.takerName === participantProfile.name && c.takerPhone === participantProfile.phone;
                const isSelected = selectedChapters.includes(i);
                return (
                  <div key={i} onClick={() => { if (!isTaken) toggleChapterSelection(i); else if (isTakenByMe) handleReleaseChapter(selectedTractate, i); }} className={`border rounded-xl p-3 text-center transition ${isTakenByMe ? "bg-amber-100 border-amber-300" : isTaken ? "bg-slate-100 border-slate-200 opacity-60" : isSelected ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
                    <div className="font-bold">פרק {getHebrewChapter(i)}</div>
                  </div>
                )
              })}
            </div>
            {selectedChapters.length > 0 && (
              <>
                {isOrganizerRole && activeView === 'organizer' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                     <label className="block text-sm font-bold text-slate-700 mb-1">הקצאה ידנית של הלומד (אופציונלי):</label>
                     <input 
                       type="text" 
                       className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                       placeholder="הזן שם לומד (או השאר ריק כדי לקחת עבורך)" 
                       value={manualAssignName} 
                       onChange={e => setManualAssignName(e.target.value)} 
                     />
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 mt-2">
                  <button onClick={handleTakeSelectedChapters} className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium text-lg">
                    {isOrganizerRole && activeView === 'organizer' && manualAssignName.trim() !== "" 
                      ? `הקצה ${selectedChapters.length} פרקים ל-${manualAssignName}` 
                      : `קבלת ${selectedChapters.length} פרקים בלי נדר`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl relative">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">שיתוף האירוע</h3>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 flex justify-center mb-6 shadow-inner">
              <QRCode value={typeof window !== 'undefined' ? window.location.href : ""} size={180} />
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={copyLink} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                <LinkIcon className="w-5 h-5" />
                העתקת קישור לאירוע
              </button>
              <button onClick={copyTextAndLink} className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                <Copy className="w-5 h-5" />
                העתקת הודעת הזמנה + קישור
              </button>
              <button onClick={copyAppShare} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-100 transition-colors border border-emerald-200 mt-2">
                <Share2 className="w-5 h-5" />
                שיתוף האפליקציה לזיכוי הרבים
              </button>
              <div className="text-center mt-2 text-sm text-slate-500 font-medium">קוד אירוע להזנה ידנית: {id}</div>
            </div>
          </div>
        </div>
      )}

      {showOrganizerTractateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">פירוט: מסכת {showOrganizerTractateModal}</h3>
              <button onClick={() => setShowOrganizerTractateModal(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-3">
              {(() => {
                const chaptersMap = tractatesData[showOrganizerTractateModal]?.chapters || {};
                const chaptersKeys = Object.keys(chaptersMap).map(Number).sort((a,b) => a - b);
                if (chaptersKeys.length === 0) {
                  return <div className="text-center text-slate-500 py-6">טרם נלקחו פרקים במסכת זו.</div>;
                }
                
                const groups: Record<string, {takerName: string, takerPhone: string, isCompleted: boolean, chapters: number[]}> = {};
                chaptersKeys.forEach(chNum => {
                   const cData = chaptersMap[chNum];
                   const key = `${cData.takerName}_${cData.takerPhone || ''}_${cData.isCompleted}`;
                   if (!groups[key]) {
                      groups[key] = {
                         takerName: cData.takerName,
                         takerPhone: cData.takerPhone,
                         isCompleted: cData.isCompleted,
                         chapters: []
                      };
                   }
                   groups[key].chapters.push(chNum);
                });

                const formatRanges = (nums: number[]) => {
                  if (nums.length === 0) return "";
                  let ranges = [];
                  let start = nums[0];
                  let end = nums[0];
                  for (let i = 1; i < nums.length; i++) {
                    if (nums[i] === end + 1) {
                       end = nums[i];
                    } else {
                       ranges.push(start === end ? getHebrewChapter(start) : `${getHebrewChapter(start)}-${getHebrewChapter(end)}`);
                       start = nums[i];
                       end = nums[i];
                    }
                  }
                  ranges.push(start === end ? getHebrewChapter(start) : `${getHebrewChapter(start)}-${getHebrewChapter(end)}`);
                  return ranges.join(', ');
                };

                return Object.values(groups).map((grp, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800">פרקים {formatRanges(grp.chapters)}</span>
                      {grp.isCompleted ? (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">הושלם</span>
                      ) : (
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-md">בתהליך</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      <div><span className="font-medium">נלקח על ידי:</span> {grp.takerName}</div>
                      {grp.takerPhone && <div><span className="font-medium">טלפון:</span> {grp.takerPhone}</div>}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
          </div>
        </div>
      )}

      {/* Daily Learning Modal */}
      <DailyLearningModal 
        isOpen={!!selectedTractateForDaily}
        onClose={() => setSelectedTractateForDaily(null)}
        tractate={selectedTractateForDaily || ''}
        totalChapters={selectedTractateTotalChapters}
        targetDateStr={event?.shloshimDateStr || event?.yahrzeitDateStr}
        passingDateStr={event?.passingDate}
      />

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={!!selectedTractateForCalendar}
        onClose={() => setSelectedTractateForCalendar(null)}
        tractate={selectedTractateForCalendar || ''}
        event={event}
        eventId={id as string}
      />
    </div>
  );
}
