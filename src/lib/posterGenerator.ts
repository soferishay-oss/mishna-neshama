export async function generateCompletionPoster(deceasedName: string, dateHebrew: string, participants: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080; // 1:1 Instagram/WhatsApp ready
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Draw background - clean white for easy B&W printing
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1080, 1080);

      // Draw decorative outer border (slate-800)
      ctx.strokeStyle = "#1e293b"; // slate-800
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, 1000, 1000);
      
      // Draw inner decorative border (thin)
      ctx.strokeStyle = "#94a3b8"; // slate-400
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, 970, 970);
      ctx.strokeRect(60, 60, 960, 960);

      // Setup text rendering
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      
      // B"H
      ctx.fillStyle = "#64748b"; // slate-500
      ctx.font = "bold 40px Arial, sans-serif";
      ctx.fillText('בס"ד', 540, 120);

      // Main Titles
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.font = "bold 64px Arial, sans-serif";
      ctx.fillText('הסתיים לימוד ש"ס משניות', 540, 220);

      ctx.fillStyle = "#334155"; // slate-700
      ctx.font = "bold 50px Arial, sans-serif";
      ctx.fillText('לעילוי נשמת', 540, 310);

      // Name
      ctx.fillStyle = "#000000"; // black
      ctx.font = "bold 96px Arial, sans-serif";
      ctx.fillText(deceasedName, 540, 430);

      // Date
      ctx.fillStyle = "#475569"; // slate-600
      ctx.font = "40px Arial, sans-serif";
      ctx.fillText(`סיום הלימוד התקיים בתאריך ${dateHebrew}`, 540, 520);

      // Divider line
      ctx.beginPath();
      ctx.moveTo(340, 560);
      ctx.lineTo(740, 560);
      ctx.strokeStyle = "#cbd5e1"; // slate-300
      ctx.lineWidth = 2;
      ctx.stroke();

      if (participants.length > 0) {
        ctx.fillStyle = "#1e293b"; // slate-800
        ctx.font = "bold 36px Arial, sans-serif";
        ctx.fillText('יישר כוח לכל הלומדים שהשתתפו במצווה:', 540, 630);

        // Draw participants in a grid
        ctx.fillStyle = "#334155"; // slate-700
        ctx.font = "32px Arial, sans-serif";
        
        const uniqueParticipants = Array.from(new Set(participants));
        const maxToShow = 24;
        const toShow = uniqueParticipants.slice(0, maxToShow);
        const hasMore = uniqueParticipants.length > maxToShow;

        let startY = 700;
        let colX = [840, 540, 240]; // RTL layout: right, center, left

        toShow.forEach((p, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const y = startY + (row * 50);
          ctx.fillText(p, colX[col], y);
        });

        if (hasMore) {
          const row = Math.floor(toShow.length / 3) + 1;
          ctx.fillStyle = "#64748b"; // slate-500
          ctx.fillText(`ועוד ${uniqueParticipants.length - maxToShow} לומדים נוספים...`, 540, startY + (row * 50));
        }
      } else {
        ctx.fillStyle = "#1e293b"; // slate-800
        ctx.font = "bold 48px Arial, sans-serif";
        ctx.fillText('יישר כוח לכל הלומדים שהשתתפו במצווה!', 540, 700);
      }

      // Footer
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.fillText('תהא נשמתו צרורה בצרור החיים', 540, 1000);

      // Convert to image and download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `completion_poster_${deceasedName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      resolve();
    } catch (e) {
      console.error("Poster generation failed:", e);
      reject(e);
    }
  });
}
