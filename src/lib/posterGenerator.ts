export async function generateCompletionPoster(deceasedName: string, dateHebrew: string, participants: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080; // 1:1 Instagram/WhatsApp ready
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Draw background
      // Elegant dark blue/gold gradient
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, "#0f172a"); // slate-900
      gradient.addColorStop(1, "#1e3a8a"); // blue-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Draw decorative border
      ctx.strokeStyle = "#fbbf24"; // amber-400
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 1000, 1000);
      
      // Inner border
      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, 970, 970);

      // Setup text rendering
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fcd34d"; // amber-300
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.fillText('בס"ד', 540, 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Arial, sans-serif";
      ctx.fillText('הסתיים לימוד ש"ס משניות', 540, 220);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 56px Arial, sans-serif";
      ctx.fillText('לעילוי נשמת', 540, 310);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 96px Arial, sans-serif";
      ctx.fillText(deceasedName, 540, 430);

      ctx.fillStyle = "#cbd5e1"; // slate-300
      ctx.font = "40px Arial, sans-serif";
      ctx.fillText(`סיום הלימוד התקיים בתאריך ${dateHebrew}`, 540, 520);

      // Divider
      ctx.beginPath();
      ctx.moveTo(340, 560);
      ctx.lineTo(740, 560);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.stroke();

      if (participants.length > 0) {
        ctx.fillStyle = "#94a3b8"; // slate-400
        ctx.font = "bold 36px Arial, sans-serif";
        ctx.fillText('יישר כוח לכל הלומדים שהשתתפו במצווה:', 540, 630);

        // Draw participants in a grid
        ctx.fillStyle = "#ffffff";
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
          ctx.fillStyle = "#94a3b8";
          ctx.fillText(`ועוד ${uniqueParticipants.length - maxToShow} לומדים נוספים...`, 540, startY + (row * 50));
        }
      } else {
        ctx.fillStyle = "#fcd34d"; // amber-300
        ctx.font = "bold 48px Arial, sans-serif";
        ctx.fillText('יישר כוח לכל הלומדים שהשתתפו במצווה!', 540, 700);
      }

      // Footer
      ctx.fillStyle = "#fbbf24";
      ctx.font = "32px Arial, sans-serif";
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
