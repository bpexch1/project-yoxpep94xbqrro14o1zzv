import { FileText, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportColumn {
  key: string;
  label: string;
}

interface ExportButtonsProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  disabled?: boolean;
}

export function ExportButtons({ data, columns, filename, disabled }: ExportButtonsProps) {
  const exportPDF = () => {
    if (!data?.length) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(filename, 14, 14);
    autoTable(doc, {
      startY: 22,
      head: [columns.map((c) => c.label)],
      body: data.map((row) => columns.map((c) => row[c.key] ?? "")),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [0, 171, 129], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    });
    doc.save(`${filename}.pdf`);
  };

  const exportExcel = () => {
    if (!data?.length) return;
    const rows = data.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((c) => { obj[c.label] = row[c.key] ?? ""; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <div className="flex items-center gap-1.5 ml-auto">
      <button
        type="button"
        onClick={exportPDF}
        disabled={disabled || !data?.length}
        title="Export as PDF"
        className="inline-flex items-center gap-1 border-none rounded px-[9px] py-[3px] text-[12px] font-semibold transition-colors"
        style={{
          background: disabled || !data?.length ? "#ccc" : "#dc3545",
          color: "#fff",
          cursor: disabled || !data?.length ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <FileText className="w-[13px] h-[13px]" />
        PDF
      </button>
      <button
        type="button"
        onClick={exportExcel}
        disabled={disabled || !data?.length}
        title="Export as Excel"
        className="inline-flex items-center gap-1 border-none rounded px-[9px] py-[3px] text-[12px] font-semibold transition-colors"
        style={{
          background: disabled || !data?.length ? "#ccc" : "#28a745",
          color: "#fff",
          cursor: disabled || !data?.length ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <FileSpreadsheet className="w-[13px] h-[13px]" />
        Excel
      </button>
    </div>
  );
}
