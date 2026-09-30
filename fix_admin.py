import re

with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Just replace arrow functions with normal functions so they get hoisted!
c = c.replace('const calculateStats = (eventsData: any) => {', 'function calculateStats(eventsData: any) {')
c = c.replace('const migrateOldTexts = (texts: any) => {', 'function migrateOldTexts(texts: any) {')
c = c.replace('const loadData = async () => {', 'async function loadData() {')

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
