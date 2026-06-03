/**
 * Format a date string to MM/YY style.
 * Handles: "2026-07" → "07/26", "2026" → "2026", "Present" → "Present", "" → ""
 */
export function fmtDate(raw: string | undefined): string {
  if (!raw) return '';
  // Keep text values like "Present", "En cours", "حاليا"
  if (!/^\d/.test(raw)) return raw;
  // "YYYY-MM" → "MM/YY"
  const parts = raw.split('-');
  if (parts.length === 2) {
    const yyyy = parts[0];
    const mm = parts[1];
    return `${mm}/${yyyy}`;
  }
  // "YYYY" alone → keep as is
  return raw;
}
