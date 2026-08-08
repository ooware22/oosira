import { Candidate, Experience, Formation, Langue } from '../data';
import { isOngoingSentinel } from '../templates/dateFormat';
import { mapLanguageLevel } from './languageLevel';

/**
 * Shape/format normalisation for CV data coming from outside the builder:
 * the backend `cv_data` JSONField, the guest localStorage draft, and OCR import.
 *
 * Two problems are handled here:
 *
 * 1. `cv_data` is a free-form JSONField, so a record written by an older build
 *    can be missing whole arrays. Anything that does `formData.experiences.map`
 *    then throws and — with no error boundary — blanks the app.
 *
 * 2. "Ongoing" used to be stored by overwriting `dateFin` with a localised
 *    sentinel ("En cours" / "Present" / "حاليا"). That destroyed the typed date
 *    and broke when the UI language changed. It is now the `enCours` flag.
 */

export const EMPTY_CANDIDATE: Candidate = {
  id: 0,
  prenom: '',
  nom: '',
  titre: '',
  email: '',
  telephone: '',
  ville: '',
  linkedin: '',
  accroche: '',
  formations: [],
  experiences: [],
  competences: [],
  langues: [],
  logiciels: [],
  iconName: '',
  cardColor: '',
  recommendedTemplate: 1,
};

function migrateOngoing<T extends { dateFin?: string; enCours?: boolean }>(entry: T): T {
  if (entry.enCours !== undefined) return entry;
  if (!isOngoingSentinel(entry.dateFin)) return entry;
  // Legacy sentinel: the real end date is unrecoverable, but clearing it here
  // means the field reads as empty rather than showing a foreign-language
  // string inside a `type="month"` input.
  return { ...entry, enCours: true, dateFin: '' };
}

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function migrateLevel(l: Langue): Langue {
  const mapped = mapLanguageLevel(l.niveau);
  return mapped === l.niveau ? l : { ...l, niveau: mapped };
}

/**
 * Surnames are written in full caps on a CV — the standard convention here,
 * and it makes the family name unambiguous to a recruiter scanning quickly.
 * Applied on the way in (so old records and OCR imports are fixed too) and
 * again at render, so no template can miss it.
 */
export function formatLastName(nom: string | undefined): string {
  return (nom || '').toLocaleUpperCase('fr-FR');
}

/**
 * Merge arbitrary stored CV data onto a complete `Candidate`, guaranteeing every
 * array exists and migrating legacy ongoing-date sentinels.
 */
export function normalizeCandidate(raw: unknown): Candidate {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<Candidate>;

  return {
    ...EMPTY_CANDIDATE,
    ...data,
    nom: formatLastName(data.nom),
    experiences: asArray<Experience>(data.experiences).map(migrateOngoing),
    formations: asArray<Formation>(data.formations).map(migrateOngoing),
    competences: asArray<string>(data.competences),
    logiciels: asArray<string>(data.logiciels),
    langues: asArray<Langue>(data.langues).map(migrateLevel),
  };
}
