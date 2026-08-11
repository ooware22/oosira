'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/api/apiClient';
import FormatToolbar from '@/components/FormatToolbar';
import RichTextField, { RichTextFieldHandle } from '@/components/RichTextField';
import SpellCheckModal from '@/components/SpellCheckModal';
import PaginatedCV from '@/components/PaginatedCV';
import SendApplicationWizard from '@/components/SendApplicationWizard';
import {
  APPLICATION_STATUSES, ApplicationStatus, StatusPill, StatusSelect, STATUS_LABEL_KEY,
} from '@/components/ApplicationStatus';
import { getLayoutBuilder } from '@/app/templates';
import { CVStyleConfig, styleToCSSVars } from '@/app/templates/styleConfig';
import { normalizeCandidate } from '@/app/lib/cvData';
import { JobApplication } from '@/app/lib/applicationTypes';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { DraftCV } from '@/app/auth/AuthContext';
import { useSubscription, invalidateSubscriptionCache } from '@/app/hooks/useSubscription';
import {
  BriefcaseIcon,
  SparklesIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  LanguageIcon,
  ClockIcon,
  CalendarDaysIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

/** Timeline verbs, keyed by the backend's ApplicationEvent.kind values. */
const EVENT_LABEL_KEY: Record<string, string> = {
  created: 'applications.eventCreated',
  regenerated: 'applications.eventRegenerated',
  edited: 'applications.eventEdited',
  sent: 'applications.eventSent',
  scheduled: 'applications.eventScheduled',
  schedule_cancelled: 'applications.eventScheduleCancelled',
  pdf_downloaded: 'applications.eventPdfDownloaded',
  follow_up_set: 'applications.eventFollowUpSet',
  follow_up_cleared: 'applications.eventFollowUpCleared',
  follow_up_snoozed: 'applications.eventFollowUpSnoozed',
  follow_up_dismissed: 'applications.eventFollowUpDismissed',
  relance_generated: 'applications.eventRelanceGenerated',
  relance_sent: 'applications.eventRelanceSent',
  status_changed: 'applications.eventStatusChanged',
};

function fmtDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * The variable part of a timeline line, built from the event's structured
 * `detail`. Kept separate from the verb so both stay translatable: the server
 * never sends a rendered sentence.
 */
function eventDetailSuffix(
  event: { kind: string; detail: Record<string, unknown> },
  t: (key: string) => string,
): string {
  const d = event.detail || {};
  switch (event.kind) {
    case 'sent':
    case 'relance_sent':
    case 'scheduled':
      return d.to ? `→ ${String(d.to)}` : '';
    case 'status_changed':
      return d.toStatus
        ? `→ ${t(STATUS_LABEL_KEY[d.toStatus as ApplicationStatus]) || String(d.toStatus)}`
        : '';
    case 'follow_up_snoozed':
      return d.days ? `(+${String(d.days)} j)` : '';
    default:
      return '';
  }
}

// Email validation and attachment-name slugging now live with the code that
// needs them: src/app/lib/preSendChecks.ts and SendApplicationWizard.

// ── Small local field primitives (mirroring FormField's visual language,
//    which is private to dashboard/page.tsx and can't be imported here) ──
function Field({ label, value, onChange, placeholder, required, type = 'text', error, onBlur }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; type?: string; error?: string | null; onBlur?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
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
      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — silently ignore, nothing better to do */
        }
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
        copied ? 'text-emerald-500' : 'text-txt-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10'
      }`}
    >
      {copied ? <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

// ── Read-only CV preview, opened from a CV title ──
type CvDetail = { cvData: unknown; styleConfig: CVStyleConfig; templateId: number };

function CvPreviewOverlay({ cvId, cvTitle, onClose }: {
  cvId: string; cvTitle: string; onClose: () => void;
}) {
  const { t, language } = useLanguage();
  const [cv, setCv] = useState<CvDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/cvs/${cvId}/`)
      .then((data) => { if (!cancelled) setCv(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load CV'); });
    return () => { cancelled = true; };
  }, [cvId]);

  // Same render recipe as the PDF export route, so the preview matches the
  // document that actually gets attached to the email.
  const layout = cv ? getLayoutBuilder(cv.templateId)(normalizeCandidate(cv.cvData), cv.styleConfig, t, language) : null;
  const cssVars = (cv?.styleConfig ? styleToCSSVars(cv.styleConfig) : {}) as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[95vw] max-w-4xl max-h-[92vh] flex flex-col bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-[15px] font-bold text-txt flex items-center gap-2 truncate">
            <DocumentTextIcon className="w-5 h-5 text-blue-500 shrink-0" />
            {cvTitle}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/builder?id=${cvId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              {t('applications.openCv') || 'Ouvrir'}
            </Link>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-surface2/40 flex justify-center">
          {error ? (
            <div className="text-sm text-red-600 dark:text-red-400 py-10">{error}</div>
          ) : !layout ? (
            <div className="py-20">
              <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <PaginatedCV
              layout={layout}
              cssVars={cssVars}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              chrome={false}
              scale={0.85}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Card in the applications list ──
function ApplicationCard({ app, onOpen, onPreviewCv, onDelete, delay }: {
  app: JobApplication; onOpen: () => void; onPreviewCv: () => void; onDelete: () => void; delay: number;
}) {
  const { t, language, dir } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04 }}
      onClick={onOpen}
      className="group relative bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-5 cursor-pointer hover:border-blue-500/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-txt text-[14px] truncate">{app.jobTitle}</h3>
          <p className="text-[12px] text-txt-muted flex items-center gap-1.5 mt-0.5 truncate">
            <BuildingOffice2Icon className="w-3.5 h-3.5 shrink-0" />
            {app.companyName}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={`shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 text-txt-muted transition-all ${dir === 'rtl' ? '-ml-1' : '-mr-1'}`}
          title={t('applications.delete') || 'Delete'}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusPill status={app.status} label={t(STATUS_LABEL_KEY[app.status]) || app.status} />
        {app.scheduledSendAt && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
            <ClockIcon className="w-3 h-3" />
            {fmtDate(app.scheduledSendAt, language)}
          </span>
        )}
        {app.followUpAt && !app.followUpHandledAt && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
            <BellAlertIcon className="w-3 h-3" />
            {fmtDate(app.followUpAt, language)}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-txt-dim">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPreviewCv(); }}
          title={t('applications.previewCv') || 'Aperçu du CV'}
          className="inline-flex items-center gap-1.5 bg-surface2 text-txt-muted px-2 py-1 rounded-full truncate max-w-[60%] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          <DocumentTextIcon className="w-3 h-3 shrink-0" />
          {app.cvTitle}
        </button>
        <span>{fmtDate(app.updatedAt, language)}</span>
      </div>
    </motion.div>
  );
}

// ── Detail / result panel ──
function ApplicationDetail({ app, subscription, onBack, onDeleted, onRegenerated, onPreviewCv }: {
  app: JobApplication;
  subscription: ReturnType<typeof useSubscription>;
  onBack: () => void;
  onDeleted: () => void;
  onRegenerated: (updated: JobApplication) => void;
  onPreviewCv: () => void;
}) {
  const { t, language } = useLanguage();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [showWizard, setShowWizard] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const [coverLetterDraft, setCoverLetterDraft] = useState(app.generatedCoverLetter);
  const [emailSubjectDraft, setEmailSubjectDraft] = useState(app.generatedEmailSubject);
  const [emailBodyDraft, setEmailBodyDraft] = useState(app.generatedEmailBody);
  const [isSavingLetter, setIsSavingLetter] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [letterSaved, setLetterSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showSpellCheck, setShowSpellCheck] = useState(false);

  const letterFieldRef = useRef<RichTextFieldHandle>(null);
  const emailFieldRef = useRef<RichTextFieldHandle>(null);
  const formatLabels = useMemo(
    () => ({
      bold: t('builder.fmtBold'),
      italic: t('builder.fmtItalic'),
      bullet: t('builder.fmtBullet'),
    }),
    [t],
  );

  // No prop-watching effect resets these: switching application remounts this
  // component (keyed on the id by the parent), and after a save the drafts
  // already hold what was saved. Regenerate is the one case that replaces the
  // content under the user, so it resets the drafts explicitly below.
  const letterDirty = coverLetterDraft !== app.generatedCoverLetter;
  const emailDirty = emailSubjectDraft !== app.generatedEmailSubject || emailBodyDraft !== app.generatedEmailBody;

  /**
   * Push any unsaved edits before an action that reads the server's copy.
   * The PDF is rendered server-side and the email is sent server-side, both
   * from the stored value — without this, "Download PDF" would print, and
   * "Send by Email" would send a recruiter, the last-saved text rather than
   * what the user is looking at.
   */
  const flushPendingEdits = async () => {
    if (!letterDirty && !emailDirty) return;
    const payload: Record<string, string> = {};
    if (letterDirty) payload.generatedCoverLetter = coverLetterDraft;
    if (emailDirty) {
      payload.generatedEmailSubject = emailSubjectDraft;
      payload.generatedEmailBody = emailBodyDraft;
    }
    const updated = await apiFetch(`/applications/${app.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    onRegenerated(updated);
  };

  const handleSaveLetter = async () => {
    setIsSavingLetter(true);
    setSaveError(null);
    try {
      const updated = await apiFetch(`/applications/${app.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ generatedCoverLetter: coverLetterDraft }),
      });
      onRegenerated(updated);
      setLetterSaved(true);
      setTimeout(() => setLetterSaved(false), 1800);
    } catch (err: any) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setIsSavingLetter(false);
    }
  };

  const handleSaveEmail = async () => {
    setIsSavingEmail(true);
    setSaveError(null);
    try {
      const updated = await apiFetch(`/applications/${app.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ generatedEmailSubject: emailSubjectDraft, generatedEmailBody: emailBodyDraft }),
      });
      onRegenerated(updated);
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 1800);
    } catch (err: any) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const updated = await apiFetch(`/applications/${app.id}/regenerate/`, { method: 'POST' });
      // Regeneration replaces the content wholesale — drop any unsaved edits
      // so the drafts (and the dirty/Save state derived from them) match.
      setCoverLetterDraft(updated.generatedCoverLetter);
      setEmailSubjectDraft(updated.generatedEmailSubject);
      setEmailBodyDraft(updated.generatedEmailBody);
      onRegenerated(updated);
    } catch (err: any) {
      setError(err.message || t('applications.generateError') || 'Generation failed');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/applications/${app.id}/`, { method: 'DELETE' });
      onDeleted();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleDownloadPdf = async () => {
    if (subscription.subscription && !subscription.canDownload) {
      setPdfError(t('applications.quotaExceeded') || 'Limite mensuelle atteinte.');
      return;
    }
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      await flushPendingEdits();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE}/applications/${app.id}/pdf/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('oosira_token')}` },
      });

      if (response.status === 402) {
        invalidateSubscriptionCache();
        subscription.refresh();
        setPdfError(t('applications.quotaExceeded') || 'Limite mensuelle atteinte.');
        return;
      }
      if (!response.ok) throw new Error(t('applications.pdfDownloadError') || 'PDF generation failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Lettre_de_motivation_${app.companyName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      invalidateSubscriptionCache();
      subscription.refresh();
    } catch (err: any) {
      setPdfError(err.message || t('applications.pdfDownloadError') || 'PDF generation failed');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /** One wrapper for the small life-cycle POSTs — they all take no body worth
   *  speaking of, return the updated application, and share error handling. */
  const lifecycleCall = async (path: string, body?: Record<string, unknown>) => {
    setLifecycleBusy(true);
    setLifecycleError(null);
    try {
      const updated = await apiFetch(`/applications/${app.id}/${path}`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      });
      onRegenerated(updated);
      return updated as JobApplication;
    } catch (err: any) {
      setLifecycleError(err.message || 'Action failed');
      return null;
    } finally {
      setLifecycleBusy(false);
    }
  };

  const handleStatusChange = (next: ApplicationStatus) => lifecycleCall('status/', { status: next });

  const handleClearFollowUp = () => lifecycleCall('follow-up/', { followUpAt: null });

  const handleSnooze = (days: number) => lifecycleCall('follow-up/dismiss/', { snoozeDays: days });

  const handleDismissFollowUp = () => lifecycleCall('follow-up/dismiss/');

  const handleCancelSchedule = async () => {
    const updated = await lifecycleCall('cancel-schedule/');
    if (updated) {
      // The quota was given back, so the counter the header shows is stale.
      invalidateSubscriptionCache();
      subscription.refresh();
    }
  };

  const handleGenerateRelance = async () => {
    const updated = await lifecycleCall('relance/');
    if (updated) subscription.refresh();
  };

  const handleSendRelance = async () => {
    const updated = await lifecycleCall('send-email/', { kind: 'followUp' });
    if (updated) {
      invalidateSubscriptionCache();
      subscription.refresh();
    }
  };

  // Must mirror the server's notification query exactly (see
  // ApplicationNotificationsView): a reminder is only "due" for an
  // application that is actually waiting on a reply. Without the status
  // check, a draft that was never sent showed "this application is still
  // waiting for an answer" — which nobody was ever waiting to answer.
  const followUpDue = Boolean(
    app.followUpAt
    && !app.followUpHandledAt
    && new Date(app.followUpAt) <= new Date()
    && (app.status === 'sent' || app.status === 'followed_up'),
  );

  /**
   * A retrying send is resolved by the background worker, which has no way to
   * tell this page. Without polling, "nous réessayons automatiquement" stays
   * on screen forever — long after the mail was delivered or gave up — and
   * the only way out is a manual reload.
   */
  useEffect(() => {
    if (app.sendState !== 'retrying') return;
    const timer = window.setInterval(async () => {
      try {
        const fresh = await apiFetch(`/applications/${app.id}/`);
        if (fresh.sendState !== 'retrying') onRegenerated(fresh);
      } catch {
        /* transient — the next tick tries again */
      }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [app.sendState, app.id, onRegenerated]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-txt-muted hover:text-txt mb-5 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4 rtl:rotate-180" />
        {t('applications.backToList') || 'Back'}
      </button>

      <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-3xl p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-txt">{app.jobTitle}</h2>
              <StatusSelect
                status={app.status}
                labelFor={(s) => t(STATUS_LABEL_KEY[s]) || s}
                onChange={handleStatusChange}
                disabled={lifecycleBusy}
              />
            </div>
            <p className="text-[13px] text-txt-muted flex items-center gap-1.5 mt-1">
              <BuildingOffice2Icon className="w-4 h-4" /> {app.companyName}
              <span className="text-txt-dim">·</span>
              <button
                type="button"
                onClick={onPreviewCv}
                title={t('applications.previewCv') || 'Aperçu du CV'}
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <DocumentTextIcon className="w-4 h-4" /> {app.cvTitle}
              </button>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* No longer disabled while a send is scheduled: the attachments
                are rendered when the mail goes out, so the application stays
                editable right up to the moment it leaves. */}
            <button
              onClick={() => setShowWizard(true)}
              disabled={app.sendState === 'scheduled' || app.sendState === 'retrying'}
              title={app.sendState === 'scheduled'
                ? (t('applications.cancelScheduleFirst') || 'Annulez l’envoi programmé pour en programmer un autre.')
                : undefined}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-[12px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 overflow-hidden disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
              <span className="relative z-10 flex items-center gap-2">
                <PaperAirplaneIcon className="w-4 h-4" />
                {app.emailSentAt
                  ? (t('applications.sendAgain') || 'Renvoyer')
                  : (t('applications.sendEmailAction') || 'Envoyer par e-mail')}
              </span>
            </button>
            <button
              onClick={() => setShowSpellCheck(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors"
            >
              <LanguageIcon className="w-4 h-4" />
              {t('spellcheck.button') || 'Corriger l’orthographe'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-60"
            >
              <ArrowDownTrayIcon className={`w-4 h-4 ${isDownloadingPdf ? 'animate-pulse' : ''}`} />
              {isDownloadingPdf ? (t('applications.downloadingPdf') || 'Préparation du PDF...') : (t('applications.downloadPdf') || 'Télécharger le PDF')}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-60"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? (t('applications.generating') || 'Génération...') : (t('applications.regenerate') || 'Régénérer')}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-txt-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title={t('applications.delete') || 'Delete'}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {pdfError && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {pdfError}
          </div>
        )}

        {saveError && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {saveError}
          </div>
        )}

        {lifecycleError && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {lifecycleError}
          </div>
        )}

        {/* Scheduled send. Editing stays open — the PDFs are rendered when the
            mail actually goes out, so late changes are included. */}
        {app.scheduledSendAt && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <ClockIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
                <span className="font-bold">
                  {t('applications.scheduledBanner') || 'Envoi programmé'}
                </span>{' '}
                — {fmtDateTime(app.scheduledSendAt, language)}
                <p className="mt-1 opacity-90">
                  {t('applications.scheduleLiveHint')
                    || 'Vous pouvez continuer à modifier votre lettre : les PDF sont générés au moment de l’envoi.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelSchedule}
              disabled={lifecycleBusy}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-500/25 transition-colors disabled:opacity-60"
            >
              {t('applications.cancelSchedule') || 'Annuler l’envoi'}
            </button>
          </div>
        )}

        {/* A send still being retried in the background. */}
        {app.sendState === 'retrying' && (
          <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3.5 flex items-start gap-3">
            <ArrowPathIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 animate-spin" />
            <p className="text-[12px] text-blue-700 dark:text-blue-400 leading-relaxed">
              {t('applications.sendRetrying')
                || 'L’envoi n’a pas abouti du premier coup. Nous réessayons automatiquement.'}
            </p>
          </div>
        )}

        {/* A send that gave up. The quota was refunded, so retrying costs the
            user nothing they haven't already got back. */}
        {app.sendState === 'failed' && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-red-600 dark:text-red-400 leading-relaxed min-w-0">
                <span className="font-bold">
                  {t('applications.sendFailedTitle') || 'L’envoi a échoué'}
                </span>
                {app.sendError && <p className="mt-1 opacity-90 break-words">{app.sendError}</p>}
              </div>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 text-[11px] font-bold hover:bg-red-500/25 transition-colors"
            >
              {t('applications.retry') || 'Réessayer'}
            </button>
          </div>
        )}

        {/* Sent confirmation */}
        {app.emailSentAt && !app.scheduledSendAt && (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircleIcon className="w-4 h-4" />
              {t('applications.sentOn') || 'Envoyé le'} {fmtDate(app.emailSentAt, language)}
            </span>
            {app.recipientEmail && <span className="text-txt-muted truncate">{app.recipientEmail}</span>}
            {app.followUpSentAt && (
              <span className="text-amber-600 dark:text-amber-400">
                {t('applications.relanceSentOn') || 'Relancé le'} {fmtDate(app.followUpSentAt, language)}
              </span>
            )}
          </div>
        )}

        {/* Follow-up reminder */}
        {app.followUpAt && !app.followUpHandledAt && (
          <div className={`mb-6 rounded-xl px-4 py-3.5 border ${
            followUpDue
              ? 'bg-blue-500/10 border-blue-500/25'
              : 'bg-surface2/60 border-border'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {followUpDue
                  ? <BellAlertIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  : <CalendarDaysIcon className="w-4 h-4 text-txt-muted shrink-0 mt-0.5" />}
                <div className="text-[12px] leading-relaxed min-w-0">
                  <span className={`font-bold ${followUpDue ? 'text-blue-600 dark:text-blue-400' : 'text-txt'}`}>
                    {followUpDue
                      ? (t('applications.followUpDueTitle') || 'Cette candidature attend toujours une réponse')
                      : (t('applications.followUpPlanned') || 'Suivi prévu')}
                  </span>{' '}
                  <span className="text-txt-muted">— {fmtDateTime(app.followUpAt, language)}</span>
                  {app.followUpNote && <p className="text-txt-dim mt-0.5 truncate">{app.followUpNote}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {followUpDue && (
                  <button
                    onClick={() => handleSnooze(7)}
                    disabled={lifecycleBusy}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-txt-muted hover:bg-surface2 transition-colors disabled:opacity-60"
                  >
                    {t('applications.snooze7') || 'Reporter 7 j'}
                  </button>
                )}
                <button
                  onClick={followUpDue ? handleDismissFollowUp : handleClearFollowUp}
                  disabled={lifecycleBusy}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-txt-muted hover:bg-surface2 transition-colors disabled:opacity-60"
                >
                  {followUpDue
                    ? (t('applications.dismiss') || 'Ignorer')
                    : (t('applications.cancelFollowUp') || 'Annuler le rappel')}
                </button>
              </div>
            </div>

            {/* The relance: the actual answer to "do you want to resend it?" */}
            {followUpDue && (
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                {app.followUpBody ? (
                  <>
                    <p className="text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-2">
                      {t('applications.relancePreview') || 'Relance proposée'}
                    </p>
                    <div className="rounded-xl bg-surface2/70 border border-border p-4 mb-3">
                      <p className="text-[12px] font-semibold text-txt mb-2">{app.followUpSubject}</p>
                      <p className="text-[12px] text-txt-muted whitespace-pre-wrap leading-relaxed line-clamp-6">
                        {app.followUpBody}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSendRelance}
                        disabled={lifecycleBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-500/25 transition-colors disabled:opacity-60"
                      >
                        <PaperAirplaneIcon className="w-3.5 h-3.5" />
                        {t('applications.sendRelance') || 'Envoyer la relance'}
                      </button>
                      <button
                        onClick={handleGenerateRelance}
                        disabled={lifecycleBusy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold text-txt-muted hover:bg-surface2 transition-colors disabled:opacity-60"
                      >
                        <ArrowPathIcon className={`w-3.5 h-3.5 ${lifecycleBusy ? 'animate-spin' : ''}`} />
                        {t('applications.regenerate') || 'Régénérer'}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleGenerateRelance}
                    disabled={lifecycleBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-500/25 transition-colors disabled:opacity-60"
                  >
                    <SparklesIcon className={`w-3.5 h-3.5 ${lifecycleBusy ? 'animate-pulse' : ''}`} />
                    {t('applications.generateRelance') || 'Rédiger une relance'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cover letter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[12px] font-bold text-txt-muted uppercase tracking-wider flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-blue-500" />
              {t('applications.coverLetter') || 'Lettre de motivation'}
            </h3>
            <div className="flex items-center gap-1">
              <FormatToolbar onFormat={(kind) => letterFieldRef.current?.runFormat(kind)} labels={formatLabels} />
              <CopyButton text={coverLetterDraft} label={t('applications.copy') || 'Copier'} copiedLabel={t('applications.copied') || 'Copié !'} />
              {(letterDirty || letterSaved) && (
                <button
                  type="button"
                  onClick={handleSaveLetter}
                  disabled={isSavingLetter || !letterDirty}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-60 ${
                    letterSaved ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  {letterSaved ? <CheckCircleIcon className="w-3.5 h-3.5" /> : null}
                  {letterSaved
                    ? (t('applications.saved') || 'Enregistré !')
                    : isSavingLetter
                      ? (t('applications.saving') || 'Enregistrement...')
                      : (t('applications.save') || 'Enregistrer')}
                </button>
              )}
            </div>
          </div>
          <RichTextField
            ref={letterFieldRef}
            value={coverLetterDraft}
            onChange={setCoverLetterDraft}
            className="rich-text-field w-full bg-surface2/60 border border-border rounded-2xl p-5 text-[13px] text-txt leading-relaxed resize-y overflow-y-auto outline-none transition-colors focus:border-blue-500/40 max-h-[420px]"
            style={{ minHeight: '18em' }}
          />
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[12px] font-bold text-txt-muted uppercase tracking-wider flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-blue-500" />
              {t('applications.email') || "E-mail de candidature"}
            </h3>
            <div className="flex items-center gap-1">
              <FormatToolbar onFormat={(kind) => emailFieldRef.current?.runFormat(kind)} labels={formatLabels} />
              <CopyButton
                text={`${t('applications.emailSubject') || 'Objet'}: ${emailSubjectDraft}\n\n${emailBodyDraft}`}
                label={t('applications.copy') || 'Copier'}
                copiedLabel={t('applications.copied') || 'Copié !'}
              />
              {(emailDirty || emailSaved) && (
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={isSavingEmail || !emailDirty}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-60 ${
                    emailSaved ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  {emailSaved ? <CheckCircleIcon className="w-3.5 h-3.5" /> : null}
                  {emailSaved
                    ? (t('applications.saved') || 'Enregistré !')
                    : isSavingEmail
                      ? (t('applications.saving') || 'Enregistrement...')
                      : (t('applications.save') || 'Enregistrer')}
                </button>
              )}
            </div>
          </div>
          <div className="bg-surface2/60 border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border text-[12px]">
              <span className="text-txt-dim shrink-0">{t('applications.emailSubject') || 'Objet'}: </span>
              <input
                value={emailSubjectDraft}
                onChange={(e) => setEmailSubjectDraft(e.target.value)}
                className="flex-1 bg-transparent font-semibold text-txt outline-none"
              />
            </div>
            <RichTextField
              ref={emailFieldRef}
              value={emailBodyDraft}
              onChange={setEmailBodyDraft}
              className="rich-text-field w-full p-5 text-[13px] text-txt leading-relaxed resize-y overflow-y-auto outline-none bg-transparent"
              style={{ minHeight: '11em' }}
            />
          </div>
        </div>

        {/* Timeline */}
        {app.events?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setShowTimeline((v) => !v)}
              className="w-full flex items-center justify-between gap-2 text-[12px] font-bold text-txt-muted uppercase tracking-wider hover:text-txt transition-colors"
            >
              <span className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-blue-500" />
                {t('applications.timeline') || 'Historique'}
                <span className="text-txt-dim font-semibold normal-case tracking-normal">
                  ({app.events.length})
                </span>
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showTimeline ? 'rotate-180' : ''}`} />
            </button>

            {showTimeline && (
              <ol className="mt-4 space-y-0">
                {/* Newest first: the recent history is what anyone actually
                    opens this for. */}
                {[...app.events].reverse().map((event, i, all) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500/60 mt-1.5" />
                      {i < all.length - 1 && <span className="w-px flex-1 bg-border my-1" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-[12px] text-txt leading-snug">
                        {t(EVENT_LABEL_KEY[event.kind]) || event.kind}
                        {eventDetailSuffix(event, t) && (
                          <span className="text-txt-muted"> {eventDetailSuffix(event, t)}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-txt-dim mt-0.5">
                        {fmtDateTime(event.createdAt, language)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWizard && (
          <SendApplicationWizard
            app={app}
            subscription={subscription}
            // The drafts stay owned here, so what the wizard previews is
            // exactly what the detail view shows — one source of truth.
            coverLetter={coverLetterDraft}
            emailSubject={emailSubjectDraft}
            emailBody={emailBodyDraft}
            onCoverLetterChange={setCoverLetterDraft}
            onEmailSubjectChange={setEmailSubjectDraft}
            onEmailBodyChange={setEmailBodyDraft}
            flushPendingEdits={flushPendingEdits}
            onClose={() => setShowWizard(false)}
            onUpdated={onRegenerated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpellCheck && (
          <SpellCheckModal
            language={app.language}
            fields={[
              { id: 'coverLetter', label: t('applications.coverLetter') || 'Lettre de motivation', value: coverLetterDraft },
              { id: 'emailSubject', label: t('applications.emailSubject') || 'Objet', value: emailSubjectDraft },
              { id: 'emailBody', label: t('applications.email') || 'E-mail de candidature', value: emailBodyDraft },
            ]}
            onClose={() => setShowSpellCheck(false)}
            onApply={(fixes) => {
              // Only update the drafts — the user still saves explicitly, and
              // the Save buttons light up because the drafts are now dirty.
              if (fixes.coverLetter !== undefined) setCoverLetterDraft(fixes.coverLetter);
              if (fixes.emailSubject !== undefined) setEmailSubjectDraft(fixes.emailSubject);
              if (fixes.emailBody !== undefined) setEmailBodyDraft(fixes.emailBody);
              setShowSpellCheck(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── "New application" wizard modal ──
function NewApplicationModal({ drafts, subscription, onClose, onCreated }: {
  drafts: DraftCV[];
  subscription: ReturnType<typeof useSubscription>;
  onClose: () => void;
  onCreated: (app: JobApplication) => void;
}) {
  const { t, language } = useLanguage();
  const [cvId, setCvId] = useState(drafts[0]?.id || '');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobOfferText, setJobOfferText] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<string>(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quotaKnown = !!subscription.subscription;
  const quotaExceeded = quotaKnown && !subscription.canGenerateApplication;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quotaExceeded || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const created = await apiFetch('/applications/', {
        method: 'POST',
        body: JSON.stringify({
          cvId,
          jobTitle,
          companyName,
          jobOfferText,
          language: outputLanguage,
        }),
      });
      subscription.refresh();
      onCreated(created);
    } catch (err: any) {
      setError(err.message || t('applications.generateError') || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-border sticky top-0 bg-surface/95 backdrop-blur-xl z-10">
          <h2 className="text-[16px] font-bold text-txt flex items-center gap-2">
            <BriefcaseIcon className="w-5 h-5 text-blue-500" />
            {t('applications.newTitle') || 'Nouvelle candidature'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {drafts.length === 0 ? (
            <div className="text-center py-6">
              <DocumentTextIcon className="w-10 h-10 mx-auto text-txt-dim mb-3" />
              <p className="text-sm text-txt-muted">{t('applications.noCvs') || 'Créez un CV avant de générer une candidature.'}</p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                  {t('applications.selectCv') || 'CV à utiliser'}
                </label>
                <select
                  value={cvId}
                  onChange={(e) => setCvId(e.target.value)}
                  required
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  {drafts.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('applications.jobTitle') || 'Poste'} value={jobTitle} onChange={setJobTitle} required placeholder={t('applications.jobTitlePlaceholder') || 'Ex. Développeur Frontend'} />
                <Field label={t('applications.companyName') || 'Entreprise'} value={companyName} onChange={setCompanyName} required placeholder={t('applications.companyNamePlaceholder') || 'Ex. Sonatrach'} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                  {t('applications.offerText') || "Texte de l'offre d'emploi"}
                </label>
                <textarea
                  value={jobOfferText}
                  onChange={(e) => setJobOfferText(e.target.value)}
                  required
                  rows={11}
                  placeholder={t('applications.offerTextPlaceholder') || "Collez ici le texte complet de l'offre d'emploi..."}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none resize-y transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-txt-dim"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                  {t('applications.outputLanguage') || 'Langue de génération'}
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setOutputLanguage(l.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                        outputLanguage === l.id
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : 'bg-surface2 text-txt-muted border-transparent hover:border-border'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {quotaExceeded && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
                  <LockClosedIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-[12px] text-amber-700 dark:text-amber-400">
                    {t('applications.quotaExceeded') || 'Limite mensuelle atteinte.'}{' '}
                    <Link href="/dashboard?view=pricing" onClick={onClose} className="font-bold underline">
                      {t('applications.upgrade') || 'Passer à Pro'}
                    </Link>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating || quotaExceeded}
                className="group relative w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-white font-medium text-[14px] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-500/20 overflow-hidden disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                <span className="relative z-10 flex items-center gap-2">
                  {isGenerating ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                  {isGenerating
                    ? (t('applications.generating') || 'Génération en cours...')
                    : (t('applications.generate') || 'Générer')}
                </span>
              </button>
            </>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main view ──
export default function ApplicationsView({ drafts, subscription, initialAppId, onCountChange }: {
  drafts: DraftCV[];
  subscription: ReturnType<typeof useSubscription>;
  /** Opened straight from a follow-up notification in the dashboard bell. */
  initialAppId?: string | null;
  /** Reports the list size up to the sidebar badge. */
  onCountChange?: (count: number) => void;
}) {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [previewCv, setPreviewCv] = useState<{ id: string; title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const consumedInitialId = useRef<string | null>(null);

  // A failed fetch must never render as the empty state — "you have no
  // applications" and "we couldn't load your applications" are very
  // different messages, and showing the former for the latter made real
  // data look deleted.
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch('/applications/');
      setApplications(data);
      // Deep link from the notification bell. Guarded so re-opening the list
      // after going Back doesn't yank the user into the detail again.
      if (initialAppId && consumedInitialId.current !== initialAppId) {
        consumedInitialId.current = initialAppId;
        const match = (data as JobApplication[]).find((a) => a.id === initialAppId);
        if (match) setSelected(match);
      }
    } catch (err: any) {
      setLoadError(err.message || t('applications.loadError') || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [t, initialAppId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Held back until the list has actually loaded: reporting the initial empty
  // array would blink the sidebar badge to 0 every time this tab is opened,
  // and a failed fetch must not be read as "you have no applications".
  useEffect(() => {
    if (isLoading || loadError) return;
    onCountChange?.(applications.length);
  }, [applications.length, isLoading, loadError, onCountChange]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    for (const s of APPLICATION_STATUSES) counts[s] = 0;
    for (const a of applications) counts[a.status] = (counts[a.status] || 0) + 1;
    return counts;
  }, [applications]);

  const visible = useMemo(
    () => (statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter)),
    [applications, statusFilter],
  );

  /** Response rate over applications that actually went out — counting drafts
   *  in the denominator would punish the user for work in progress. */
  const stats = useMemo(() => {
    const sent = applications.filter((a) => a.emailSentAt).length;
    const answered = applications.filter(
      (a) => a.status === 'interview' || a.status === 'offer' || a.status === 'rejected',
    ).length;
    return { sent, answered, rate: sent ? Math.round((answered / sent) * 100) : null };
  }, [applications]);

  const handleCreated = (app: JobApplication) => {
    setApplications((prev) => [app, ...prev]);
    setShowModal(false);
    setSelected(app);
  };

  const handleDeleted = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
  };

  // Stable identity: the detail view polls on this while a send is retrying,
  // and a fresh function each render would restart that timer before it ever
  // fired. Both setters are stable, so it has no dependencies.
  const handleRegenerated = useCallback((updated: JobApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  }, []);

  return (
    <motion.div
      key="applications"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {selected ? (
          <ApplicationDetail
            key={selected.id}
            app={selected}
            subscription={subscription}
            onBack={() => setSelected(null)}
            onDeleted={() => handleDeleted(selected.id)}
            onRegenerated={handleRegenerated}
            onPreviewCv={() => setPreviewCv({ id: selected.cvId, title: selected.cvTitle })}
          />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-[13px] text-txt-muted">
                <span>{applications.length} {t('applications.count') || 'candidature(s)'}</span>
                {stats.sent > 0 && (
                  <>
                    <span className="text-txt-dim">·</span>
                    <span>{stats.sent} {t('applications.statSent') || 'envoyées'}</span>
                    {stats.rate !== null && (
                      <>
                        <span className="text-txt-dim">·</span>
                        <span>
                          {stats.rate}% {t('applications.statResponseRate') || 'de réponses'}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-[13px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 overflow-hidden shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                <PlusIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{t('applications.newButton') || 'Nouvelle candidature'}</span>
              </button>
            </div>

            {/* Status filters. Empty buckets are hidden so the row doesn't
                become a wall of zeros for someone with three applications. */}
            {applications.length > 0 && (
              <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                {(['all', ...APPLICATION_STATUSES] as const)
                  .filter((key) => key === 'all' || statusFilter === key || statusCounts[key] > 0)
                  .map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                        statusFilter === key
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : 'bg-surface2 text-txt-muted border-transparent hover:border-border'
                      }`}
                    >
                      {key === 'all'
                        ? (t('applications.filterAll') || 'Toutes')
                        : (t(STATUS_LABEL_KEY[key]) || key)}
                      <span className="ms-1.5 text-txt-dim font-semibold">{statusCounts[key] || 0}</span>
                    </button>
                  ))}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-20">
                <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : loadError ? (
              <div className="text-center py-20 bg-surface/50 border border-dashed border-red-500/30 rounded-3xl">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500/70 mb-4" />
                <h3 className="text-txt font-bold mb-1.5">{t('applications.loadErrorTitle') || 'Impossible de charger vos candidatures'}</h3>
                <p className="text-txt-muted text-sm max-w-sm mx-auto mb-6">{loadError}</p>
                <button
                  onClick={loadApplications}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[13px] font-bold hover:bg-blue-500/20 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  {t('applications.retry') || 'Réessayer'}
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20 bg-surface/50 border border-dashed border-border rounded-3xl">
                <BriefcaseIcon className="w-12 h-12 mx-auto text-txt-dim mb-4" />
                <h3 className="text-txt font-bold mb-1.5">{t('applications.emptyTitle') || 'Aucune candidature pour le moment'}</h3>
                <p className="text-txt-muted text-sm max-w-sm mx-auto mb-6">
                  {t('applications.emptyDesc') || "Liez un CV à une offre d'emploi et laissez l'IA rédiger votre lettre de motivation et votre e-mail de candidature."}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[13px] font-bold hover:bg-blue-500/20 transition-colors"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {t('applications.newButton') || 'Nouvelle candidature'}
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-16 bg-surface/50 border border-dashed border-border rounded-3xl">
                <BriefcaseIcon className="w-10 h-10 mx-auto text-txt-dim mb-3" />
                <p className="text-txt-muted text-sm">
                  {t('applications.noneInStatus') || 'Aucune candidature dans ce statut.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visible.map((app, i) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    delay={i}
                    onOpen={() => setSelected(app)}
                    onPreviewCv={() => setPreviewCv({ id: app.cvId, title: app.cvTitle })}
                    onDelete={() => {
                      apiFetch(`/applications/${app.id}/`, { method: 'DELETE' })
                        .then(() => handleDeleted(app.id))
                        .catch(() => { /* leave the card in place on failure */ });
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <NewApplicationModal
            drafts={drafts}
            subscription={subscription}
            onClose={() => setShowModal(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewCv && (
          <CvPreviewOverlay
            cvId={previewCv.id}
            cvTitle={previewCv.title}
            onClose={() => setPreviewCv(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
