'use client';

import { useEffect, useState } from 'react';
import {
  UserPlusIcon,
  EnvelopeIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useMailAccounts } from '@/app/hooks/useMailAccounts';
import { invalidateSubscriptionCache } from '@/app/hooks/useSubscription';

/**
 * Invite friends to Oosira. The personal link (copy / WhatsApp) works for
 * everyone; the email invite goes out through the user's own connected Gmail,
 * same sending mechanism as job applications. When a friend signs up through
 * the link and builds a first CV, both get bonus AI generations.
 */

const MAX_RECIPIENTS = 10;

type ReferralInfo = {
  code: string;
  link: string;
  rewardAmount: number;
  joined: number;
  rewarded: number;
  bonusEarned: number;
  bonusBalance: number;
  rewardCap: number;
  rewardsLeft: number;
};

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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.42zm8.02-17.45A11.33 11.33 0 0 0 12.05.72C5.8.72.72 5.8.72 12.05c0 2 .52 3.95 1.52 5.66L.62 23.28l5.7-1.5a11.3 11.3 0 0 0 5.72 1.46h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.31-8.01z" />
    </svg>
  );
}

function ReferralLinkCard() {
  const { t } = useLanguage();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/users/referral/')
      .then((data: ReferralInfo) => {
        if (cancelled) return;
        setInfo(data);
        // A reward may have landed since the credit counter was cached.
        if (data.bonusEarned > 0) invalidateSubscriptionCache();
      })
      .catch((err: { message?: string }) => { if (!cancelled) setError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, []);

  const copy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.link);
    } catch {
      // Older browsers / insecure contexts: fall back to a selection copy.
      const input = document.createElement('input');
      input.value = info.link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amount = info?.rewardAmount ?? 5;
  const shareText = (t('dashboard.referralShareText')
    || "J'utilise Oosira pour créer mon CV et postuler. Inscris-toi avec mon lien, on reçoit tous les deux des générations IA offertes :")
    + ' ' + (info?.link ?? '');
  const pending = info ? Math.max(0, info.joined - info.rewarded) : 0;

  return (
    <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-txt flex items-center gap-2">
          <GiftIcon className="w-5 h-5 text-emerald-500" />
          {(t('dashboard.referralRewardTitle') || 'Gagnez +{n} générations IA par ami').replace('{n}', String(amount))}
        </h3>
        <p className="text-[12px] text-txt-muted mt-1 leading-relaxed">
          {(t('dashboard.referralRewardDesc')
            || "Quand un ami s'inscrit avec votre lien et crée son premier CV, vous recevez tous les deux +{n} générations IA (jusqu'à {cap} amis). Elles n'expirent pas.")
            .replace('{n}', String(amount))
            .replace('{cap}', String(info?.rewardCap ?? 20))}
        </p>
      </div>

      {error ? (
        <p className="text-[12px] text-red-500">{error}</p>
      ) : !info ? (
        <div className="h-24 rounded-xl bg-surface2/60 animate-pulse" />
      ) : (
        <>
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              {t('dashboard.referralLinkLabel') || 'Votre lien de parrainage'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-2 bg-surface2/50 border border-border rounded-xl px-3 py-2.5">
                <LinkIcon className="w-4 h-4 shrink-0 text-txt-muted" />
                <input
                  readOnly
                  value={info.link}
                  onFocus={(e) => e.target.select()}
                  dir="ltr"
                  className="flex-1 min-w-0 bg-transparent text-sm text-txt outline-none"
                />
              </div>
              <button
                onClick={copy}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                {copied ? (t('dashboard.referralCopied') || 'Copié !') : (t('dashboard.referralCopy') || 'Copier')}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:brightness-95 transition"
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              [info.joined, t('dashboard.referralStatJoined') || 'Amis inscrits'],
              [info.rewarded, t('dashboard.referralStatRewarded') || 'Parrainages réussis'],
              [`+${info.bonusEarned}`, t('dashboard.referralStatEarned') || 'Générations gagnées'],
            ].map(([value, label]) => (
              <div key={String(label)} className="rounded-xl border border-border bg-surface2/40 px-3 py-3 text-center">
                <p className="text-xl font-bold text-txt">{value}</p>
                <p className="text-[11px] text-txt-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className={`text-[11px] ${info.rewardsLeft === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-txt-muted'}`}>
            {info.rewardsLeft === 0
              ? (t('dashboard.referralCapReached')
                  || 'Vous avez atteint le maximum de {cap} récompenses. Vos amis reçoivent toujours leurs +{n} générations.')
                  .replace('{cap}', String(info.rewardCap)).replace('{n}', String(amount))
              : (t('dashboard.referralRewardsLeft') || 'Récompenses restantes : {left} sur {cap}')
                  .replace('{left}', String(info.rewardsLeft)).replace('{cap}', String(info.rewardCap))}
          </p>
          {pending > 0 && (
            <p className="text-[11px] text-txt-muted">
              {(t('dashboard.referralPending') || '{n} ami(s) inscrit(s) doivent encore créer leur premier CV pour débloquer la récompense.')
                .replace('{n}', String(pending))}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function EmailInviteCard() {
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
    } catch (err: unknown) {
      const e = err as { message?: string };
      setConnectError(
        e.message === 'popup-blocked'
          ? (t('dashboard.mailboxPopupBlocked') || 'Autorisez les fenêtres pop-up pour connecter votre boîte mail.')
          : (e.message || 'Connection failed'),
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
    } catch (caught: unknown) {
      const err = caught as { message?: string; data?: { code?: string; remaining?: number } };
      if (err.data?.code === 'mailbox_required') {
        setSendError(t('dashboard.mailboxRequiredShort') || 'Connectez votre boîte mail Gmail pour inviter des amis.');
      } else if (err.data?.code === 'referral_limit_reached') {
        setSendError(
          (t('dashboard.referralQuotaReached') || 'Limite mensuelle atteinte. Invitations restantes :')
          + ` ${err.data?.remaining ?? 0}`,
        );
      } else {
        setSendError(err.message || 'Failed to send invites');
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

export default function ReferralSection() {
  return (
    <div className="space-y-5">
      <ReferralLinkCard />
      <EmailInviteCard />
    </div>
  );
}
