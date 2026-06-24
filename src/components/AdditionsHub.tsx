import React, { useState, useRef, useEffect } from 'react';
import { ListTree, ChevronRight, ChevronDown, ArrowRight } from 'lucide-react';
import { DEFAULT_SYSTEM_TEXTS } from '@/lib/defaultTexts';

export default function AdditionsHub({ eventData, systemTexts }: { eventData: any, systemTexts: any }) {
  const isFemale = eventData?.deceasedGender === 'female';
  
  const categories = systemTexts?.categories || DEFAULT_SYSTEM_TEXTS.categories || [];
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeEdah, setActiveEdah] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  const itemRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    if (activeItemId && itemRefs.current[activeItemId]) {
      setTimeout(() => {
        itemRefs.current[activeItemId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeItemId]);

  const activeCategory = categories.find((c: any) => c.id === activeCategoryId);

  // Get unique edot from all categories that have edot to show in the selector
  const uniqueEdot = Array.from(new Set(
    categories
      .filter((c: any) => c.hasEdot)
      .flatMap((c: any) => (c.items || []).filter((i: any) => i.edah !== 'all').map((i: any) => i.edah))
  )) as string[];

  const processText = (text: string | undefined | null) => {
    if (!text) return "הטקסט ימולא על ידי מנהל המערכת";
    const name = eventData?.deceasedName || "פלוני בן פלוני";
    let processed = text.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
    processed = processed.replace(/פלוני בן פלוני/g, name).replace(/פלונית בת פלונית/g, name);
    return processed;
  };

  const EDOT_LABELS: Record<string, string> = {
    mizrach: "עדות המזרח",
    ashkenaz: "אשכנז",
    teiman: "תימן (בלדי)"
  };
  const getEdahLabel = (id: string) => EDOT_LABELS[id] || id;

  // Render view: Categories List
  if (!activeCategoryId) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="bg-slate-50 border-b p-4 text-center">
          <h2 className="text-xl font-bold text-slate-800 flex justify-center items-center gap-2">
            <ListTree className="w-5 h-5 text-blue-600" /> מאגר תפילות ותוכן
          </h2>
        </div>
        <div className="p-6 overflow-y-auto flex-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 align-start h-max">
          {categories.map((cat: any) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className="bg-white border-2 border-slate-100 hover:border-blue-400 p-6 rounded-2xl text-lg font-bold text-slate-700 hover:bg-blue-50 transition shadow-sm active:scale-[0.98] flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center">
                <ListTree className="w-6 h-6" />
              </div>
              {cat.name}
            </button>
          ))}
          {categories.length === 0 && (
             <div className="col-span-full text-center text-slate-500 py-8">אין קטגוריות זמינות כרגע.</div>
          )}
        </div>
      </div>
    );
  }

  // Render view: Edah Selector (if category requires it and edah not selected)
  if (activeCategory.hasEdot && !activeEdah) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
           <button onClick={() => setActiveCategoryId(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold text-sm">
             <ArrowRight className="w-4 h-4" /> חזור לנושאים
           </button>
           <h2 className="text-xl font-bold text-slate-800">{activeCategory.name}</h2>
           <div className="w-20"></div> {/* spacer */}
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <h3 className="text-xl font-bold text-center text-slate-800 mb-6">בחר נוסח</h3>
          <div className="space-y-4 max-w-md mx-auto">
            {uniqueEdot.map(edah => (
              <button 
                key={edah}
                onClick={() => setActiveEdah(edah)}
                className="w-full bg-white border-2 border-slate-100 hover:border-blue-400 p-5 rounded-2xl text-lg font-bold text-slate-700 hover:bg-blue-50 transition shadow-sm active:scale-[0.98]"
              >
                {getEdahLabel(edah)}
              </button>
            ))}
            {uniqueEdot.length === 0 && (
               <div className="text-center text-slate-500 py-4">אין טקסטים הזמינים לבחירת נוסח.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render view: Items List
  const availableItems = (activeCategory.items || []).filter((item: any) => {
    // Filter by edah if category has edot
    if (activeCategory.hasEdot && item.edah !== 'all' && item.edah !== activeEdah) return false;
    // Filter by gender
    if (item.gender !== 'both' && item.gender !== (isFemale ? 'female' : 'male')) return false;
    return true;
  }).sort((a: any, b: any) => a.title.localeCompare(b.title, 'he'));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 border-b p-4 flex justify-between items-center sticky top-0 z-10">
         <button 
           onClick={() => {
             if (activeCategory.hasEdot) setActiveEdah(null);
             else setActiveCategoryId(null);
           }} 
           className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold text-sm bg-white border px-3 py-1.5 rounded-lg shadow-sm"
         >
           <ArrowRight className="w-4 h-4" /> חזור
         </button>
         <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
           {activeCategory.name}
           {activeCategory.hasEdot && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold ml-2">נוסח {getEdahLabel(activeEdah as string)}</span>}
         </h2>
         <div className="w-20"></div> {/* spacer */}
      </div>
      
      <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/50">
        <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          {availableItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium bg-white">אין תוכן זמין בקטגוריה זו.</div>
          ) : (
            availableItems.map((item: any, idx: number) => (
            <div key={item.id} ref={(el) => { itemRefs.current[item.id] = el; }}>
              <button 
                onClick={() => setActiveItemId(activeItemId === item.id ? null : item.id)} 
                className={`w-full text-right px-6 py-4 transition flex justify-between items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'} hover:bg-blue-50 ${activeItemId === item.id ? 'bg-blue-50 border-r-4 border-blue-600' : 'border-r-4 border-transparent'}`}
              >
                <span className={`text-lg ${activeItemId === item.id ? 'font-black text-blue-800' : 'font-bold text-slate-700'}`}>{item.title}</span>
                {activeItemId === item.id ? (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {activeItemId === item.id && (
                <div className="bg-amber-50/40 p-6 md:p-8 border-b border-slate-200 shadow-inner">
                  <div 
                    className="font-serif text-xl md:text-2xl leading-[2.2] text-slate-800 text-right [&>p]:mb-4 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:mr-8 [&>ol]:mr-8 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: processText(item.content) }}
                  />
                </div>
              )}
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
