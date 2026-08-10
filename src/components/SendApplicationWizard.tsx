'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/api/apiClient';
import PaginatedCV from '@/components/PaginatedCV';
import LetterDocument, { type LetterPayload } from '@/components/LetterDocument';
import RichTextField from '@/components/RichTextField';
import { getLayoutBuilder } from '@/app/templates';
import { CVStyleConfig, styleToCSSVars } from '@/app/templates/styleConfig';
import { formatLastName, normalizeCandidate } from '@/app/lib/cvData';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useSubscription, invalidateSubscriptionCache } from '@/app/hooks/useSubscription';
import { useMailAccounts } from '@/app/hooks/useMailAccounts';
import { JobApplication } from '@/app/lib/applicationTypes';
import {
  runPreSendChecks, hasBlockingError, countByLevel, PreSendCheck,
} from '@/app/lib/preSendChecks';
import {
  DocumentTextIcon,
  EnvelopeIcon,
  PaperClipIcon,
  AtSymbolIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  EyeIcon,
  LockClosedIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

type CvDetail = { cvData: Record<string, unknown>; styleConfig: CVStyleConfig; templateId: number };
type SendMode = 'now' | 'schedule';

const STEP_META = [
  { id: 'cv', icon: DocumentTextIcon, labelKey: 'applications.stepCv' },
  { id: 'letter', icon: PencilSquareIcon, labelKey: 'applications.stepLetter' },
  { id: 'email', icon: EnvelopeIcon, labelKey: 'applications.stepEmail' },
  { id: 'files', icon: PaperClipIcon, labelKey: 'applications.stepFiles' },
  { id: 'recipients', icon: AtSymbolIcon, labelKey: 'applications.stepRecipients' },
  { id: 'review', icon: CalendarDaysIcon, labelKey: 'applications.stepReview' },
] as const;

const FOLLOW_UP_PRESETS = [7, 10, 14];

/** Mirrors the backend's clean_attachment_name (applications/letters.py) so
 *  the name shown here is the name the recruiter actually receives. */
function previewAttachmentName(raw: string, fallback: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return fallback;
  const base = trimmed.split(/[\\/]/).pop() || '';
  const stem = base
    .replace(/\.pdf$/i, '')
    .replace(/[^\w\-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  if (!stem || stem === 'Document') return fallback;
  return `${stem}.pdf`;
}

function toLanguage(value: string): LetterPayload['language'] {
  return value === 'en' || value === 'ar' ? value : 'fr';
}

/** `YYYY-MM-DD` for an <input type="date">, in the user's own timezone —
 *  toISOString() would shift the day for anyone east or west of UTC. */
function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A preset reminder: N days out, at 9am — early enough in the working day
 *  to act on, and a sane default the user can still change. */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return toDateTimeInput(d);
}

function fmtDateTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Small presentational helpers ──
function SectionHeading({ icon: Icon, title, hint }: {
  icon: React.ComponentType<{ className?: string }>; title: string; hint?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-[15px] font-bold text-txt flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-500 shrink-0" />
        {title}
      </h3>
      {hint && <p className="text-[12px] text-txt-muted mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function WizardField({ label, value, onChange, placeholder, type = 'text', error, hint, onBlur, min }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; error?: string | null; hint?: string; onBlur?: () => void; min?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`w-full bg-surface2 border rounded-xl px-4 py-3 text-[13px] text-txt outline-none transition-all duration-200 focus:ring-2 placeholder:text-txt-dim ${
          error
            ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
            : 'border-border focus:border-blue-500 focus:ring-blue-500/10'
        }`}
      />
      {error
        ? <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-3 h-3 shrink-0" />{error}
          </p>
        : hint && <p className="text-[11px] text-txt-dim">{hint}</p>}
    </div>
  );
}

function CheckRow({ check, label }: { check: PreSendCheck; label: string }) {
  const Icon = check.level === 'error' ? XCircleIcon
    : check.level === 'warn' ? ExclamationTriangleIcon
    : CheckCircleIcon;
  const tone = check.level === 'error' ? 'text-red-500'
    : check.level === 'warn' ? 'text-amber-500'
    : 'text-emerald-500';
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${tone}`} />
      <span className={`text-[12px] leading-relaxed ${check.level === 'ok' ? 'text-txt-muted' : 'text-txt'}`}>
        {label}
        {check.value && <span className="text-txt-dim"> — {check.value}</span>}
      </span>
    </li>
  );
}

export default function SendApplicationWizard({
  app, subscription, coverLetter, emailSubject, emailBody,
  onCoverLetterChange, onEmailSubjectChange, onEmailBodyChange,
  flushPendingEdits, onClose, onUpdated,
}: {
  app: JobApplication;
  subscription: ReturnType<typeof useSubscription>;
  coverLetter: string;
  emailSubject: string;
  emailBody: string;
  onCoverLetterChange: (v: string) => void;
  onEmailSubjectChange: (v: string) => void;
  onEmailBodyChange: (v: string) => void;
  flushPendingEdits: () => Promise<void>;
  onClose: () => void;
  onUpdated: (updated: JobApplication) => void;
}) {
  const { t, language } = useLanguage();
  const mailboxes = useMailAccounts();
  const [step, setStep] = useState(0);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [cv, setCv] = useState<CvDetail | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);

  const [recipientEmail, setRecipientEmail] = useState(app.recipientEmail || '');
  const [letterFilename, setLetterFilename] = useState(
    previewAttachmentName(`Lettre_de_motivation_${app.companyName}`, 'Lettre_de_motivation.pdf'),
  );
  const [cvFilename, setCvFilename] = useState(
    previewAttachmentName(`CV_${app.cvTitle}`, 'CV.pdf'),
  );
  const [sendCopyToMe, setSendCopyToMe] = useState(true);

  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  const [editingLetter, setEditingLetter] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [sentResult, setSentResult] = useState<JobApplication | null>(null);

  const isLast = step === STEP_META.length - 1;

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/cvs/${app.cvId}/`)
      .then((data) => { if (!cancelled) setCv(data); })
      .catch((err) => { if (!cancelled) setCvError(err.message || 'Failed to load CV'); });
    return () => { cancelled = true; };
  }, [app.cvId]);

  // Esc closes, but never mid-send: interrupting the request would leave the
  // user unsure whether the email actually went out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSending, onClose]);

  // Memoised: a fresh `{}` on every render would re-run every downstream memo.
  const cvData = useMemo(() => (cv?.cvData || {}) as Record<string, string>, [cv]);

  // The earliest date a reminder makes sense, computed once — reading the
  // clock during render makes the output depend on when React happens to
  // re-render.
  const followUpMin = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return toDateTimeInput(d);
  }, []);

  const letterPayload: LetterPayload = useMemo(() => ({
    // Same shape render_cover_letter_pdf builds server-side, so this preview
    // is the document that gets attached — not an approximation of it.
    candidateName:
      `${cvData.prenom || ''} ${formatLastName(cvData.nom)}`.trim() || app.cvTitle,
    candidateEmail: cvData.email || '',
    candidatePhone: cvData.telephone || '',
    candidateLinkedin: cvData.linkedin || '',
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    language: toLanguage(app.language),
    bodyText: coverLetter,
  }), [cvData, app.cvTitle, app.companyName, app.jobTitle, app.language, coverLetter]);

  const finalLetterName = previewAttachmentName(letterFilename, 'Lettre_de_motivation.pdf');
  const finalCvName = previewAttachmentName(cvFilename, 'CV.pdf');

  const checks = useMemo(() => runPreSendChecks({
    recipientEmail,
    coverLetter, emailSubject, emailBody,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    letterFilename: finalLetterName,
    cvFilename: finalCvName,
    cvEmail: cvData.email,
    cvPhone: cvData.telephone,
    senderMailbox: mailboxes.active?.emailAddress || null,
  }), [recipientEmail, coverLetter, emailSubject, emailBody,
       app.companyName, app.jobTitle, finalLetterName, finalCvName,
       cvData.email, cvData.telephone, mailboxes.active]);

  const blocked = hasBlockingError(checks);
  const counts = countByLevel(checks);
  const quotaKnown = !!subscription.subscription;
  const outOfQuota = quotaKnown && !subscription.canSendApplicationEmail;

  const scheduleMin = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 6); // the server requires 5; leave a margin
    return toDateTimeInput(d);
  }, []);

  const handleSend = useCallback(async () => {
    if (isSending || blocked) return;
    setIsSending(true);
    setSendError(null);
    setFieldError(null);
    setQuotaExceeded(false);

    try {
      // The PDFs are rendered server-side from the stored copy, so anything
      // edited in this wizard has to reach the server first.
      await flushPendingEdits();

      const payload: Record<string, unknown> = {
        recipientEmail,
        coverLetterFilename: letterFilename,
        cvFilename,
        sendCopyToMe,
      };
      if (sendMode === 'schedule' && scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }

      let updated: JobApplication = await apiFetch(`/applications/${app.id}/send-email/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // The reminder is set after a confirmed send: setting it first would
      // leave a follow-up dangling on an application that never went out.
      if (followUpDate) {
        const at = new Date(followUpDate);
        updated = await apiFetch(`/applications/${app.id}/follow-up/`, {
          method: 'POST',
          body: JSON.stringify({ followUpAt: at.toISOString(), note: followUpNote }),
        });
      }

      invalidateSubscriptionCache();
      subscription.refresh();
      onUpdated(updated);
      setSentResult(updated);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string; data?: { field?: string; code?: string } };
      if (e.status === 402) {
        setQuotaExceeded(true);
      } else if (e.status === 428 || e.data?.code === 'mailbox_required') {
        // The mailbox was disconnected (or revoked by Google) since this
        // wizard was opened. Send them back to the step that fixes it rather
        // than showing an error they can't act on from here.
        mailboxes.refresh();
        setStep(4);
        setSendError(t('applications.mailboxRequired') || 'Connectez votre boîte mail pour envoyer.');
      } else {
        setSendError(e.message || t('applications.sendError') || 'Failed to send the email.');
        if (e.data?.field) setFieldError(e.data.field);
      }
    } finally {
      setIsSending(false);
    }
  }, [isSending, blocked, flushPendingEdits, recipientEmail, letterFilename,
      cvFilename, sendCopyToMe, sendMode, scheduledAt, app.id, followUpDate, followUpNote,
      subscription, onUpdated, t, mailboxes]);

  // ── Steps ──
  const renderCvStep = () => (
    <>
      <SectionHeading
        icon={DocumentTextIcon}
        title={t('applications.stepCvTitle') || 'Vérifiez votre CV'}
        hint={t('applications.stepCvHint') || "C'est exactement le document qui sera joint à votre e-mail."}
      />
      <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl bg-surface2/60 border border-border">
        <span className="text-[12px] font-bold text-txt truncate">{app.cvTitle}</span>
        <Link
          href={`/builder?id=${app.cvId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
        >
          {t('applications.openCv') || 'Ouvrir'}
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="rounded-2xl bg-surface2/40 border border-border p-4 flex justify-center overflow-auto">
        {cvError ? (
          <p className="text-sm text-red-600 dark:text-red-400 py-10">{cvError}</p>
        ) : !cv ? (
          <div className="py-20">
            <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <PaginatedCV
            layout={getLayoutBuilder(cv.templateId)(normalizeCandidate(cv.cvData), cv.styleConfig, t, language)}
            cssVars={styleToCSSVars(cv.styleConfig) as React.CSSProperties}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            chrome={false}
            scale={0.62}
          />
        )}
      </div>
    </>
  );

  const renderLetterStep = () => (
    <>
      <SectionHeading
        icon={PencilSquareIcon}
        title={t('applications.stepLetterTitle') || 'Vérifiez votre lettre de motivation'}
        hint={t('applications.stepLetterHint') || 'Aperçu exact de la lettre telle qu’elle sera envoyée en PDF.'}
      />
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setEditingLetter((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          {editingLetter ? <EyeIcon className="w-3.5 h-3.5" /> : <PencilSquareIcon className="w-3.5 h-3.5" />}
          {editingLetter ? (t('applications.preview') || 'Aperçu') : (t('applications.edit') || 'Modifier')}
        </button>
      </div>
      {editingLetter ? (
        <RichTextField
          value={coverLetter}
          onChange={onCoverLetterChange}
          className="rich-text-field w-full bg-surface2/60 border border-border rounded-2xl p-5 text-[13px] text-txt leading-relaxed outline-none focus:border-blue-500/40"
          style={{ minHeight: '22em' }}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-auto p-6">
          <LetterDocument payload={letterPayload} />
        </div>
      )}
    </>
  );

  const renderEmailStep = () => (
    <>
      <SectionHeading
        icon={EnvelopeIcon}
        title={t('applications.stepEmailTitle') || 'Vérifiez votre e-mail'}
        hint={t('applications.stepEmailHint') || 'Le message que le recruteur lira, avec vos deux PDF en pièces jointes.'}
      />
      <div className="rounded-2xl border border-border bg-surface2/60 overflow-hidden">
        <div className="px-5 py-2.5 border-b border-border flex items-center gap-2 text-[12px]">
          <span className="text-txt-dim w-16 shrink-0">{t('applications.mailTo') || 'À'}</span>
          <span className="font-semibold text-txt truncate">
            {recipientEmail || <span className="text-txt-dim font-normal">{t('applications.notSetYet') || 'Non renseigné'}</span>}
          </span>
        </div>
        <div className="px-5 py-2.5 border-b border-border flex items-center gap-2 text-[12px]">
          <span className="text-txt-dim w-16 shrink-0">{t('applications.mailReplyTo') || 'Réponses'}</span>
          <span className="text-txt truncate">{mailboxes.active?.emailAddress || '—'}</span>
        </div>
        <div className="px-5 py-2.5 border-b border-border flex items-center gap-2 text-[12px]">
          <span className="text-txt-dim w-16 shrink-0">{t('applications.emailSubject') || 'Objet'}</span>
          <input
            value={emailSubject}
            onChange={(e) => onEmailSubjectChange(e.target.value)}
            className="flex-1 bg-transparent font-semibold text-txt outline-none min-w-0"
          />
        </div>
        <RichTextField
          value={emailBody}
          onChange={onEmailBodyChange}
          className="rich-text-field w-full p-5 text-[13px] text-txt leading-relaxed outline-none bg-transparent"
          style={{ minHeight: '14em' }}
        />
        <div className="px-5 py-3 border-t border-border flex flex-wrap gap-2">
          {[finalLetterName, finalCvName].map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] text-txt-muted">
              <PaperClipIcon className="w-3 h-3 shrink-0" />
              {name}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  const renderFilesStep = () => (
    <>
      <SectionHeading
        icon={PaperClipIcon}
        title={t('applications.stepFilesTitle') || 'Nommez vos pièces jointes'}
        hint={t('applications.stepFilesHint') || 'Ces noms apparaîtront tels quels dans la boîte mail du recruteur.'}
      />
      <div className="space-y-5">
        <div>
          <WizardField
            label={t('applications.coverLetterFilename') || 'Nom du fichier de la lettre'}
            value={letterFilename}
            onChange={setLetterFilename}
            placeholder="Lettre_de_motivation.pdf"
          />
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20">
            <PaperClipIcon className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-[12px] font-semibold text-txt">{finalLetterName}</span>
          </div>
        </div>
        <div>
          <WizardField
            label={t('applications.cvFilename') || 'Nom du fichier du CV'}
            value={cvFilename}
            onChange={setCvFilename}
            placeholder="CV.pdf"
          />
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20">
            <PaperClipIcon className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-[12px] font-semibold text-txt">{finalCvName}</span>
          </div>
        </div>
        <p className="text-[11px] text-txt-dim leading-relaxed">
          {t('applications.filenameSanitizeHint')
            || 'Les accents, espaces et caractères spéciaux sont remplacés automatiquement pour que le fichier s’ouvre partout.'}
        </p>
      </div>
    </>
  );

  const renderRecipientsStep = () => (
    <>
      <SectionHeading
        icon={AtSymbolIcon}
        title={t('applications.stepRecipientsTitle') || 'Destinataires'}
        hint={t('applications.stepRecipientsHint') || 'Vérifiez bien l’adresse : une faute de frappe et la candidature est perdue.'}
      />

      {/* Which mailbox the recruiter will actually see it arrive from. This
          matters more than it looks: a message from the candidate's own
          address reads like a person, threads on reply, and lands in their
          own Sent folder. */}
      <div className="rounded-2xl border border-border bg-surface2/50 p-5 mb-6">
        <h4 className="text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-3">
          {t('applications.sendFrom') || 'Envoyer depuis'}
        </h4>

        {mailboxes.active ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-txt truncate">
                  {mailboxes.active.emailAddress}
                </p>
                <p className="text-[11px] text-txt-muted leading-relaxed">
                  {t('applications.sendFromOwnHint')
                    || 'Le recruteur verra votre adresse, et sa réponse vous parviendra directement.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => mailboxes.disconnect(mailboxes.active!.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-txt-muted hover:bg-surface2 transition-colors"
            >
              {t('applications.disconnectMailbox') || 'Déconnecter'}
            </button>
          </div>
        ) : (
          // Not a choice between two senders — there is only one way to send,
          // and this is the step that unlocks it.
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-txt">
                  {t('applications.mailboxRequired') || 'Connectez votre boîte mail pour envoyer'}
                </p>
                <p className="text-[11px] text-txt-muted leading-relaxed">
                  {t('applications.mailboxRequiredHint')
                    || 'Votre candidature part de votre propre adresse : le recruteur vous voit, vous répond directement, et l’e-mail reste dans vos messages envoyés.'}
                </p>
              </div>
            </div>

            {mailboxes.googleConfigured ? (
              <button
                type="button"
                disabled={isConnecting}
                onClick={async () => {
                  setIsConnecting(true);
                  setConnectError(null);
                  try {
                    await mailboxes.connectGoogle();
                  } catch (err: unknown) {
                    const msg = (err as Error).message;
                    setConnectError(
                      msg === 'popup-blocked'
                        ? (t('applications.popupBlocked') || 'Autorisez les fenêtres pop-up pour connecter votre boîte mail.')
                        : msg || 'Connection failed',
                    );
                  } finally {
                    setIsConnecting(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-60"
              >
                {isConnecting
                  ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  : <EnvelopeIcon className="w-4 h-4" />}
                {t('applications.connectGmail') || 'Envoyer depuis mon Gmail'}
              </button>
            ) : (
              <p className="text-[11px] text-txt-dim leading-relaxed">
                {t('applications.mailboxUnavailable')
                  || 'L’envoi par e-mail n’est pas encore disponible. Vous pouvez télécharger votre lettre et votre CV en PDF et les envoyer vous-même.'}
              </p>
            )}

            {connectError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {connectError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <WizardField
          label={t('applications.recipientEmail') || "E-mail du destinataire"}
          value={recipientEmail}
          onChange={setRecipientEmail}
          type="email"
          placeholder={t('applications.recipientEmailPlaceholder') || 'Ex. recrutement@entreprise.com'}
          error={recipientEmail && checks.find((c) => c.id === 'recipient')?.level === 'error'
            ? (t('applications.invalidRecipientEmail') || 'Adresse e-mail invalide.') : null}
        />
        {/* No "your email" field: the message goes out from the connected
            mailbox, so the recruiter replies straight to it. Asking for an
            address we already know would only invite a typo. */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendCopyToMe}
            onChange={(e) => setSendCopyToMe(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-border accent-blue-600 cursor-pointer shrink-0"
          />
          <span className="text-[12px] text-txt-muted leading-relaxed">
            {t('applications.sendCopyToInbox') || 'Recevoir une copie dans ma boîte de réception'}
            <span className="block text-txt-dim">
              {t('applications.sendCopyToInboxHint')
                || 'L’e-mail sera de toute façon dans vos messages envoyés.'}
            </span>
          </span>
        </label>
      </div>
    </>
  );

  const renderReviewStep = () => (
    <>
      <SectionHeading
        icon={CalendarDaysIcon}
        title={t('applications.stepReviewTitle') || 'Suivi et envoi'}
        hint={t('applications.stepReviewHint') || 'Dernière vérification avant que votre candidature parte.'}
      />

      {/* Pre-send checks */}
      <div className="rounded-2xl border border-border bg-surface2/50 p-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-[12px] font-bold text-txt uppercase tracking-wider">
            {t('applications.checksTitle') || 'Vérifications'}
          </h4>
          <span className="text-[11px] text-txt-dim">
            {counts.passed} ✓ · {counts.warnings} ⚠ · {counts.errors} ✕
          </span>
        </div>
        <ul className="divide-y divide-border/50">
          {[...checks].sort((a, b) => {
            const rank = { error: 0, warn: 1, ok: 2 };
            return rank[a.level] - rank[b.level];
          }).map((check) => (
            <CheckRow key={check.id} check={check} label={t(check.messageKey) || check.messageKey} />
          ))}
        </ul>
      </div>

      {/* Follow-up */}
      <div className="rounded-2xl border border-border bg-surface2/50 p-5 mb-6">
        <h4 className="text-[12px] font-bold text-txt uppercase tracking-wider mb-1.5">
          {t('applications.followUpTitle') || 'Suivi de cette candidature'}
          <span className="ms-2 font-semibold normal-case tracking-normal text-txt-dim">
            {t('applications.optional') || 'facultatif'}
          </span>
        </h4>
        <p className="text-[12px] text-txt-muted leading-relaxed mb-4">
          {t('applications.followUpHint')
            || 'Choisissez une date : si la candidature est toujours sans réponse ce jour-là, nous vous le rappellerons.'}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {FOLLOW_UP_PRESETS.map((days) => {
            const value = daysFromNow(days);
            const active = followUpDate === value;
            return (
              <button
                key={days}
                type="button"
                onClick={() => setFollowUpDate(active ? '' : value)}
                className={`px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                  active
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                    : 'bg-surface2 text-txt-muted border-transparent hover:border-border'
                }`}
              >
                {(t('applications.inDays') || 'Dans {n} jours').replace('{n}', String(days))}
              </button>
            );
          })}
          {followUpDate && (
            <button
              type="button"
              onClick={() => { setFollowUpDate(''); setFollowUpNote(''); }}
              className="px-3 py-2 rounded-xl text-[12px] font-bold text-txt-muted hover:text-red-500 transition-colors"
            >
              {t('applications.noFollowUp') || 'Aucun rappel'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WizardField
            label={t('applications.followUpDate') || 'Date et heure du rappel'}
            value={followUpDate}
            onChange={setFollowUpDate}
            type="datetime-local"
            min={followUpMin}
          />
          <WizardField
            label={t('applications.followUpNote') || 'Note (facultatif)'}
            value={followUpNote}
            onChange={setFollowUpNote}
            placeholder={t('applications.followUpNotePlaceholder') || 'Ex. relancer le service RH'}
          />
        </div>

        {followUpDate && (
          <p className="mt-3 text-[12px] text-blue-600 dark:text-blue-400 flex items-start gap-2">
            <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {(t('applications.followUpSummary')
              || 'Nous vous rappellerons le {date} si cette candidature est toujours sans réponse.')
              .replace('{date}', fmtDateTime(followUpDate, language))}
          </p>
        )}
      </div>

      {/* Send mode */}
      <div className="rounded-2xl border border-border bg-surface2/50 p-5 mb-6">
        <h4 className="text-[12px] font-bold text-txt uppercase tracking-wider mb-4">
          {t('applications.sendModeTitle') || 'Moment de l’envoi'}
        </h4>
        <div className="flex gap-2 mb-4">
          {(['now', 'schedule'] as SendMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSendMode(mode)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all border ${
                sendMode === mode
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-surface2 text-txt-muted border-transparent hover:border-border'
              }`}
            >
              {mode === 'now' ? <PaperAirplaneIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
              {mode === 'now'
                ? (t('applications.sendNow') || 'Envoyer maintenant')
                : (t('applications.sendScheduled') || 'Programmer')}
            </button>
          ))}
        </div>

        {sendMode === 'schedule' && (
          <div className="space-y-3">
            <WizardField
              label={t('applications.scheduledAt') || 'Date et heure d’envoi'}
              value={scheduledAt}
              onChange={setScheduledAt}
              type="datetime-local"
              min={scheduleMin}
              error={fieldError === 'scheduledAt' ? sendError : null}
            />
            {/* The attachments are rendered when the mail actually goes out,
                so late edits are picked up. Worth saying, because the
                opposite used to be true. */}
            <p className="text-[11px] text-txt-muted flex items-start gap-2 leading-relaxed">
              <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              {t('applications.scheduleLiveHint')
                || 'Vous pouvez continuer à modifier votre lettre : les PDF sont générés au moment de l’envoi.'}
            </p>
          </div>
        )}
      </div>

      {/* Recap */}
      <div className="rounded-2xl border border-border bg-surface2/50 p-5">
        <h4 className="text-[12px] font-bold text-txt uppercase tracking-wider mb-4">
          {t('applications.recapTitle') || 'Récapitulatif'}
        </h4>
        <dl className="space-y-2.5 text-[12px]">
          {[
            [t('applications.sendFrom') || 'Envoyer depuis',
              mailboxes.active?.emailAddress
                || (t('applications.mailboxNotConnected') || 'Aucune boîte mail connectée')],
            [t('applications.mailTo') || 'À', recipientEmail || '—'],
            [t('applications.emailSubject') || 'Objet', emailSubject || '—'],
            [t('applications.attachments') || 'Pièces jointes', `${finalLetterName} · ${finalCvName}`],
            [t('applications.sendModeTitle') || 'Moment de l’envoi',
              sendMode === 'schedule' && scheduledAt
                ? fmtDateTime(new Date(scheduledAt).toISOString(), language)
                : (t('applications.sendNow') || 'Envoyer maintenant')],
            [t('applications.followUpTitle') || 'Suivi',
              followUpDate ? fmtDateTime(followUpDate, language) : (t('applications.noFollowUp') || 'Aucun rappel')],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="text-txt-dim w-32 shrink-0">{label}</dt>
              <dd className="text-txt font-medium break-words min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );

  const STEP_RENDERERS = [
    renderCvStep, renderLetterStep, renderEmailStep,
    renderFilesStep, renderRecipientsStep, renderReviewStep,
  ];

  // ── Success screen ──
  const renderSent = () => {
    const scheduled = sentResult?.scheduledSendAt;
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
          {scheduled
            ? <ClockIcon className="w-8 h-8 text-emerald-500" />
            : <CheckCircleIcon className="w-8 h-8 text-emerald-500" />}
        </div>
        <h3 className="text-lg font-bold text-txt mb-2">
          {scheduled
            ? (t('applications.scheduledTitle') || 'Envoi programmé')
            : (t('applications.sentTitle') || 'Candidature envoyée')}
        </h3>
        <p className="text-[13px] text-txt-muted max-w-md leading-relaxed mb-6">
          {scheduled
            ? (t('applications.scheduledDesc') || 'Votre candidature partira automatiquement le {date}.')
                .replace('{date}', fmtDateTime(scheduled, language))
            : (t('applications.sentDesc') || 'Votre candidature a été envoyée à {email}.')
                .replace('{email}', recipientEmail)}
        </p>
        {followUpDate && (
          <p className="text-[12px] text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-6">
            <CalendarDaysIcon className="w-4 h-4" />
            {(t('applications.followUpSummary')
              || 'Nous vous rappellerons le {date} si cette candidature est toujours sans réponse.')
              .replace('{date}', fmtDateTime(followUpDate, language))}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[13px] font-bold hover:bg-blue-500/20 transition-colors"
        >
          {t('applications.close') || 'Fermer'}
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={() => { if (!isSending) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[98vw] max-w-6xl h-[94vh] flex flex-col bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-7 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-txt truncate">
              {t('applications.wizardTitle') || 'Envoyer votre candidature'}
            </h2>
            <p className="text-[12px] text-txt-muted truncate">
              {app.jobTitle} · {app.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted disabled:opacity-40 shrink-0"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {sentResult ? renderSent() : (
          <>
            {/* Progress bar */}
            <div className="shrink-0 h-1 bg-surface2">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 transition-all duration-500"
                style={{ width: `${((step + 1) / STEP_META.length) * 100}%` }}
              />
            </div>

            <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
              {/* Step rail */}
              <nav className="shrink-0 lg:w-64 border-b lg:border-b-0 lg:border-e border-border bg-surface2/30 overflow-x-auto lg:overflow-y-auto">
                <ol className="flex lg:flex-col gap-1 p-3">
                  {STEP_META.map((meta, i) => {
                    const Icon = meta.icon;
                    const active = i === step;
                    const done = i < step;
                    return (
                      <li key={meta.id} className="shrink-0 lg:shrink">
                        <button
                          type="button"
                          onClick={() => setStep(i)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap ${
                            active
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'text-txt-muted hover:bg-surface2'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                            active
                              ? 'border-blue-500/40 bg-blue-500/10'
                              : done
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                                : 'border-border bg-surface'
                          }`}>
                            {done ? <CheckCircleIcon className="w-3.5 h-3.5" /> : i + 1}
                          </span>
                          <Icon className="w-4 h-4 shrink-0 hidden sm:block" />
                          <span className="truncate">{t(meta.labelKey) || meta.id}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              {/* Content */}
              <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-7">
                {STEP_RENDERERS[step]()}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-5 sm:px-7 py-4">
              {quotaExceeded && (
                <div className="mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
                  <LockClosedIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-[12px] text-amber-700 dark:text-amber-400">
                    {t('applications.quotaExceeded') || 'Limite mensuelle atteinte.'}{' '}
                    <Link href="/dashboard?view=pricing" className="font-bold underline">
                      {t('applications.upgrade') || 'Passer à Pro'}
                    </Link>
                  </div>
                </div>
              )}
              {sendError && fieldError !== 'scheduledAt' && (
                <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[12px] text-red-600 dark:text-red-400">
                  {sendError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0 || isSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold text-txt-muted hover:text-txt hover:bg-surface2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeftIcon className="w-4 h-4 rtl:rotate-180" />
                  {t('applications.back') || 'Retour'}
                </button>

                <span className="text-[11px] text-txt-dim shrink-0">
                  {step + 1} / {STEP_META.length}
                </span>

                {isLast ? (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending || blocked || outOfQuota}
                    title={blocked ? (t('applications.blockedHint') || 'Corrigez les erreurs ci-dessus.') : undefined}
                    className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-[13px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 overflow-hidden disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                    <span className="relative z-10 flex items-center gap-2">
                      {isSending
                        ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        : sendMode === 'schedule'
                          ? <ClockIcon className="w-4 h-4" />
                          : <PaperAirplaneIcon className="w-4 h-4" />}
                      {isSending
                        ? (t('applications.sending') || 'Envoi en cours...')
                        : sendMode === 'schedule'
                          ? (t('applications.scheduleAction') || 'Programmer l’envoi')
                          : (t('applications.sendEmailAction') || 'Envoyer par e-mail')}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(STEP_META.length - 1, s + 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors"
                  >
                    {t('applications.continue') || 'Continuer'}
                    <ChevronRightIcon className="w-4 h-4 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
