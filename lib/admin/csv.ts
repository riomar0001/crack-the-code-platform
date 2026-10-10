/**
 * Minimal RFC 4180 CSV writer with spreadsheet-injection protection.
 *
 * Team names and aliases are attacker-controlled free text that organisers
 * will open in Excel or Sheets. A value starting with = + - @ (or a tab /
 * carriage return) is interpreted as a formula there, so those cells are
 * prefixed with an apostrophe to force them back to text.
 */

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /[",\r\n]/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  let text = String(value);

  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (NEEDS_QUOTING.test(text)) text = `"${text.replace(/"/g, '""')}"`;

  return text;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];

  // CRLF and a UTF-8 BOM, so Excel opens accented names correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
