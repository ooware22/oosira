import { clearStoredPhoto } from '@/app/lib/cvPhoto';
import { invalidateSubscriptionCache } from '@/app/hooks/useSubscription';

/**
 * Browser-side data tied to the signed-in person. Cleared on logout so the
 * next person on this device (a shared family computer, a cybercafé) never
 * sees it, and so it can't leak into their account: the CV draft backup would
 * otherwise be imported into the next signup, and the plan/credit cache would
 * show the previous user's plan for up to a minute.
 */
export function clearUserBrowserData(): void {
  try {
    localStorage.removeItem('oosira_pending_cv');
    localStorage.removeItem('oosira_dismissed_notifs');
    localStorage.removeItem('previewCV');
  } catch {
    /* storage unavailable: nothing was stored either */
  }
  clearStoredPhoto();
  invalidateSubscriptionCache();
}
