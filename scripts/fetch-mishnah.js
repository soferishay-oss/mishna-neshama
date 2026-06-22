const fs = require('fs');

const tractates = [
  "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
  "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitza", "Rosh Hashanah", "Taanit", "Megillah", "Moed Katan", "Chagigah",
  "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
  "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Eduyot", "Avodah Zarah", "Avot", "Horayot",
  "Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim",
  "Kelim", "Oholot", "Negaim", "Parah", "Tohorot", "Mikvaot", "Niddah", "Makhshirin", "Zavim", "Tevul Yom", "Yadayim", "Oktzin"
];

async function fetchAll() {
  const allData = {};
  for (const name of tractates) {
    console.log(`Fetching ${name}...`);
    try {
      const indexRes = await fetch(`https://www.sefaria.org/api/v2/raw/index/Mishnah_${name}`);
      const indexData = await indexRes.json();
      const numChapters = indexData.schema.lengths[0];
      
      const res = await fetch(`https://www.sefaria.org/api/texts/Mishnah_${name}.1-${numChapters}?vhe=Torat_Emet_357`);
      const data = await res.json();
      
      const bRes = await fetch(`https://www.sefaria.org/api/texts/Bartenura_on_Mishnah_${name}.1-${numChapters}`);
      const bData = await bRes.json();
      
      allData[name] = {
        heTitle: data.heTitle || name,
        chapters: data.he.map((chap, i) => ({
          text: chap,
          bartenura: bData.he && bData.he[i] ? bData.he[i] : []
        }))
      };
    } catch(e) {
      console.error("Error fetching " + name, e.message);
    }
  }
  
  if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data');
  }
  
  fs.writeFileSync('./src/data/mishnah.json', JSON.stringify(allData));
  console.log("Done fetching all Mishnah texts!");
}

fetchAll();
