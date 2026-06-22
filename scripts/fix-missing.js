const fs = require('fs');

async function fixMissing() {
  const allData = JSON.parse(fs.readFileSync('./src/data/mishnah.json', 'utf8'));
  
  const missing = [
    { oldName: 'Beitza', newName: 'Beitzah' },
    { oldName: 'Tohorot', newName: 'Tahorot' }
  ];

  for (const item of missing) {
    const name = item.newName;
    console.log(`Fetching ${name}...`);
    try {
      const indexRes = await fetch(`https://www.sefaria.org/api/v2/raw/index/Mishnah_${name}`);
      const indexData = await indexRes.json();
      const numChapters = indexData.schema.lengths[0];
      
      const res = await fetch(`https://www.sefaria.org/api/texts/Mishnah_${name}.1-${numChapters}?vhe=Torat_Emet_357`);
      const data = await res.json();
      
      const bRes = await fetch(`https://www.sefaria.org/api/texts/Bartenura_on_Mishnah_${name}.1-${numChapters}`);
      const bData = await bRes.json();
      
      allData[item.oldName] = {
        heTitle: data.heTitle || name,
        chapters: data.he.map((chap, i) => ({
          text: chap,
          bartenura: bData.he && bData.he[i] ? bData.he[i] : []
        }))
      };
      console.log(`Fixed ${item.oldName}`);
    } catch(e) {
      console.error("Error fetching " + name, e.message);
    }
  }
  
  fs.writeFileSync('./src/data/mishnah.json', JSON.stringify(allData));
  console.log("Done fixing missing texts!");
}

fixMissing();
