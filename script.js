const fs = require('fs');
let content = fs.readFileSync('src/app/event/[id]/page.tsx', 'utf8');

const target =               </div>\r\n            </section>\r\n\r\n            <section className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-200">\r\n              <h3 className="font-bold text-red-800 mb-4 text-lg flex items-center gap-2">\r\n                <Trash2 className="w-5 h-5" />\r\n                ניהול וסיום האירוע\r\n              </h3>;

const replacement =               </div>\n            </section>\n\n            <section className="bg-slate-50 p-5 rounded-2xl shadow-sm border border-slate-200">\n              <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2">\n                <Settings2 className="w-5 h-5 text-slate-600" />\n                הגדרות מתקדמות\n              </h3>\n              <div className="flex flex-col gap-3">\n                <Link href={\/create?edit=\\} className="w-full bg-white text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-100 transition border border-slate-200 flex justify-center items-center gap-2">\n                  <Settings className="w-4 h-4" />\n                  עריכת פרטי האירוע ותאריכים\n                </Link>\n                <Link href={\/create?duplicate=\\} className="w-full bg-blue-50 text-blue-700 font-bold py-3 px-4 rounded-xl hover:bg-blue-100 transition border border-blue-200 flex justify-center items-center gap-2">\n                  <Copy className="w-4 h-4" />\n                  שכפול אירוע (לשנה הבאה)\n                </Link>\n              </div>\n            </section>\n\n            <section className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-200">\n              <h3 className="font-bold text-red-800 mb-4 text-lg flex items-center gap-2">\n                <Trash2 className="w-5 h-5" />\n                ניהול וסיום האירוע\n              </h3>;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/app/event/[id]/page.tsx', content);
  console.log("Success");
} else {
  console.log("Target not found");
}
