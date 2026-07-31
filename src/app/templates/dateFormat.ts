/**
 * Format a date string to MM/YYYY style.
 * Handles: "2026-07" → "07/2026", "2026" → "2026", "Present" → "Present", "" → ""
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

/**
 * Legacy sentinel values that used to be stored directly in `dateFin` to mean
 * "ongoing". Kept only so old records can be migrated onto the `enCours` flag.
 */
export const ONGOING_SENTINELS = ['Present', 'En cours', 'حاليا'];

export function isOngoingSentinel(raw: string | undefined): boolean {
  return !!raw && ONGOING_SENTINELS.includes(raw.trim());
}

/** The "ongoing" wording for the active UI language. */
export function ongoingLabel(language: string): string {
  if (language === 'fr') return 'En cours';
  if (language === 'ar') return 'حاليا';
  return 'Present';
}

/**
 * End-date text for an experience/formation entry.
 * `enCours` wins over `dateFin`, so the stored date survives a toggle and the
 * printed wording always follows the current language.
 */
export function endDateLabel(
  entry: { dateFin?: string; enCours?: boolean },
  language: string,
): string {
  if (entry.enCours) return ongoingLabel(language);
  return fmtDate(entry.dateFin);
}

/**
 * "MM/YYYY - MM/YYYY" for an entry, collapsing gracefully when only one side is
 * known. Falls back to the legacy `annee` field used by older formations.
 */
export function dateRangeLabel(
  entry: { dateDebut?: string; dateFin?: string; enCours?: boolean; annee?: string },
  language: string,
): string {
  const start = fmtDate(entry.dateDebut);
  const end = endDateLabel(entry, language);
  if (start && end) return `${start} - ${end}`;
  return start || end || entry.annee || '';
}
