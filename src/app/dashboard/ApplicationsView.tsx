'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { DraftCV, useAuth } from '@/app/auth/AuthContext';
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
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

interface JobApplication {
  id: string;
  cvId: string;
  cvTitle: string;
  jobTitle: string;
  companyName: string;
  jobOfferText: string;
  language: string;
  generatedCoverLetter: string;
  generatedEmailSubject: string;
  generatedEmailBody: string;
  recipientEmail: string;
  senderEmail: string;
  emailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const LANGUAGES: { id: string; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

function fmtDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ── Small local field primitives (mirroring FormField's visual language,
//    which is private to dashboard/page.tsx and can't be imported here) ──
function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-txt-dim"
      />
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

// ── Card in the applications list ──
function ApplicationCard({ app, onOpen, onDelete, delay }: {
  app: JobApplication; onOpen: () => void; onDelete: () => void; delay: number;
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
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-txt-dim">
        <span className="inline-flex items-center gap-1.5 bg-surface2 text-txt-muted px-2 py-1 rounded-full truncate max-w-[60%]">
          <DocumentTextIcon className="w-3 h-3 shrink-0" />
          {app.cvTitle}
        </span>
        <span className="flex items-center gap-2">
          {app.emailSentAt && (
            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
              <CheckCircleIcon className="w-3 h-3" />
              {t('applications.sentBadge') || 'Envoyé'}
            </span>
          )}
          {fmtDate(app.updatedAt, language)}
        </span>
      </div>
    </motion.div>
  );
}

// ── Detail / result panel ──
function ApplicationDetail({ app, subscription, onBack, onDeleted, onRegenerated }: {
  app: JobApplication;
  subscription: ReturnType<typeof useSubscription>;
  onBack: () => void;
  onDeleted: () => void;
  onRegenerated: (updated: JobApplication) => void;
}) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [recipientEmail, setRecipientEmail] = useState(app.recipientEmail || '');
  const [senderEmail, setSenderEmail] = useState(app.senderEmail || user?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendQuotaExceeded, setSendQuotaExceeded] = useState(false);

  const [coverLetterDraft, setCoverLetterDraft] = useState(app.generatedCoverLetter);
  const [emailSubjectDraft, setEmailSubjectDraft] = useState(app.generatedEmailSubject);
  const [emailBodyDraft, setEmailBodyDraft] = useState(app.generatedEmailBody);
  const [isSavingLetter, setIsSavingLetter] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [letterSaved, setLetterSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // No prop-watching effect resets these: switching application remounts this
  // component (keyed on the id by the parent), and after a save the drafts
  // already hold what was saved. Regenerate is the one case that replaces the
  // content under the user, so it resets the drafts explicitly below.
  const letterDirty = coverLetterDraft !== app.generatedCoverLetter;
  const emailDirty = emailSubjectDraft !== app.generatedEmailSubject || emailBodyDraft !== app.generatedEmailBody;

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

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setSendError(null);
    setSendQuotaExceeded(false);
    try {
      const updated = await apiFetch(`/applications/${app.id}/send-email/`, {
        method: 'POST',
        body: JSON.stringify({ recipientEmail, senderEmail }),
      });
      subscription.refresh();
      onRegenerated(updated);
    } catch (err: any) {
      if (err.status === 402) {
        setSendQuotaExceeded(true);
      } else {
        setSendError(err.message || t('applications.sendError') || 'Failed to send the email.');
      }
    } finally {
      setIsSending(false);
    }
  };

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
            <h2 className="text-xl font-bold text-txt">{app.jobTitle}</h2>
            <p className="text-[13px] text-txt-muted flex items-center gap-1.5 mt-1">
              <BuildingOffice2Icon className="w-4 h-4" /> {app.companyName}
              <span className="text-txt-dim">·</span>
              <DocumentTextIcon className="w-4 h-4" /> {app.cvTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Cover letter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[12px] font-bold text-txt-muted uppercase tracking-wider flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-blue-500" />
              {t('applications.coverLetter') || 'Lettre de motivation'}
            </h3>
            <div className="flex items-center gap-1">
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
          <textarea
            value={coverLetterDraft}
            onChange={(e) => setCoverLetterDraft(e.target.value)}
            rows={14}
            className="w-full bg-surface2/60 border border-border rounded-2xl p-5 text-[13px] text-txt leading-relaxed whitespace-pre-wrap resize-y outline-none transition-colors focus:border-blue-500/40 max-h-[420px]"
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
            <textarea
              value={emailBodyDraft}
              onChange={(e) => setEmailBodyDraft(e.target.value)}
              rows={8}
              className="w-full p-5 text-[13px] text-txt leading-relaxed whitespace-pre-wrap resize-y outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Send email */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-[12px] font-bold text-txt-muted uppercase tracking-wider flex items-center gap-2 mb-3">
            <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />
            {t('applications.sendEmailAction') || 'Envoyer par e-mail'}
          </h3>

          {app.emailSentAt && (
            <div className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircleIcon className="w-4 h-4" />
              {t('applications.sentOn') || 'Envoyé le'} {fmtDate(app.emailSentAt, language)}
            </div>
          )}

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label={t('applications.recipientEmail') || "E-mail du destinataire"}
                value={recipientEmail}
                onChange={setRecipientEmail}
                required
                placeholder={t('applications.recipientEmailPlaceholder') || 'Ex. recrutement@entreprise.com'}
              />
              <div className="space-y-1.5">
                <Field
                  label={t('applications.senderEmail') || 'Votre e-mail (réponses)'}
                  value={senderEmail}
                  onChange={setSenderEmail}
                  required
                  placeholder={t('applications.senderEmailHint') || 'Votre adresse e-mail'}
                />
              </div>
            </div>

            {sendQuotaExceeded && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
                <LockClosedIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[12px] text-amber-700 dark:text-amber-400">
                  {t('applications.quotaExceeded') || 'Limite mensuelle atteinte.'}{' '}
                  <Link href="/dashboard?view=pricing" className="font-bold underline">
                    {t('applications.upgrade') || 'Passer à Pro'}
                  </Link>
                </div>
              </div>
            )}

            {sendError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {sendError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-60"
            >
              <PaperAirplaneIcon className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
              {isSending ? (t('applications.sending') || 'Envoi en cours...') : (t('applications.sendEmailAction') || 'Envoyer par e-mail')}
            </button>
          </form>
        </div>
      </div>
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
export default function ApplicationsView({ drafts, subscription }: {
  drafts: DraftCV[];
  subscription: ReturnType<typeof useSubscription>;
}) {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<JobApplication | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/applications/')
      .then((data) => { if (!cancelled) setApplications(data); })
      .catch(() => { /* list stays empty; the view still renders */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreated = (app: JobApplication) => {
    setApplications((prev) => [app, ...prev]);
    setShowModal(false);
    setSelected(app);
  };

  const handleDeleted = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
  };

  const handleRegenerated = (updated: JobApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelected(updated);
  };

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
          />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-txt-muted">
                {applications.length} {t('applications.count') || 'candidature(s)'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-[13px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                <PlusIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{t('applications.newButton') || 'Nouvelle candidature'}</span>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map((app, i) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    delay={i}
                    onOpen={() => setSelected(app)}
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
    </motion.div>
  );
}
