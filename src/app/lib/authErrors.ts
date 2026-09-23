/**
 * Turns any failure from the sign-up / sign-in / password endpoints into a
 * message the user can act on, in their language, plus the field it concerns.
 *
 * The backend returns a stable `code` (accounts/auth_errors.py) and, for
 * password problems, the list of rules that failed. Situations with no code
 * are recognised too: no connection at all, a server error, too many attempts.
 */

type Translate = (key: string) => string;

export type AuthErrorInfo = {
  message: string;
  field?: string;
  code?: string;
};

export type ApiErrorLike = {
  message?: string;
  status?: number;
  data?: {
    code?: string;
    field?: string;
    detail?: string;
    reasons?: string[];
    minLength?: number | null;
    retryAfter?: number | null;
  };
};

/** `t` returns the key itself when a translation is missing. */
export function tAuth(t: Translate, key: string, fallback: string): string {
  const value = t(key);
  return value && value !== key ? value : fallback;
}
const tr = tAuth;

export const MIN_PASSWORD_LENGTH = 8;

/** Password rules that can be checked while typing (the server also rejects
 *  common passwords and ones too close to the name or email). */
export function passwordRuleState(password: string) {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    notNumeric: password.length > 0 && !/^\d+$/.test(password),
  };
}

export function passwordMeetsLocalRules(password: string): boolean {
  const s = passwordRuleState(password);
  return s.length && s.notNumeric;
}

function passwordReasonMessage(t: Translate, reason: string, minLength: number): string {
  switch (reason) {
    case 'too_short':
      return tr(t, 'auth.errors.password_too_short', 'Le mot de passe doit contenir au moins {n} caractères.')
        .replace('{n}', String(minLength));
    case 'too_common':
      return tr(t, 'auth.errors.password_too_common', 'Ce mot de passe est trop courant, choisissez-en un moins facile à deviner.');
    case 'entirely_numeric':
      return tr(t, 'auth.errors.password_entirely_numeric', 'Le mot de passe ne peut pas contenir uniquement des chiffres.');
    case 'too_similar':
      return tr(t, 'auth.errors.password_too_similar', 'Le mot de passe ressemble trop à votre nom ou à votre e-mail.');
    default:
      return tr(t, 'auth.errors.password_invalid', "Ce mot de passe n'est pas accepté.");
  }
}

const FALLBACKS: Record<string, string> = {
  name_required: 'Veuillez saisir votre nom.',
  name_too_long: 'Votre nom est trop long.',
  email_required: 'Veuillez saisir votre adresse e-mail.',
  email_invalid: "Cette adresse e-mail n'est pas valide.",
  email_taken: 'Un compte existe déjà avec cette adresse e-mail.',
  password_required: 'Veuillez saisir un mot de passe.',
  invalid_credentials: 'E-mail ou mot de passe incorrect.',
  account_disabled: 'Ce compte a été désactivé. Contactez le support si vous pensez que c’est une erreur.',
  current_password_incorrect: 'Votre mot de passe actuel est incorrect.',
  email_send_failed: "Nous n'avons pas pu envoyer l'e-mail pour le moment. Réessayez dans quelques minutes.",
  token_missing: 'Ce lien de réinitialisation est incomplet. Utilisez le lien reçu par e-mail.',
  token_invalid: "Ce lien de réinitialisation n'est plus valide (il a peut-être déjà été utilisé).",
  token_expired: 'Ce lien de réinitialisation a expiré (il est valable 1 heure).',
};

export function describeAuthError(err: unknown, t: Translate): AuthErrorInfo {
  const e = (err ?? {}) as ApiErrorLike;
  const data = e.data ?? {};

  // No HTTP status at all: the request never reached the server.
  if (e.status === undefined) {
    return {
      code: 'network',
      message: tr(t, 'auth.errors.network', 'Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.'),
    };
  }

  if (e.status === 429 || data.code === 'throttled') {
    const wait = data.retryAfter;
    return {
      code: 'throttled',
      message: wait
        ? tr(t, 'auth.errors.throttled_wait', 'Trop de tentatives. Réessayez dans {s} secondes.').replace('{s}', String(wait))
        : tr(t, 'auth.errors.throttled', 'Trop de tentatives. Patientez un instant avant de réessayer.'),
    };
  }

  const code = data.code;
  if (code === 'password_invalid') {
    const min = data.minLength || MIN_PASSWORD_LENGTH;
    const reasons = data.reasons?.length ? data.reasons : ['invalid'];
    return {
      code,
      field: data.field,
      message: Array.from(new Set(reasons)).map((r) => passwordReasonMessage(t, r, min)).join(' '),
    };
  }
  if (code && FALLBACKS[code]) {
    return { code, field: data.field, message: tr(t, `auth.errors.${code}`, FALLBACKS[code]) };
  }

  if (e.status >= 500) {
    return {
      code: 'server',
      message: tr(t, 'auth.errors.server', 'Le serveur rencontre un problème. Réessayez dans quelques instants.'),
    };
  }

  return {
    code: code || 'unknown',
    field: data.field,
    message: tr(t, 'auth.errors.unknown', 'Une erreur inattendue est survenue. Réessayez.'),
  };
}
