'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/api/apiClient';

export interface SubscriptionStatus {
  effectivePlan: string;
  ocrTrialUsed: boolean;
  pdfDownloadsThisMonth: number;
  pdfDownloadLimit: number;
  pdfDownloadsRemaining: number;
  subscriptionActiveUntil: string | null;
}

const CACHE_TTL = 60_000; // 1 minute – avoid hammering the endpoint

let globalCache: { data: SubscriptionStatus | null; ts: number } = {
  data: null,
  ts: 0,
};

/**
 * Lightweight hook to fetch and cache /api/users/subscription/status/.
 * Returns { subscription, loading, error, refresh }.
 *
 * The global cache ensures that multiple components mounting at the same
 * time don't fire duplicate requests.
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    globalCache.data,
  );
  const [loading, setLoading] = useState(!globalCache.data);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async (force = false) => {
    if (!force && globalCache.data && Date.now() - globalCache.ts < CACHE_TTL) {
      setSubscription(globalCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data: SubscriptionStatus = await apiFetch(
        '/users/subscription/status/',
      );
      globalCache = { data, ts: Date.now() };
      if (mountedRef.current) {
        setSubscription(data);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to load subscription');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStatus]);

  /** Force-refresh subscription status (e.g. after a download or OCR call). */
  const refresh = useCallback(() => fetchStatus(true), [fetchStatus]);

  /** Shorthand helpers */
  const isPro = subscription?.effectivePlan === 'pro';
  const canDownload =
    isPro || (subscription?.pdfDownloadsRemaining ?? 1) > 0;
  const canOcr = isPro || !(subscription?.ocrTrialUsed ?? false);

  return {
    subscription,
    loading,
    error,
    refresh,
    isPro,
    canDownload,
    canOcr,
  };
}

/**
 * Invalidate the global cache so the next `useSubscription` mount fetches fresh data.
 * Call after events that change quotas (download, OCR import).
 */
export function invalidateSubscriptionCache() {
  globalCache = { data: null, ts: 0 };
}
