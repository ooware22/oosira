'use client';

import { useState } from 'react';
import {
  UserPlusIcon,
  EnvelopeIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useMailAccounts } from '@/app/hooks/useMailAccounts';

/**
 * Invite friends to Oosira by email, sent through the user's own connected
 * Gmail. Same sending mechanism and connect-prompt pattern as
 * MailboxSection/SendApplicationWizard, since a referral reads as personal
 * correspondence just like a job application does.
 */

const MAX_RECIPIENTS = 10;

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export default function ReferralSection() {
  const { t, language } = useLanguage();
  const { accounts, googleConfigured, loading, connectGoogle } = useMailAccounts();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [emailsInput, setEmailsInput] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: string[]; failed: { email: string; reason: string }[] } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const emails = parseEmails(emailsInput);
  const tooMany = emails.length > MAX_RECIPIENTS;

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      await connectGoogle();
    } catch (err: any) {
      setConnectError(
        err?.message === 'popup-blocked'
          ? (t('dashboard.mailboxPopupBlocked') || 'Autorisez les fenêtres pop-up pour connecter votre boîte mail.')
          : (err?.message || 'Connection failed'),
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleSend = async () => {
    if (!emails.length || tooMany) return;
    setSending(true);
    setSendError(null);
    setResult(null);
    try {
      const data = await apiFetch('/mail-accounts/referral/invite/', {
        method: 'POST',
        body: JSON.stringify({ to_emails: emails, note, language }),
      });
      setResult(data);
      if (data.sent?.length) {
        setEmailsInput('');
        setNote('');
      }
    } catch (err: any) {
      if (err?.data?.code === 'mailbox_required') {
        setSendError(t('dashboard.mailboxRequiredShort') || 'Connectez votre boîte mail Gmail pour inviter des amis.');
      } else if (err?.data?.code === 'referral_limit_reached') {
        setSendError(
          (t('dashboard.referralQuotaReached') || 'Limite mensuelle atteinte. Invitations restantes :')
          + ` ${err.data.remaining ?? 0}`,
        );
      } else {
        setSendError(err?.message || 'Failed to send invites');
      }
    } finally {
      setSending(false);
    }
  };

  const hasMailbox = accounts.length > 0;

  return (
    <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-txt flex items-center gap-2">
          <UserPlusIcon className="w-5 h-5 text-blue-500" />
          {t('dashboard.referralTitle') || 'Recommander Oosira'}
        </h3>
        <p className="text-[12px] text-txt-muted mt-1">
          {t('dashboard.referralDesc')
            || "Envoyez un e-mail personnel à vos amis depuis votre propre Gmail, avec les fonctionnalités d'Oosira, nos formules et un lien pour démarrer."}
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-txt-dim">{t('dashboard.loading') || 'Chargement...'}</p>
      ) : !hasMailbox ? (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-[12px] text-amber-700 dark:text-amber-400 mb-3 flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {t('dashboard.mailboxRequiredShort') || 'Connectez votre boîte mail Gmail pour inviter des amis.'}
          </p>
          {googleConfigured ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface2 border border-border rounded-xl text-[13px] font-medium text-txt hover:border-blue-500/40 transition-colors disabled:opacity-50"
            >
              <EnvelopeIcon className="w-4 h-4 text-blue-500" />
              {connecting
                ? (t('dashboard.mailboxConnecting') || 'Connexion...')
                : (t('dashboard.mailboxConnect') || 'Connecter Gmail')}
            </button>
          ) : (
            <p className="text-[12px] text-txt-muted">
              {t('dashboard.mailboxUnavailable') || "L'envoi d'e-mails n'est pas encore disponible sur ce serveur."}
            </p>
          )}
          {connectError && <p className="mt-3 text-[12px] text-red-500">{connectError}</p>}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface2/40 p-4">
            <p className="text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-2">
              {t('dashboard.referralPreviewTitle') || "Contenu de l'e-mail"}
            </p>
            <p className="text-[12px] text-txt-muted leading-relaxed">
              {t('dashboard.referralPreviewDesc')
                || "Votre message personnel, les fonctionnalités clés d'Oosira, nos formules actuelles et un lien pour créer un compte gratuitement."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              {t('dashboard.referralEmailsLabel') || "E-mails de vos amis (un par ligne, max 10)"}
            </label>
            <textarea
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              rows={3}
              placeholder={t('dashboard.referralEmailsPlaceholder') || 'ami1@example.com, ami2@example.com'}
              className="w-full bg-surface2/50 border border-border rounded-xl px-4 py-2.5 text-sm text-txt outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
            />
            {tooMany && (
              <p className="text-[11px] text-red-500">
                {t('dashboard.referralTooMany') || `Maximum ${MAX_RECIPIENTS} amis à la fois.`}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              {t('dashboard.referralNoteLabel') || 'Message personnel (optionnel)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t('dashboard.referralNotePlaceholder') || "J'utilise Oosira pour ma recherche d'emploi, je pense que ça peut t'aider aussi !"}
              className="w-full bg-surface2/50 border border-border rounded-xl px-4 py-2.5 text-sm text-txt outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !emails.length || tooMany}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-4 h-4" />
            {sending
              ? (t('dashboard.referralSending') || 'Envoi en cours...')
              : (t('dashboard.referralSend') || 'Envoyer les invitations')}
          </button>

          {sendError && <p className="text-[12px] text-red-500">{sendError}</p>}

          {result && (
            <div className="space-y-2">
              {result.sent.length > 0 && (
                <p className="text-[12px] text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  {(t('dashboard.referralSuccess') || 'Invitations envoyées à :')} {result.sent.join(', ')}
                </p>
              )}
              {result.failed.length > 0 && (
                <div className="text-[12px] text-amber-600 dark:text-amber-400 flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {t('dashboard.referralPartialFailure') || "Échec pour :"}{' '}
                    {result.failed.map((f) => `${f.email} (${f.reason})`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
