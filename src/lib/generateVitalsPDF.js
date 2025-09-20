import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

/**
 * rows: [{ date: Date|string, v1:number, v2?:number, v3?:number }]
 * headers: e.g. ["FECHA MEDICIÓN","SISTÓLICA","DIASTÓLICA","PULSO"]
 * title: e.g. "PRESIÓN ARTERIAL"
 * user: { nombre?: string, folio?: string }
 */


export function generateVitalsPDF({ title, headers, rows, user = {} }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;

  // Fondo azul marino en toda la página
  doc.setFillColor(12, 28, 58);
  doc.rect(0, 0, pageW, pageH, "F");

  // Logo VITACARD 365 con recuadro naranja
  const logoX = marginX;
  const logoY = 48;
  const logoH = 40;
  const logoW = 260;
  // Recuadro naranja
  doc.setDrawColor(237, 106, 72);
  doc.setLineWidth(3);
  doc.setFillColor(12, 28, 58);
  doc.roundedRect(logoX, logoY, logoW, logoH, 8, 8, 'FD');
  // VITA (naranja, bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(237, 106, 72);
  doc.text("VITA", logoX + 16, logoY + 30);
  // CARD (blanco, bold)
  doc.setTextColor(255,255,255);
  doc.text("CARD", logoX + 80, logoY + 30);
  // 365 (naranja, bold)
  doc.setTextColor(237, 106, 72);
  doc.text("365", logoX + 170, logoY + 30);

  // Título a la derecha, dos líneas si es necesario
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(255,255,255);
  const titleLines = title.toUpperCase().split(" ");
  const title1 = titleLines.slice(0,2).join(" ");
  const title2 = titleLines.slice(2).join(" ");
  doc.text(title1, pageW - marginX, logoY + 18, { align: "right" });
  if (title2) {
    doc.text(title2, pageW - marginX, logoY + 42, { align: "right" });
  }

  // Datos usuario
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255,255,255);
  const nombre = user?.nombre || "—";
  const folio = user?.folio || "—";
  doc.text(`Usuario: ${nombre}`, logoX, logoY + logoH + 28);
  doc.text(`Folio VitaCard: ${folio}`, logoX, logoY + logoH + 48);

  // Tabla
  const tableBody = rows.map((r) => {
    const f = r.date instanceof Date ? r.date : new Date(r.date);
    const fechaFmt = isNaN(f) ? String(r.date) : format(f, "dd/MM/yyyy HH:mm");
    const cols = [fechaFmt];
    if (typeof r.v1 !== "undefined") cols.push(r.v1);
    if (typeof r.v2 !== "undefined") cols.push(r.v2);
    if (typeof r.v3 !== "undefined") cols.push(r.v3);
    return cols;
  });

  autoTable(doc, {
    startY: logoY + logoH + 70,
    head: [headers],
    body: tableBody,
    styles: {
      font: "helvetica",
      fontSize: 14,
      textColor: [255,255,255],
      halign: 'center',
      cellPadding: 10,
      fillColor: [12,28,58],
      lineColor: [237,106,72],
      lineWidth: 1.2,
    },
    headStyles: {
      fillColor: [237, 106, 72],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 15,
      halign: 'center',
      lineColor: [237,106,72],
      lineWidth: 1.5,
    },
    alternateRowStyles: { fillColor: [22, 34, 58] },
    tableLineColor: [237, 106, 72],
    tableLineWidth: 1.2,
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => {
      // footer fijo abajo
      const y = pageH - 60;
      doc.setDrawColor(255,255,255);
      doc.setLineWidth(1.2);
      doc.line(marginX, y - 18, pageW - marginX, y - 18);
      doc.setFontSize(15);
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica", "bold");
      doc.text("Términos y Condiciones:", pageW / 2, y, { align: "center" });
    },
  });

  // Guarda
  const today = format(new Date(), "yyyyMMdd-HHmm");
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}_${today}.pdf`);
}

/**
 * Helper: toma una lista de mediciones {date, ...} y regresa solo últimos 7 días
 */
export function last7Days(data) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return (data || [])
    .filter((d) => new Date(d.date) >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
