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
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('oosira_token', token);
  }
}

/**
 * Remove the JWT token from localStorage.
 */
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('oosira_token');
    localStorage.removeItem('oosira_refresh_token');
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
  const data = text ? JSON.parse(text) : {};

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
            return apiFetch(endpoint, options, true);
          } else {
            clearToken();
            window.location.href = '/login';
          }
        } catch (e) {
          clearToken();
        }
      } else {
        clearToken();
      }
    }

    const message = data?.detail || data?.message || data?.email?.[0] || 'Request failed';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data;
}
