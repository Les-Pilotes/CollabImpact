/**
 * CSV helpers. The output is UTF-8 with a BOM so Excel / Numbers open
 * French accents correctly without import wizardry.
 */

const BOM = "﻿";

/**
 * Escape a single cell value for CSV. Wraps in quotes when the value contains
 * a comma, quote, newline or starts with whitespace; doubles inner quotes.
 */
export function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "string" ? value : String(value);
  // Prefix formula-like values (=, +, -, @) with a single quote to neutralize them
  // in spreadsheet apps (CSV injection mitigation).
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe) || /^\s|\s$/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Build a CSV string from a header row + body rows.
 * Returns a UTF-8 BOM-prefixed string (open as-is in Excel without import).
 */
export function buildCsv(header: string[], rows: unknown[][]): string {
  const lines = [
    header.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  return BOM + lines.join("\r\n");
}

/**
 * URL-safe slug for filenames. Drops accents and replaces non-alnum with -.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "export";
}

export function todayStamp(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}
