with open('src/app/event/[id]/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '@page { size: A4 portrait; margin: 1cm; }',
    '@page { size: A4 portrait; margin: 0.5cm; }'
)
c = c.replace(
    '.print-table-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0cm 1cm 1cm 1cm; background: white; box-sizing: border-box; }',
    '.print-table-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0cm 0.5cm 0.5cm 0.5cm; background: white; box-sizing: border-box; }'
)
c = c.replace(
    '<div className="text-center mb-4">',
    '<div className="text-center mb-2">'
)
c = c.replace(
    '<div className="mt-4 text-center text-xl font-bold">',
    '<div className="mt-2 text-center text-xl font-bold">'
)

with open('src/app/event/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
