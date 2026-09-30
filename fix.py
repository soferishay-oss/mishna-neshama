import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'<Link href=\"/notice\".*?</Link>', '', c, flags=re.MULTILINE | re.DOTALL)
with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

with open('src/app/event/[id]/page.tsx', 'r', encoding='utf-8') as f:
    c2 = f.read()
c2 = re.sub(r'import NoticeHub.*?\n', '', c2)
c2 = c2.replace("className={`hidden ${activeView === 'notice' ? 'print:hidden' : 'print:block'} bg-white", "className={`hidden print:block bg-white")
c2 = c2.replace("className={`min-h-screen ${activeView === 'notice' ? 'print:block' : 'print:hidden'} bg-slate-50 font-sans print:bg-white`}", "className={`min-h-screen bg-slate-50 font-sans print:bg-white`}")
c2 = re.sub(r'\{activeView === \'notice\' && \(.*?NoticeHub.*?\)\}', '', c2, flags=re.MULTILINE | re.DOTALL)
c2 = re.sub(r'<button\s+onClick=\{\(\) => handleSetView\(\'notice\'\)\}.*?</button>', '', c2, flags=re.MULTILINE | re.DOTALL)

with open('src/app/event/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c2)
