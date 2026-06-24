import React, { useState } from 'react';
import { Settings, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function NoticeHub({ eventData }: { eventData?: any }) {
  const isFemale = eventData?.deceasedGender === 'female';
  
  const [noticeData, setNoticeData] = useState({
    topLine1: "בצער רב וביגון קודר אנו מודיעים על פטירת",
    showTopLine1: true,
    topLine2: isFemale ? "אמנו / סבתנו / אחותנו / אשתי היקרה" : "אבינו / סבנו / אחינו / בעלי היקר",
    showTopLine2: true,
    deceasedName: eventData?.deceasedName || "פלוני בן פלוני",
    familyNames: "משפחת ישראלי",
    showFamilyNames: true,
    funeralText: "תתקיים ביום שני בשעה 16:00 בבית העלמין סגולה פתח תקווה",
    showFuneral: true,
    shivaAddress: "רחוב הרצל 1, פתח תקווה",
    showShiva: true,
    shivaHours: "10:00-14:00, 16:00-22:00",
    showShivaHours: true,
    prayerTimes: "שחרית: 07:00, מנחה וערבית: 17:30",
    showPrayerTimes: true,
    font: "sans-serif",
    borderThickness: "medium",
    orientation: "portrait",
    showBarcode: !!eventData?.id
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none h-full">
      <div className="p-4 md:p-6 overflow-y-auto h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:w-full print:h-full print:p-0">
          {/* Editor Panel - Hidden on Print */}
          <div className="lg:col-span-4 space-y-4 print:hidden">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> עריכת המודעה</h3>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showTopLine1} onChange={e => setNoticeData({...noticeData, showTopLine1: e.target.checked})} />
                    שורת פתיחה 1
                  </label>
                  {noticeData.showTopLine1 && <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.topLine1} onChange={e => setNoticeData({...noticeData, topLine1: e.target.value})} />}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showTopLine2} onChange={e => setNoticeData({...noticeData, showTopLine2: e.target.checked})} />
                    שורת פתיחה 2
                  </label>
                  {noticeData.showTopLine2 && <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.topLine2} onChange={e => setNoticeData({...noticeData, topLine2: e.target.value})} />}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">שם הנפטר</label>
                  <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.deceasedName} onChange={e => setNoticeData({...noticeData, deceasedName: e.target.value})} />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showFuneral} onChange={e => setNoticeData({...noticeData, showFuneral: e.target.checked})} />
                    פרטי הלוויה
                  </label>
                  {noticeData.showFuneral && (
                    <div className="mt-2 space-y-2 p-2 bg-slate-50 rounded-lg border">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">המשך המשפט "ההלוויה..."</label>
                        <textarea rows={2} className="w-full border p-2 rounded-lg text-sm" value={noticeData.funeralText} onChange={e => setNoticeData({...noticeData, funeralText: e.target.value})} placeholder="תתקיים היום בשעה 16:00..." />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showShiva} onChange={e => setNoticeData({...noticeData, showShiva: e.target.checked})} />
                    כתובת השבעה
                  </label>
                  {noticeData.showShiva && <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.shivaAddress} onChange={e => setNoticeData({...noticeData, shivaAddress: e.target.value})} />}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showShivaHours} onChange={e => setNoticeData({...noticeData, showShivaHours: e.target.checked})} />
                    שעות ניחומים
                  </label>
                  {noticeData.showShivaHours && <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.shivaHours} onChange={e => setNoticeData({...noticeData, shivaHours: e.target.value})} />}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showPrayerTimes} onChange={e => setNoticeData({...noticeData, showPrayerTimes: e.target.checked})} />
                    זמני תפילה
                  </label>
                  {noticeData.showPrayerTimes && <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.prayerTimes} onChange={e => setNoticeData({...noticeData, prayerTimes: e.target.value})} />}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                    <input type="checkbox" checked={noticeData.showFamilyNames} onChange={e => setNoticeData({...noticeData, showFamilyNames: e.target.checked})} />
                    שם המשפחה להודעה
                  </label>
                  {noticeData.showFamilyNames && <input type="text" className="w-full border p-2 rounded-lg text-sm" value={noticeData.familyNames} onChange={e => setNoticeData({...noticeData, familyNames: e.target.value})} />}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">כיוון הדפסה</label>
                    <select className="w-full border p-2 rounded-lg text-sm" value={noticeData.orientation} onChange={e => setNoticeData({...noticeData, orientation: e.target.value as any})}>
                      <option value="portrait">לאורך (Portrait)</option>
                      <option value="landscape">לרוחב (Landscape)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">עובי מסגרת</label>
                    <select className="w-full border p-2 rounded-lg text-sm" value={noticeData.borderThickness} onChange={e => setNoticeData({...noticeData, borderThickness: e.target.value as any})}>
                      <option value="thin">דקה</option>
                      <option value="medium">בינונית</option>
                      <option value="thick">עבה</option>
                    </select>
                  </div>
                </div>
                
                <div className={`pt-2 border-t mt-2 ${(!eventData || !eventData.id) ? 'opacity-50' : ''}`}>
                   <label className={`flex items-center gap-2 text-sm font-bold text-slate-700 ${(!eventData || !eventData.id) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 disabled:cursor-not-allowed" 
                        checked={noticeData.showBarcode} 
                        disabled={!eventData || !eventData.id}
                        onChange={e => setNoticeData({...noticeData, showBarcode: e.target.checked})} 
                      />
                      הוסף ברקוד ללימוד משניות בתחתית המודעה
                      {(!eventData || !eventData.id) && (
                        <span className="text-xs font-normal text-slate-500 mr-2">[לא זמין - לא נוצר עדיין אירוע]</span>
                      )}
                   </label>
                </div>
              </div>
              
              <button onClick={handlePrint} className="w-full mt-4 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2">
                <Printer className="w-5 h-5" />
                הדפס או שמור ל-PDF
              </button>
              <div className="text-center mt-2 text-xs text-slate-400">יש לוודא בהגדרות ההדפסה שהכיוון הנבחר תואם</div>
            </div>
          </div>

          {/* Preview Panel - Becomes full screen on print */}
          <div className="lg:col-span-8 bg-slate-200 p-2 md:p-8 rounded-2xl flex items-center justify-center overflow-auto print:bg-white print:p-0">
            {/* The Notice Poster */}
            <div 
              className={`w-full bg-white flex flex-col items-center text-center justify-center 
                ${noticeData.orientation === 'portrait' ? 'aspect-[1/1.4] max-w-lg' : 'aspect-[1.4/1] max-w-2xl'}
                ${noticeData.borderThickness === 'thin' ? 'border-[6px] p-8 print:border-[8px]' : noticeData.borderThickness === 'thick' ? 'border-[24px] p-12 print:border-[30px]' : 'border-[12px] p-10 print:border-[16px]'}
                border-black print:fixed print:inset-0 print:w-full print:h-full print:max-w-none print:aspect-auto
              `}
              style={{ fontFamily: noticeData.font, boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}
              id="notice-poster"
            >
              {/* Print styling injection */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page { size: ${noticeData.orientation}; margin: 1cm; }
                  body * { visibility: hidden; }
                  #notice-poster, #notice-poster * { visibility: visible; }
                  #notice-poster { position: fixed; left: 0; top: 0; width: 100%; height: 100%; box-shadow: none !important; margin: 0; padding: 2cm; box-sizing: border-box; display: flex !important; flex-direction: column !important; justify-content: space-between !important; align-items: center !important; }
                }
              `}} />

              {(() => {
                const isLandscape = noticeData.orientation === 'landscape';
                const printSizes = {
                  topLine1: isLandscape ? "print:text-[1.3rem]" : "print:text-[1.6rem]",
                  topLine2: isLandscape ? "print:text-[1.1rem]" : "print:text-[1.4rem]",
                  deceasedName: isLandscape ? "print:text-[3.5rem]" : "print:text-[4.5rem]",
                  funeralInfo: isLandscape ? "print:text-[1.2rem]" : "print:text-[1.5rem]",
                  shivaHours: isLandscape ? "print:text-[1.1rem] print:px-4 print:py-2" : "print:text-[1.3rem] print:px-6 print:py-2",
                  familyNames: isLandscape ? "print:text-[1.3rem]" : "print:text-[1.6rem]",
                  barcodeTextTitle: isLandscape ? "print:text-base" : "print:text-lg",
                  barcodeTextSub: isLandscape ? "print:text-xs" : "print:text-sm",
                  barcodeQr: isLandscape ? "print:w-16 print:h-16" : "print:w-20 print:h-20"
                };
                return (
                  <>
                    <div className="flex-1 flex flex-col justify-center items-center w-full my-auto gap-3 print:gap-3">
                      {(noticeData.showTopLine1 || noticeData.showTopLine2) && (
                        <div className="flex flex-col items-center">
                          {noticeData.showTopLine1 && noticeData.topLine1 && <div className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-1 ${printSizes.topLine1} print:leading-tight`}>{noticeData.topLine1}</div>}
                          {noticeData.showTopLine2 && noticeData.topLine2 && <div className={`text-xl md:text-2xl lg:text-3xl ${printSizes.topLine2}`}>{noticeData.topLine2}</div>}
                        </div>
                      )}
                      
                      <div className={`text-5xl md:text-6xl lg:text-8xl font-black leading-tight ${printSizes.deceasedName} print:leading-tight`}>
                        {noticeData.deceasedName}
                      </div>
                      
                      {noticeData.showFuneral && (
                        <div className={`text-lg md:text-xl lg:text-2xl ${printSizes.funeralInfo} print:leading-normal whitespace-pre-wrap font-bold`}>
                          ההלוויה {noticeData.funeralText}
                        </div>
                      )}
                      
                      {noticeData.showShiva && (
                        <div className={`text-lg md:text-xl lg:text-2xl ${printSizes.funeralInfo} print:leading-normal`}>
                          יושבים שבעה בכתובת:<br/>
                          <span className="font-bold">{noticeData.shivaAddress}</span>
                        </div>
                      )}
                      
                      {noticeData.showShivaHours && (
                        <div className={`text-md md:text-lg lg:text-xl bg-black text-white px-6 py-2 inline-block ${printSizes.shivaHours}`}>
                          שעות ניחומים: {noticeData.shivaHours}
                        </div>
                      )}

                      {noticeData.showPrayerTimes && (
                        <div className={`text-md md:text-lg lg:text-xl font-bold border-2 border-black px-6 py-2 inline-block ${printSizes.shivaHours}`}>
                          {noticeData.prayerTimes}
                        </div>
                      )}
                      
                      {noticeData.showFamilyNames && (
                        <div className={`text-xl md:text-2xl lg:text-3xl font-bold ${printSizes.familyNames} mt-auto`}>
                          המשפחה האבלה: {noticeData.familyNames}
                        </div>
                      )}
                    </div>
                    
                    {noticeData.showBarcode && (
                      <div className="mt-8 pt-6 border-t-2 border-slate-200 w-full flex justify-between items-center px-4 print:mt-4 print:pt-4 print:border-black shrink-0">
                         <div className="text-right">
                           <div className={`font-bold text-sm mb-1 ${printSizes.barcodeTextTitle}`}>לימוד משניות משותף:</div>
                           <div className={`text-xs ${printSizes.barcodeTextSub}`}>סרוק את הקוד להצטרפות ללימוד</div>
                         </div>
                         <div className="border p-2 print:border-4 print:p-2 bg-white">
                           <QRCode value={typeof window !== 'undefined' ? window.location.href : ""} size={80} className={printSizes.barcodeQr} />
                         </div>
                      </div>
                    )}
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
