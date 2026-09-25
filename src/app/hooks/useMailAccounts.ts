'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/api/apiClient';

export interface MailAccount {
  id: string;
  provider: string;
  emailAddress: string;
  connectedAt: string;
}

/**
 * The mailboxes a user has connected for sending job applications.
 *
 * `googleConfigured` comes from the server so the UI can hide the connect
 * button entirely when no OAuth client is set up, rather than offering
 * something that can only fail.
 */
export function useMailAccounts() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/mail-accounts/');
      setAccounts(data.accounts || []);
      setGoogleConfigured(!!data.googleConfigured);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load mailboxes');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Open Google's consent screen in a popup and resolve once it closes.
   *
   * A popup rather than a full redirect because the user is usually mid-way
   * through the send wizard: navigating the whole tab away would throw out
   * everything they had filled in.
   */
  const connectGoogle = useCallback(async () => {
    const { authorizationUrl } = await apiFetch('/mail-accounts/google/authorize/');
    const popup = window.open(authorizationUrl, 'oosira-gmail', 'width=520,height=680');
    if (!popup) throw new Error('popup-blocked');

    await new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          resolve();
        }
      }, 500);
    });
    await refresh();
  }, [refresh]);

  const disconnect = useCallback(async (id: string) => {
    await apiFetch(`/mail-accounts/${id}/`, { method: 'DELETE' });
    await refresh();
  }, [refresh]);

  /**
   * Outlook and Yahoo have no self-serve OAuth path for a third-party app —
   * this connects with a per-app password the user generates themselves in
   * their own account settings, verified against the real mailbox server
   * side before it is stored.
   */
  const connectSMTP = useCallback(async (
    provider: 'microsoft' | 'yahoo', emailAddress: string, appPassword: string,
  ) => {
    await apiFetch('/mail-accounts/smtp/connect/', {
      method: 'POST',
      body: JSON.stringify({ provider, emailAddress, appPassword }),
    });
    await refresh();
  }, [refresh]);

  return {
    accounts,
    /** The mailbox applications will be sent from, if any. */
    active: accounts[0] || null,
    googleConfigured,
    loading,
    error,
    refresh,
    connectGoogle,
    connectSMTP,
    disconnect,
  };
}
