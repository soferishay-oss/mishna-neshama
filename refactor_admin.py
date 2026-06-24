import re

with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add mammoth import
if 'import mammoth from' not in content:
    content = content.replace('import dynamic from "next/dynamic";', 'import dynamic from "next/dynamic";\nimport * as mammoth from "mammoth";')

# 2. Update states
# Remove adminActiveTab
state_to_remove = "const [adminActiveTab, setAdminActiveTab] = useState<'prayers' | 'halachot'>('prayers');"
content = content.replace(state_to_remove, """
  const categories = systemTexts?.categories || [];
  const [adminActiveCategoryId, setAdminActiveCategoryId] = useState<string>("prayers");
  const activeCategory = categories.find((c: any) => c.id === adminActiveCategoryId) || categories[0] || null;
""")

# 3. Add generic item handlers
# Replace all the handleAddPrayer, handleUpdatePrayer, handleDeletePrayer, handleAddHalacha, etc.
handlers_regex = re.compile(r'const handleAddPrayer.*?const handleDeleteHalacha = \(id: string\) => \{.*?\}\);\n  \};\n', re.DOTALL)

generic_handlers = """
  const handleAddCategory = () => {
    const name = prompt("הכנס שם לקטגוריה החדשה (למשל: מנהגים, סיפורים):");
    if (!name) return;
    const hasEdot = confirm("האם קטגוריה זו דורשת חלוקה לעדות (נוסחים)?\\nאישור = כן, ביטול = לא");
    const newCat = {
      id: "cat_" + Date.now().toString(),
      name,
      hasEdot,
      items: []
    };
    setSystemTexts((prev: any) => ({
      ...prev,
      categories: [...(prev.categories || []), newCat]
    }));
    setAdminActiveCategoryId(newCat.id);
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו ואת כל התוכן שבה?")) return;
    setSystemTexts((prev: any) => ({
      ...prev,
      categories: (prev.categories || []).filter((c: any) => c.id !== id)
    }));
    setAdminActiveCategoryId("prayers");
  };

  const handleAddItem = (categoryId: string) => {
    const cat = categories.find((c: any) => c.id === categoryId);
    if (!cat) return;
    const newItem = {
      id: Date.now().toString(),
      edah: cat.hasEdot ? activeEdah : 'all',
      title: "כותרת חדשה",
      content: "תוכן הטקסט...",
      gender: "both"
    };
    setSystemTexts((prev: any) => ({
      ...prev,
      categories: prev.categories.map((c: any) => {
        if (c.id === categoryId) {
          return { ...c, items: [...(c.items || []), newItem] };
        }
        return c;
      })
    }));
  };

  const handleUpdateItem = (categoryId: string, itemId: string, field: string, value: string) => {
    setSystemTexts((prev: any) => ({
      ...prev,
      categories: prev.categories.map((c: any) => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: (c.items || []).map((item: any) => item.id === itemId ? { ...item, [field]: value } : item)
          };
        }
        return c;
      })
    }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (!confirm("האם למחוק טקסט זה?")) return;
    setSystemTexts((prev: any) => ({
      ...prev,
      categories: prev.categories.map((c: any) => {
        if (c.id === categoryId) {
          return { ...c, items: (c.items || []).filter((item: any) => item.id !== itemId) };
        }
        return c;
      })
    }));
  };

  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        // Parse the HTML table
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('tr');
        if (rows.length === 0) {
          alert("לא נמצאו טבלאות בקובץ ה-Word. ודא שיש טבלה עם עמודה לכותרת ולתוכן.");
          return;
        }
        
        const cat = categories.find((c: any) => c.id === categoryId);
        const newItems: any[] = [];
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            // Right column is title, left is content (assuming RTL table)
            // But usually Word tables parsed left to right. Let's just take cell[0] as title, cell[1] as content if it's LTR, or reversed if RTL.
            // Let's assume standard LTR DOM order: cell[0] = Right (if RTL table), cell[1] = Left
            const title = cells[0].textContent?.trim() || "ללא כותרת";
            const contentHtml = cells[1].innerHTML;
            if (title && contentHtml) {
               newItems.push({
                 id: Date.now().toString() + Math.random().toString(),
                 edah: cat?.hasEdot ? activeEdah : 'all',
                 title: title,
                 content: contentHtml,
                 gender: 'both'
               });
            }
          }
        });
        
        if (newItems.length > 0) {
          setSystemTexts((prev: any) => ({
            ...prev,
            categories: prev.categories.map((c: any) => {
              if (c.id === categoryId) {
                return { ...c, items: [...(c.items || []), ...newItems] };
              }
              return c;
            })
          }));
          alert(`יובאו בהצלחה ${newItems.length} פריטים.`);
        } else {
          alert("לא נמצאו נתונים תקינים בטבלה.");
        }
      } catch (err) {
        console.error(err);
        alert("שגיאה בפיענוח קובץ ה-Word.");
      }
    };
    reader.readAsArrayBuffer(file);
    // clear input
    e.target.value = '';
  };
"""

# Replace safely
match = handlers_regex.search(content)
if match:
    content = content.replace(match.group(0), generic_handlers)

# 4. Update Export
export_regex = re.compile(r'const handleExportPrayersWord = \(\) => \{.*?\n  \};\n', re.DOTALL)
export_handler = """  const handleExportCategoryWord = (categoryId: string) => {
    const cat = categories.find((c: any) => c.id === categoryId);
    if (!cat) return;
    
    const itemsToExport = cat.items.filter((p: any) => 
      !cat.hasEdot ? true : (p.edah === activeEdah || p.edah === 'all')
    );
      
    const itemsHtml = itemsToExport.map((p: any) => `
      <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; margin-bottom: 30px;">
        <h2 style="color: #1e3a8a;">${p.title}</h2>
        <p style="font-size: 14pt; line-height: 1.8;">${p.content}</p>
      </div>
    `).join("<hr/>");
    
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export</title></head><body>${itemsHtml}</body></html>`;
      
    const blob = new Blob(['\\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cat.name}${cat.hasEdot ? '_' + getEdahLabel(activeEdah) : ''}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
"""
match = export_regex.search(content)
if match:
    content = content.replace(match.group(0), export_handler)

# 5. Update UI rendering
ui_regex = re.compile(r'\{\/\* Texts Editor with Tabs \*\/\}.*?<\/section>', re.DOTALL)
new_ui = """{/* Texts Editor with Tabs */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-slate-400" />
              עריכת נושאים, תפילות ותוכן
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleAddCategory}
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition"
              >
                <PlusCircle className="w-4 h-4" /> נושא חדש
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat: any) => (
              <button 
                key={cat.id}
                onClick={() => setAdminActiveCategoryId(cat.id)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${adminActiveCategoryId === cat.id ? 'bg-blue-600 shadow text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {activeCategory && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-blue-900">{activeCategory.name}</h3>
                  {activeCategory.id !== 'prayers' && activeCategory.id !== 'halachot' && (
                    <button onClick={() => handleDeleteCategory(activeCategory.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                      <Trash2 className="w-4 h-4"/> מחיקת נושא
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="bg-emerald-50 cursor-pointer text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition">
                    <PlusCircle className="w-4 h-4" /> ייבוא מ-Word
                    <input type="file" accept=".docx" className="hidden" onChange={(e) => handleImportWord(e, activeCategory.id)} />
                  </label>
                  <button 
                    onClick={() => handleExportCategoryWord(activeCategory.id)}
                    className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> ייצוא לוורד
                  </button>
                </div>
              </div>

              {activeCategory.hasEdot && (
                <div className="flex flex-wrap border-b mb-6 gap-2">
                  {uniqueEdot.map((edah: string) => (
                    <button 
                      key={edah}
                      className={`py-3 px-6 font-bold transition-colors ${activeEdah === edah ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                      onClick={() => setActiveEdah(edah)}
                    >
                      נוסח {getEdahLabel(edah)}
                    </button>
                  ))}
                  <button 
                    className="py-3 px-4 text-sm text-blue-600 font-bold hover:bg-slate-100 transition rounded-t-lg flex items-center gap-1"
                    onClick={() => {
                      const newEdahName = prompt("הכנס שם לעדה / נוסח חדש:");
                      if (!newEdahName) return;
                      // Just add a dummy prayer for this edah so it registers in uniqueEdot
                      const newId = Date.now().toString();
                      setSystemTexts((prev: any) => ({
                        ...prev,
                        categories: prev.categories.map((c: any) => {
                          if (c.id === 'prayers') {
                            return {
                              ...c,
                              items: [...(c.items || []), { id: newId, edah: newEdahName, title: "תפילה חדשה", content: "...", gender: "both" }]
                            };
                          }
                          return c;
                        })
                      }));
                      setActiveEdah(newEdahName);
                    }}
                  >
                    <PlusCircle className="w-4 h-4"/> הוסף נוסח חדש
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {(activeCategory.items || []).filter((item: any) => !activeCategory.hasEdot ? true : (item.edah === activeEdah || item.edah === 'all')).map((item: any) => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
                    <button 
                      onClick={() => handleDeleteItem(activeCategory.id, item.id)} 
                      className="absolute top-4 left-4 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl transition"
                      title="מחק פריט"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-12 md:pr-0">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1">כותרת</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-200 rounded-xl p-3 font-bold" 
                          value={item.title} 
                          onChange={e => handleUpdateItem(activeCategory.id, item.id, 'title', e.target.value)} 
                        />
                      </div>
                      <div className="flex gap-4">
                        {activeCategory.hasEdot && (
                          <div className="w-1/2">
                            <label className="block text-sm font-bold text-slate-600 mb-1">נוסח / עדה</label>
                            <select 
                              className="w-full border border-slate-200 rounded-xl p-3 bg-white"
                              value={item.edah}
                              onChange={e => handleUpdateItem(activeCategory.id, item.id, 'edah', e.target.value)}
                            >
                              <option value="all">לכל העדות והנוסחים</option>
                              {uniqueEdot.map((e: string) => <option key={e} value={e}>נוסח {getEdahLabel(e)}</option>)}
                            </select>
                          </div>
                        )}
                        <div className={activeCategory.hasEdot ? "w-1/2" : "w-full"}>
                          <label className="block text-sm font-bold text-slate-600 mb-1">מיועד למין</label>
                          <select 
                            className="w-full border border-slate-200 rounded-xl p-3 bg-white"
                            value={item.gender}
                            onChange={e => handleUpdateItem(activeCategory.id, item.id, 'gender', e.target.value)}
                          >
                            <option value="both">לגברים ולנשים כאחד</option>
                            <option value="male">לגברים בלבד (כמו אשכבה לאיש)</option>
                            <option value="female">לנשים בלבד (כמו אשכבה לאישה)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">תוכן הטקסט</label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white" dir="rtl">
                        <style>{`.ql-editor { text-align: right !important; direction: rtl !important; font-family: inherit; font-size: 1.125rem; }`}</style>
                        <ReactQuill 
                          theme="snow"
                          value={item.content || ""}
                          onChange={(content) => handleUpdateItem(activeCategory.id, item.id, 'content', content)}
                          modules={QUILL_MODULES}
                          className="font-serif text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => handleAddItem(activeCategory.id)} 
                  className="w-full py-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition flex justify-center items-center gap-2 bg-white"
                >
                  <PlusCircle className="w-5 h-5" /> הוסף פריט חדש ל{activeCategory.name}
                </button>
              </div>
            </div>
          )}
        </section>"""
match = ui_regex.search(content)
if match:
    content = content.replace(match.group(0), new_ui)

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done refactoring admin/page.tsx")
