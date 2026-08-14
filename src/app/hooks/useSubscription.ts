'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/api/apiClient';

/**
 * Mirrors GET /users/subscription/status/.
 *
 * A `null` limit means unlimited, everywhere — deliberately distinct from 0,
 * which means the plan grants none. Anything deriving a "can they?" from these
 * has to treat null as yes.
 */
export interface SubscriptionStatus {
  effectivePlan: string;
  /** icon_type of the active plan, so badges match the pricing cards. */
  planIcon: string;
  subscriptionActiveUntil: string | null;

  /** Monthly AI allowance. On the free plan this is a lifetime grant. */
  coverLetterLimit: number | null;
  coverLettersThisMonth: number;
  coverLettersRemaining: number | null;
  coverLettersAreLifetime: boolean;

  /** Burst cap on top of the monthly allowance; null on plans without one. */
  dailyGenerationLimit: number | null;
  dailyGenerationsUsed: number;
  dailyGenerationsRemaining: number | null;
  nextDailyReset: string | null;

  pdfDownloadLimit: number | null;
  pdfDownloadsThisMonth: number;
  pdfDownloadsRemaining: number | null;

  ocrTrialUsed: boolean;
  ocrLimit: number | null;

  applicationEmailLimit: number | null;
  applicationEmailsSentThisMonth: number;
  applicationEmailsRemaining: number | null;
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

  /**
   * Shorthand helpers.
   *
   * `?? 1` covers two cases at once, both of which should permit: a null
   * remaining count means the plan is unlimited, and an absent subscription
   * means the status is still loading or errored. These gates are a UX
   * courtesy — the server enforces the real ones — so failing open here costs
   * a wasted round trip, while failing closed would lock out a paying user
   * over a slow request.
   */
  const isPaid = !!subscription && subscription.effectivePlan !== 'decouverte';

  const canDownload = (subscription?.pdfDownloadsRemaining ?? 1) > 0;
  const canOcr = subscription?.ocrLimit == null || !subscription.ocrTrialUsed;
  const canSendApplicationEmail =
    (subscription?.applicationEmailsRemaining ?? 1) > 0;

  // Two independent ceilings; either one being empty blocks generation.
  const canGenerateApplication =
    (subscription?.coverLettersRemaining ?? 1) > 0 &&
    (subscription?.dailyGenerationsRemaining ?? 1) > 0;

  /** True when it is only today's burst cap that is spent, not the allowance. */
  const dailyLimitReached =
    (subscription?.dailyGenerationsRemaining ?? 1) <= 0 &&
    (subscription?.coverLettersRemaining ?? 1) > 0;

  return {
    subscription,
    loading,
    error,
    refresh,
    isPaid,
    canDownload,
    canOcr,
    canGenerateApplication,
    canSendApplicationEmail,
    dailyLimitReached,
  };
}

/**
 * Invalidate the global cache so the next `useSubscription` mount fetches fresh data.
 * Call after events that change quotas (download, OCR import).
 */
export function invalidateSubscriptionCache() {
  globalCache = { data: null, ts: 0 };
}
