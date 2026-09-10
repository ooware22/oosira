'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { Meter } from '@/components/charts/primitives';
import { Candidate } from '@/app/data';
import {
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

/**
 * AI CV Score & Diagnostic. Unlike SpellCheckModal, nothing here is ever
 * auto-applied — this is a read-only report, so there's no accept/reject
 * step. Each gap just hands its `step` id back to the caller, which owns
 * STEPS and goTo().
 */

type Severity = 'critical' | 'important' | 'minor';
type CvGap = {
  id: string;
  severity: Severity;
  step: string;
  title: string;
  problem: string;
  solution: string;
};
type ScoreResult = { score: number; summary: string; gaps: CvGap[] };

const SEVERITY_STYLE: Record<Severity, { icon: typeof ExclamationTriangleIcon; classes: string }> = {
  critical: { icon: ExclamationTriangleIcon, classes: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20' },
  important: { icon: ExclamationCircleIcon, classes: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  minor: { icon: InformationCircleIcon, classes: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

function scoreTone(score: number): 'good' | 'warning' | 'critical' {
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

export default function CvScoreModal({ candidate, language, onClose, onFixStep, onScored }: {
  candidate: Candidate;
  language: string;
  onClose: () => void;
  onFixStep: (step: string) => void;
  /** Fired once, right after a successful analysis — the caller uses this to
   *  invalidate/refresh the subscription cache, mirroring the OCR/PDF quota
   *  UX precedent (invalidate + refresh right after the quota-consuming call
   *  succeeds, not on every close). */
  onScored?: () => void;
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  // React's dev-mode Strict Mode double-invokes mount effects, which would
  // otherwise fire two concurrent POST /cvs/score/ calls — the quota check
  // writes to the DB, so a genuine double-submit (also possible from an
  // impatient double-click) must not silently charge the quota twice.
  const inFlightRef = useRef(false);

  const run = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await apiFetch('/cvs/score/', {
        method: 'POST',
        body: JSON.stringify({ cv_data: candidate, language }),
      });
      setResult({ score: data.score, summary: data.summary, gaps: data.gaps || [] });
      onScored?.();
    } catch (err: any) {
      setError(err.message || t('cvScore.error') || 'CV analysis failed.');
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate, language, t]);

  useEffect(() => { run(); }, [run]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-[16px] font-bold text-txt flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-500" />
            {t('cvScore.title') || 'Score de votre CV'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="text-center py-16">
              <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[13px] text-txt-muted mt-4">
                {t('cvScore.loading') || 'Analyse en cours...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-14">
              <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-red-500/70 mb-3" />
              <p className="text-[13px] text-txt-muted mb-5">{error}</p>
              <button
                onClick={() => { setIsLoading(true); setError(null); run(); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20"
              >
                {t('cvScore.retry') || 'Réessayer'}
              </button>
            </div>
          ) : result && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border p-4">
                <Meter
                  label={t('cvScore.scoreLabel') || 'Score global'}
                  value={result.score}
                  tone={scoreTone(result.score)}
                />
                {result.summary && (
                  <p className="text-[13px] text-txt-muted mt-3 leading-relaxed">{result.summary}</p>
                )}
              </div>

              {result.gaps.length === 0 ? (
                <p className="text-[13px] text-txt-muted text-center py-6">
                  {t('cvScore.noGaps') || 'Aucun point faible majeur détecté.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {result.gaps.map((gap) => {
                    const style = SEVERITY_STYLE[gap.severity] || SEVERITY_STYLE.minor;
                    const Icon = style.icon;
                    return (
                      <div key={gap.id} className={`border rounded-2xl p-4 ${style.classes}`}>
                        <div className="flex items-start gap-2.5">
                          <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-txt">{gap.title}</p>
                            <p className="text-[12px] text-txt-muted mt-1">{gap.problem}</p>
                            <p className="text-[12px] text-txt mt-1.5 font-medium">{gap.solution}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onFixStep(gap.step)}
                          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {t('cvScore.fix') || 'Corriger'} <ArrowRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
