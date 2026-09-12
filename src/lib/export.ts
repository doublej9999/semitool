/**
 * Client-side CSV export utility for SemiTools engineering calculators.
 */

/**
 * Escapes a cell value for safe inclusion in a CSV row.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates and triggers a browser file download for a CSV string.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  if (typeof window === 'undefined') return;

  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/**
 * Triggers a download of an SVG element as an .svg image file.
 */
export function downloadSvg(svgElement: SVGSVGElement, filename: string): void {
  if (typeof window === 'undefined' || !svgElement) return;

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Ensure xmlns is present for standalone SVG file
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.svg') ? filename : `${filename}.svg`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates a PDF document entirely client-side and triggers its download.
 *
 * jsPDF is dynamically imported so it never lands in the initial bundles; the
 * document is only built when the caller invokes this function. `render` draws
 * into a fresh A4 portrait document (units: mm) before it is saved.
 */
export async function downloadPdf(
  filename: string,
  title: string,
  render: (doc: import('jspdf').jsPDF) => void,
): Promise<void> {
  if (typeof window === 'undefined') return;

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({ title });

  render(doc);

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Generates a single-sheet .xlsx workbook client-side and triggers its download.
 *
 * The sheet gets a bold header row (row 1, frozen), an auto-filter over the
 * header and auto-sized column widths. ExcelJS is dynamically imported so it
 * stays out of the initial bundles.
 */
export async function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
): Promise<void> {
  if (typeof window === 'undefined') return;

  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'SemiTools';
  workbook.created = new Date();

  // Excel sheet names are limited to 31 characters.
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: Math.max(1, headers.length) },
  };

  headers.forEach((header, index) => {
    const longest = rows.reduce(
      (max, row) => Math.max(max, String(row[index] ?? '').length),
      header.length,
    );
    sheet.getColumn(index + 1).width = Math.min(42, Math.max(10, longest + 2));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
