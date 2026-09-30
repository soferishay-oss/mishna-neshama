with open('src/app/event/[id]/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<footer className="mt-16 text-slate-400 text-sm text-center px-4 pb-8 max-w-2xl mx-auto">',
    '<footer className="mt-16 text-slate-400 text-sm text-center px-4 pb-8 max-w-2xl mx-auto print:hidden">'
)

with open('src/app/event/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
