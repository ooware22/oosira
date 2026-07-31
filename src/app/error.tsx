'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary. Without one, a single render throw (e.g. mapping
 * over a CV array that a legacy record never had) unmounts the whole tree and
 * the user just sees a blank page — which is what testers reported as "the
 * window closes".
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-txt px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold">Une erreur est survenue</h1>
        <p className="text-sm text-txt-muted">
          Votre travail en cours a été conservé localement. Réessayez, ou revenez
          au tableau de bord.
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-surface2 transition-colors"
          >
            Tableau de bord
          </Link>
        </div>
        {error?.digest && (
          <p className="text-[11px] text-txt-dim pt-2">Réf. {error.digest}</p>
        )}
      </div>
    </div>
  );
}
