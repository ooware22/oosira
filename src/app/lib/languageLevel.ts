import { normalize } from '@/lib/normalize';

/**
 * The only 5 values the app's i18n dictionary actually has translations for
 * (`builder.level_*` in dictionaries.ts). Anything else renders as a raw,
 * untranslated key path — which is what OCR-imported CVs were doing, since
 * the AI backend returns free text like "Excellent" or "avancé" with no
 * constraint to this set.
 */
export const LANGUAGE_LEVELS = [
  'Natif',
  'Courant',
  'Intermediaire',
  'Technique',
  'Debutant',
] as const;

export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

/** Keyword → canonical level, checked as a substring after accent-stripping. */
const KEYWORD_MAP: [string, LanguageLevel][] = [
  ['natif', 'Natif'],
  ['native', 'Natif'],
  ['maternelle', 'Natif'],
  ['mother tongue', 'Natif'],
  ['excellent', 'Natif'],
  ['bilingue', 'Natif'],
  ['bilingual', 'Natif'],
  ['courant', 'Courant'],
  ['avance', 'Courant'],
  ['fluent', 'Courant'],
  ['advanced', 'Courant'],
  ['proficient', 'Courant'],
  ['intermediaire', 'Intermediaire'],
  ['intermediate', 'Intermediaire'],
  ['moyen', 'Intermediaire'],
  ['technique', 'Technique'],
  ['working', 'Technique'],
  ['professionnel', 'Technique'],
  ['debutant', 'Debutant'],
  ['basique', 'Debutant'],
  ['basic', 'Debutant'],
  ['beginner', 'Debutant'],
  ['elementaire', 'Debutant'],
];

/** CEFR scale letters map onto the same 5 buckets. */
const CEFR_MAP: Record<string, LanguageLevel> = {
  a1: 'Debutant',
  a2: 'Debutant',
  b1: 'Intermediaire',
  b2: 'Courant',
  c1: 'Courant',
  c2: 'Natif',
};

/**
 * Coerce arbitrary free text (from OCR, legacy saves, or hand-typed values)
 * onto one of the 5 canonical language levels the UI can actually translate.
 * Already-canonical values pass straight through. Unrecognized input falls
 * back to "Intermediaire" — a safe middle value, and (unlike the old default)
 * spelled to actually match the dictionary key.
 */
export function mapLanguageLevel(raw: string | undefined | null): LanguageLevel {
  if (!raw) return 'Intermediaire';
  const trimmed = raw.trim();
  if ((LANGUAGE_LEVELS as readonly string[]).includes(trimmed)) {
    return trimmed as LanguageLevel;
  }

  const n = normalize(trimmed);

  const cefr = n.match(/\b([abc][12])\b/);
  if (cefr) return CEFR_MAP[cefr[1]];

  for (const [keyword, level] of KEYWORD_MAP) {
    if (n.includes(keyword)) return level;
  }

  return 'Intermediaire';
}
