/**
 * Lowercase + strip Latin diacritics, so "Ecole" matches a typed "ecole".
 *
 * Note: Arabic is left untouched (no alef/hamza folding, no tatweel removal),
 * which matters for the Arabic-only lycee dataset.
 */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function normalize(s: string): string {
  return s.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}
