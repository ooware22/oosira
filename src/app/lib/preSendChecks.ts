/**
 * Pre-send verification for a job application.
 *
 * Pure functions over data the send wizard already holds, so the checklist is
 * instant and needs no round trip. The point is narrow: catch the mistakes
 * that are embarrassing *after* the email has left — a letter still carrying
 * `[Nom de l'entreprise]`, an address typo, a CV with no phone number on it.
 *
 * Errors block the send. Warnings never do: this advises, it does not police,
 * and a candidate who genuinely wants a 200-word letter is allowed one.
 */

export type CheckLevel = 'error' | 'warn' | 'ok';

export interface PreSendCheck {
  id: string;
  level: CheckLevel;
  /** i18n key under `applications.check*` for the message shown to the user. */
  messageKey: string;
  /** Interpolated into the message when present (e.g. the company name). */
  value?: string;
}

export interface PreSendInput {
  recipientEmail: string;
  coverLetter: string;
  emailSubject: string;
  emailBody: string;
  companyName: string;
  jobTitle: string;
  letterFilename: string;
  cvFilename: string;
  /** From the linked CV, so we can tell the user the recruiter has no way back. */
  cvEmail?: string;
  cvPhone?: string;
  /** The connected mailbox the application will be sent from. Applications
   *  are only ever sent from the candidate's own address, so without one
   *  there is nothing to send with. */
  senderMailbox?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * Unfilled template slots. Covers the three shapes that actually show up:
 * `[Nom]` from a hand-written stub, `{{company}}` from a copied template, and
 * a run of X's. Deliberately requires 2+ inner characters so a legitimate
 * `[1]` footnote marker doesn't trip it.
 */
const PLACEHOLDER_PATTERNS = [
  /\[[^\]\n]{2,40}\]/,
  /\{\{[^}\n]{1,40}\}\}/,
  /\bX{3,}\b/i,
];

const MIN_LETTER_CHARS = 800;
const MAX_LETTER_CHARS = 3500;
const MAX_SUBJECT_CHARS = 120;

/** Strip the lightweight markup so length and mention checks judge the prose,
 *  not the asterisks and bullet dashes wrapped around it. */
function plainText(markup: string): string {
  return (markup || '')
    .replace(/\\([*\\])/g, '$1')
    .replace(/\*{1,3}/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .trim();
}

/** Accent- and case-insensitive containment, so "Sonatrach" matches
 *  "SONATRACH" and "Société Générale" matches "societe generale". */
function mentions(haystack: string, needle: string): boolean {
  const fold = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const target = fold(needle).trim();
  if (!target) return true; // nothing to look for is not a failure
  return fold(haystack).includes(target);
}

export function runPreSendChecks(input: PreSendInput): PreSendCheck[] {
  const checks: PreSendCheck[] = [];
  const add = (id: string, level: CheckLevel, messageKey: string, value?: string) =>
    checks.push({ id, level, messageKey, value });

  const letter = plainText(input.coverLetter);
  const body = plainText(input.emailBody);

  // ── Hard requirements ──
  // First, because nothing else matters without a mailbox to send from.
  add('mailbox', input.senderMailbox ? 'ok' : 'error',
    'applications.checkMailbox', input.senderMailbox || undefined);

  add('recipient', EMAIL_RE.test(input.recipientEmail.trim()) ? 'ok' : 'error',
    'applications.checkRecipient');

  // No separate "your address" check: the mail goes out from the connected
  // mailbox, so the sender address is Google's to vouch for, not ours.

  add('letterPresent', letter.length > 0 ? 'ok' : 'error', 'applications.checkLetterPresent');
  add('bodyPresent', body.length > 0 ? 'ok' : 'error', 'applications.checkBodyPresent');
  add('subjectPresent', input.emailSubject.trim().length > 0 ? 'ok' : 'error',
    'applications.checkSubjectPresent');

  // ── Advisory ──
  // Mailing yourself is almost always a mis-paste, but it is also exactly what
  // someone testing the feature does on purpose — hence a warning.
  const sameAddress =
    !!input.senderMailbox &&
    input.recipientEmail.trim().toLowerCase() === input.senderMailbox.trim().toLowerCase();
  add('distinctAddresses', sameAddress ? 'warn' : 'ok', 'applications.checkDistinctAddresses');

  add('companyMentioned', mentions(letter, input.companyName) ? 'ok' : 'warn',
    'applications.checkCompanyMentioned', input.companyName);

  add('jobMentioned', mentions(letter, input.jobTitle) ? 'ok' : 'warn',
    'applications.checkJobMentioned', input.jobTitle);

  const hasPlaceholder = PLACEHOLDER_PATTERNS.some(
    (re) => re.test(letter) || re.test(body) || re.test(input.emailSubject),
  );
  add('noPlaceholders', hasPlaceholder ? 'warn' : 'ok', 'applications.checkNoPlaceholders');

  const tooShort = letter.length > 0 && letter.length < MIN_LETTER_CHARS;
  const tooLong = letter.length > MAX_LETTER_CHARS;
  add('letterLength', tooShort || tooLong ? 'warn' : 'ok',
    tooShort ? 'applications.checkLetterShort' : 'applications.checkLetterLength');

  add('subjectLength', input.emailSubject.length > MAX_SUBJECT_CHARS ? 'warn' : 'ok',
    'applications.checkSubjectLength');

  const namedAttachments =
    /\.pdf$/i.test(input.letterFilename.trim()) && /\.pdf$/i.test(input.cvFilename.trim());
  add('attachmentNames', namedAttachments ? 'ok' : 'warn', 'applications.checkAttachmentNames');

  // A recruiter who wants to reply to the CV itself needs something to reply
  // to; a CV with neither email nor phone is a dead end.
  const reachable = Boolean((input.cvEmail || '').trim() || (input.cvPhone || '').trim());
  add('cvContact', reachable ? 'ok' : 'warn', 'applications.checkCvContact');

  return checks;
}

/** Send is only blocked by hard errors — warnings are advice, not a gate. */
export function hasBlockingError(checks: PreSendCheck[]): boolean {
  return checks.some((c) => c.level === 'error');
}

export function countByLevel(checks: PreSendCheck[]) {
  return {
    errors: checks.filter((c) => c.level === 'error').length,
    warnings: checks.filter((c) => c.level === 'warn').length,
    passed: checks.filter((c) => c.level === 'ok').length,
  };
}
