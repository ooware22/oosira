'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for errors thrown in the root layout itself, where
 * `error.tsx` cannot help. Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
            Une erreur est survenue
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
            L&apos;application n&apos;a pas pu démarrer correctement.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: 'none',
              background: '#2563EB',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
