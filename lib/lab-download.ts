/**
 * ChemEng Studio — Client-side CSV export helper for downloadable simulation results.
 * Serializes active inputs, computed outputs, and saved scenario comparisons without
 * transmitting data to external servers.
 */

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvExportSection {
  title: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export function downloadSimulationCsv(
  filenameBase: string,
  sections: CsvExportSection[]
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const lines: string[] = [];
  sections.forEach((section, index) => {
    if (index > 0) {
      lines.push('');
    }
    lines.push(escapeCsvCell(section.title));
    lines.push(section.headers.map(escapeCsvCell).join(','));
    for (const row of section.rows) {
      lines.push(row.map(escapeCsvCell).join(','));
    }
  });

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenameBase}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
