/**
 * Remembers the code from a referral link (`?ref=...`) until signup.
 *
 * A friend usually lands on the home page from the link and signs up a few
 * clicks, or a few days, later, so the code is kept in localStorage rather
 * than in the URL. It expires after 30 days, and the latest link wins.
 */

const KEY = 'oosira_referral';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_PATTERN = /^[A-Za-z0-9]{6,12}$/;

export function captureReferralFromUrl(): void {
  try {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (code && CODE_PATTERN.test(code)) {
      localStorage.setItem(KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() }));
    }
  } catch {
    /* storage unavailable: the signup simply won't be attributed */
  }
}

export function getPendingReferral(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw);
    if (typeof code !== 'string' || !CODE_PATTERN.test(code) || Date.now() - at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
}
