// src/api/apiClient.ts
// Central API client with JWT auth header injection

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Get the stored JWT token from localStorage.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('oosira_token');
}

/**
 * Store the JWT token in localStorage.
 * Also sets a lightweight cookie so the server-side middleware
 * can detect that the user is logged in (the cookie is just a flag,
 * NOT the actual JWT — auth still uses the Bearer header).
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('oosira_token', token);
    // Sync a session flag cookie for middleware route protection
    document.cookie = 'oosira_session=1; path=/; max-age=604800; SameSite=Lax';
  }
}

/**
 * Remove the JWT token from localStorage and clear the session cookie.
 */
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('oosira_token');
    localStorage.removeItem('oosira_refresh_token');
    // Remove the session flag cookie
    document.cookie = 'oosira_session=; path=/; max-age=0; SameSite=Lax';
  }
}

/**
 * Get the refresh token from localStorage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('oosira_refresh_token');
}

/**
 * Store the refresh token in localStorage.
 */
export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('oosira_refresh_token', token);
  }
}

/**
 * What to do when the session can no longer be refreshed.
 *
 * The default is a hard navigation to /login, which destroys any unsaved work
 * in the page. Long-lived editors (the CV builder) override this so they can
 * stash the draft and prompt in place instead of vanishing.
 */
type SessionExpiredHandler = () => void;

const defaultSessionExpired: SessionExpiredHandler = () => {
  if (typeof window !== 'undefined') window.location.href = '/login';
};

let sessionExpiredHandler: SessionExpiredHandler = defaultSessionExpired;

/** Returns a restore function; call it on unmount. */
export function setSessionExpiredHandler(fn: SessionExpiredHandler): () => void {
  const previous = sessionExpiredHandler;
  sessionExpiredHandler = fn;
  return () => {
    sessionExpiredHandler = previous;
  };
}

/**
 * Authenticated fetch wrapper that auto-injects the Bearer token.
 * Throws on non-ok responses with the response body as JSON.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${endpoint} returned HTML/invalid JSON.`);
    } else {
      console.warn(`API ${endpoint} returned OK but invalid JSON:`, text.substring(0, 100));
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isRetry) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setToken(refreshData.access);
            // SimpleJWT runs ROTATE_REFRESH_TOKENS with BLACKLIST_AFTER_ROTATION,
            // so the old refresh token is dead the moment this succeeds. Failing
            // to store the new one meant the *next* refresh replayed a
            // blacklisted token, forcing a logout mid-session.
            if (refreshData.refresh) setRefreshToken(refreshData.refresh);
            return apiFetch(endpoint, options, true);
          } else {
            clearToken();
            sessionExpiredHandler();
          }
        } catch (e) {
          // Network failure while refreshing: the session may still be valid,
          // so keep the tokens and let the caller surface the error.
          console.error('Token refresh request failed:', e);
        }
      } else {
        clearToken();
      }
    }

    const message = data?.detail || data?.message || data?.email?.[0] || 'Request failed';
    const apiError = new Error(typeof message === 'string' ? message : JSON.stringify(message)) as Error & {
      status?: number; data?: any;
    };
    apiError.status = response.status;
    // Keep the parsed body: several endpoints return a `field` key alongside
    // `detail` so the UI can mark the offending input rather than showing a
    // generic banner. Without this it was thrown away.
    apiError.data = data;
    throw apiError;
  }

  return data;
}
