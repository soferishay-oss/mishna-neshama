const fs = require('fs');
const https = require('https');

const SEFARIA_NAMES = {
  // Zeraim
  "ברכות": "Berakhot", "פאה": "Peah", "דמאי": "Demai", "כלאים": "Kilayim", "שביעית": "Sheviit", "תרומות": "Terumot", "מעשרות": "Maaserot", "מעשר שני": "Maaser_Sheni", "חלה": "Challah", "ערלה": "Orlah", "ביכורים": "Bikkurim",
  // Moed
  "שבת": "Shabbat", "עירובין": "Eruvin", "פסחים": "Pesachim", "שקלים": "Shekalim", "יומא": "Yoma", "סוכה": "Sukkah", "ביצה": "Beitzah", "ראש השנה": "Rosh_Hashanah", "תענית": "Taanit", "מגילה": "Megillah", "מועד קטן": "Moed_Katan", "חגיגה": "Chagigah",
  // Nashim
  "יבמות": "Yevamot", "כתובות": "Ketubot", "נדרים": "Nedarim", "נזיר": "Nazir", "סוטה": "Sotah", "גיטין": "Gittin", "קידושין": "Kiddushin",
  // Nezikin
  "בבא קמא": "Bava_Kamma", "בבא מציעא": "Bava_Metzia", "בבא בתרא": "Bava_Batra", "סנהדרין": "Sanhedrin", "מכות": "Makkot", "שבועות": "Shevuot", "עדויות": "Eduyot", "עבודה זרה": "Avodah_Zarah", "אבות": "Pirkei_Avot", "הוריות": "Horayot",
  // Kodashim
  "זבחים": "Zevachim", "מנחות": "Menachot", "חולין": "Chullin", "בכורות": "Bekhorot", "ערכין": "Arakhin", "תמורה": "Temurah", "כריתות": "Keritot", "מעילה": "Meilah", "תמיד": "Tamid", "מידות": "Middot", "קינים": "Kinnim",
  // Tohorot
  "כלים": "Kelim", "אהלות": "Oholot", "נגעים": "Negaim", "פרה": "Parah", "טהרות": "Tohorot", "מקואות": "Mikvaot", "נידה": "Niddah", "מכשירין": "Makhshirin", "זבים": "Zavim", "טבול יום": "Tevul_Yom", "ידים": "Yadayim", "עוקצין": "Oktzin"
};

async function fetchSefaria(name) {
  return new Promise((resolve) => {
    https.get(`https://www.sefaria.org/api/texts/Mishnah_${name}.1?context=0`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve({ name, ok: false, error: json.error });
          } else if (!json.he || json.he.length === 0) {
            resolve({ name, ok: false, error: 'Empty hebrew text' });
          } else {
            resolve({ name, ok: true });
          }
        } catch (e) {
          resolve({ name, ok: false, error: 'JSON parse error' });
        }
      });
    }).on('error', (err) => {
      resolve({ name, ok: false, error: err.message });
    });
  });
}

async function testAll() {
  const bad = [];
  for (const [heb, eng] of Object.entries(SEFARIA_NAMES)) {
    const res = await fetchSefaria(eng);
    if (!res.ok) {
      bad.push({ heb, eng, error: res.error });
      console.log(`❌ Failed: ${heb} (${eng}) - ${res.error}`);
    } else {
      console.log(`✅ OK: ${heb} (${eng})`);
    }
  }
  console.log('--- DONE ---');
  if (bad.length > 0) {
    console.log(bad);
  }
}

testAll();
