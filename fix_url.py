import re

with open('src/app/study/[id]/[tractate]/[chapter]/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Using regex to replace the specific fetch url inside fetchCommentary
c = re.sub(
    r'fetch\(`https://www.sefaria.org/api/texts/\$\{commentator\}_on_Mishnah_\$\{sefariaName\}\.\$\{chapterIndex \+ 1\}\?context=0`\)',
    r'fetch(`https://www.sefaria.org/api/texts/${commentator}_on_Mishnah_${sefariaName}.${chapterIndex + 1}.1-${fetchedText.length}?context=0`)',
    c
)

with open('src/app/study/[id]/[tractate]/[chapter]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
