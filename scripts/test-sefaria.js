const fs = require('fs');

async function testFetchAll() {
  const name = "Berakhot";
  try {
    const res = await fetch(`https://www.sefaria.org/api/texts/Bartenura_on_Mishnah_${name}.1-9`);
    const data = await res.json();
    
    console.log("length of Bartenura data.he (chapters):", data.he.length);
    if (data.he.length === 9) {
      console.log("Bartenura chapter 1 length:", data.he[0].length);
      console.log("Bartenura chapter 9 length:", data.he[8].length);
    }
  } catch(e) {
    console.error("Error", e);
  }
}

testFetchAll();
