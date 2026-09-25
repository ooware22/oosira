'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { XMarkIcon, EnvelopeIcon, KeyIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const PROVIDER_INFO = {
  microsoft: {
    label: 'Outlook',
    helpUrl: 'https://account.live.com/proofs/AppPassword',
    domainHint: '@outlook.com, @hotmail.com, @live.com',
  },
  yahoo: {
    label: 'Yahoo',
    helpUrl: 'https://login.yahoo.com/myaccount/security',
    domainHint: '@yahoo.com, @yahoo.fr',
  },
} as const;

/**
 * Outlook and Yahoo have no self-serve OAuth path a third-party app can use
 * the way Gmail's `connectGoogle()` does — no popup consent screen exists.
 * The workable alternative both providers do offer is a per-app password the
 * user generates themselves in their own account's security settings, which
 * this modal collects and verifies (server side, against the real mailbox)
 * before storing it.
 */
export default function ConnectSMTPMailboxModal({ provider, onConnect, onClose }: {
  provider: 'microsoft' | 'yahoo';
  /** Throws with a user-facing message on failure (invalid credentials, unreachable server, etc). */
  onConnect: (emailAddress: string, appPassword: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const info = PROVIDER_INFO[provider];
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onConnect(email.trim(), appPassword.trim());
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Connection failed');
    } finally {
      setBusy(false);
    }
  };

  // Portalled to <body>: this modal is opened from inside cards that use
  // backdrop-blur themselves, and a backdrop-filter ancestor creates a new
  // containing block for `position: fixed` — without the portal the overlay
  // would be trapped inside that card's own bounds instead of covering the
  // viewport.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[95vw] max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-bold text-txt flex items-center gap-2">
            <EnvelopeIcon className="w-5 h-5 text-blue-500" />
            {(t('smtpModal.title') || 'Connecter {provider}').replace('{provider}', info.label)}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 px-3.5 py-3">
            <KeyIcon className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-[11.5px] text-txt leading-relaxed">
              {(t('smtpModal.explain')
                || "{provider} ne propose pas de fenêtre de connexion directe. Générez un mot de passe d'application dans les paramètres de sécurité de votre compte {provider}, puis collez-le ici.")
                .replace(/{provider}/g, info.label)}
              {' '}
              <a
                href={info.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('smtpModal.helpLink') || 'Générer le mot de passe'}
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              {t('smtpModal.emailLabel') || 'Adresse e-mail'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={info.domainHint}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-txt outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              {t('smtpModal.passwordLabel') || "Mot de passe d'application"}
            </label>
            <input
              type="password"
              required
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              autoComplete="off"
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-txt outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-mono"
            />
            <p className="text-[10.5px] text-txt-dim">
              {t('smtpModal.passwordHint')
                || "Pas votre mot de passe habituel, mais un mot de passe distinct généré spécialement pour cette connexion."}
            </p>
          </div>

          {error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-txt-muted hover:bg-surface2 transition-colors"
            >
              {t('smtpModal.cancel') || 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={busy || !email || !appPassword}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (t('smtpModal.connecting') || 'Connexion...') : (t('smtpModal.connect') || 'Connecter')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
