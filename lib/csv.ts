/**
 * Génération de fichiers CSV lisibles directement par Excel en français :
 * séparateur « ; », encodage UTF-8 avec BOM, fins de ligne CRLF.
 */

export type CsvCell = string | number | boolean | null | undefined;

function formatCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return Number.isFinite(cell) ? String(cell) : "";
  if (typeof cell === "boolean") return cell ? "oui" : "non";

  let text = cell;
  // Neutralise les formules : un commentaire commençant par « = » ne doit pas
  // être exécuté par le tableur de la personne qui ouvre l'export.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[";\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, content: string): Response {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
