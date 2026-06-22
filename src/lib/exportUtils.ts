export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert("אין נתונים לייצוא");
    return;
  }
  
  const headers = Object.keys(data[0]);
  
  // Adding BOM for Hebrew support in Excel
  const BOM = "\uFEFF";
  let csvContent = BOM + headers.join(",") + "\n";
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if there are commas
      const strValue = String(value || "");
      if (strValue.includes(",") || strValue.includes("\"") || strValue.includes("\n")) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    });
    csvContent += values.join(",") + "\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
