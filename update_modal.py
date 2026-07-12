import sys
with open('src/app/create/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

modal_ui = '''
        {duplicateWarningEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">שים לב, אירוע דומה כבר קיים!</h3>
              <p className="text-slate-600 mb-4">
                <strong>{duplicateWarningEvent.organizerName}</strong> (טלפון: {duplicateWarningEvent.organizerPhone}) פתח לאחרונה מחזור לימוד לעילוי נשמת <strong>{duplicateWarningEvent.deceasedName}</strong>.
              </p>
              <p className="text-slate-600 mb-6">
                מס' האירוע הוא: <strong>{duplicateWarningEvent.id}</strong>
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const url = window.location.origin + '/join?id=' + duplicateWarningEvent.id;
                      navigator.clipboard.writeText(url);
                      alert('הקישור הועתק בהצלחה!');
                    }
                  }}
                  className="w-full flex items-center justify-center bg-blue-50 text-blue-700 font-medium py-3 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  העתק קישור להצטרפות במקום לפתוח חדש
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/event/' + duplicateWarningEvent.id;
                  }}
                  className="w-full flex items-center justify-center bg-slate-100 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  מעבר לאירוע הקיים
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setDuplicateWarningEvent(null);
                    setSkipDuplicateCheck(true);
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 100);
                  }}
                  className="w-full flex items-center justify-center bg-transparent border-2 border-red-200 text-red-600 font-medium py-3 rounded-xl hover:bg-red-50 transition-colors mt-2"
                >
                  בכל זאת אני מעוניין לפתוח אירוע חדש
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarningEvent(null)}
                  className="w-full flex items-center justify-center text-slate-400 font-medium py-2 hover:text-slate-600"
                >
                  ביטול וחזרה אחורה
                </button>
              </div>
            </div>
          </div>
        )}
'''

c = c.replace('</main>', modal_ui + '\n      </main>')

with open('src/app/create/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
