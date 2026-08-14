'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { diffWords, countChanges, DiffSegment } from '@/app/lib/wordDiff';
import {
  CheckCircleIcon,
  XMarkIcon,
  LanguageIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * Runs the proofreader over a set of fields and shows what it would change,
 * word by word, before anything is saved. Nothing is applied until the user
 * accepts — an AI corrector will occasionally "fix" a company name or an
 * acronym that was right, so the diff is the safety net.
 */

export type SpellCheckField = { id: string; label: string; value: string };

function DiffView({ segments }: { segments: DiffSegment[] }) {
  return (
    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === 'same') return <span key={i}>{seg.text}</span>;
        if (seg.type === 'removed') {
          return (
            <span key={i} className="bg-red-500/15 text-red-600 dark:text-red-400 line-through rounded px-0.5">
              {seg.text}
            </span>
          );
        }
        return (
          <span key={i} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold rounded px-0.5">
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}

export default function SpellCheckModal({ fields, language, onApply, onClose }: {
  fields: SpellCheckField[];
  language: string;
  onApply: (corrections: Record<string, string>) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  // No synchronous setState here: the state starts in its loading form and
  // every update below happens after the await, so mounting this modal
  // doesn't trigger a cascading re-render. The retry button resets the flags
  // itself before calling again.
  const run = useCallback(async () => {
    try {
      const texts: Record<string, string> = {};
      fields.forEach((f) => { if (f.value.trim()) texts[f.id] = f.value; });

      const data = await apiFetch('/proofread/', {
        method: 'POST',
        body: JSON.stringify({ texts, language }),
      });
      const result: Record<string, string> = data.corrections || {};
      setCorrections(result);
      // Everything the proofreader changed starts accepted; the user unticks
      // anything it got wrong.
      const initial: Record<string, boolean> = {};
      Object.keys(result).forEach((k) => { initial[k] = true; });
      setAccepted(initial);
    } catch (err: any) {
      setError(err.message || t('spellcheck.error') || 'Spell check failed.');
    } finally {
      setIsLoading(false);
    }
  }, [fields, language, t]);

  useEffect(() => { run(); }, [run]);

  const changed = fields
    .map((f) => ({ field: f, corrected: corrections[f.id] }))
    .filter((x) => typeof x.corrected === 'string' && x.corrected !== x.field.value);

  const acceptedCount = changed.filter((x) => accepted[x.field.id]).length;

  const handleApply = () => {
    const toApply: Record<string, string> = {};
    changed.forEach((x) => {
      if (accepted[x.field.id]) toApply[x.field.id] = x.corrected as string;
    });
    onApply(toApply);
  };

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
        className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-[16px] font-bold text-txt flex items-center gap-2">
            <LanguageIcon className="w-5 h-5 text-blue-500" />
            {t('spellcheck.title') || "Correction de l'orthographe"}
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
                {t('spellcheck.checking') || 'Vérification en cours...'}
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
                {t('spellcheck.retry') || 'Réessayer'}
              </button>
            </div>
          ) : changed.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <h3 className="font-bold text-txt mb-1">{t('spellcheck.noErrors') || 'Aucune faute détectée'}</h3>
              <p className="text-[13px] text-txt-muted">
                {t('spellcheck.noErrorsDesc') || 'Votre texte ne contient aucune faute d’orthographe.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-[12px] text-txt-muted">
                {t('spellcheck.legend') || 'Rouge = supprimé, vert = corrigé. Décochez ce que vous ne voulez pas modifier.'}
              </p>
              {changed.map(({ field, corrected }) => {
                const segments = diffWords(field.value, corrected as string);
                return (
                  <div key={field.id} className="border border-border rounded-2xl overflow-hidden">
                    <label className="flex items-center gap-2.5 px-4 py-2.5 bg-surface2/60 border-b border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!accepted[field.id]}
                        onChange={(e) => setAccepted((p) => ({ ...p, [field.id]: e.target.checked }))}
                        className="w-4 h-4 rounded border-border accent-blue-600 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">{field.label}</span>
                      <span className="ms-auto text-[11px] text-txt-dim">
                        {countChanges(segments)} {t('spellcheck.changes') || 'correction(s)'}
                      </span>
                    </label>
                    <div className="p-4 text-txt max-h-56 overflow-y-auto">
                      <DiffView segments={segments} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isLoading && !error && changed.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-txt-muted hover:bg-surface2 transition-colors"
            >
              {t('spellcheck.cancel') || 'Annuler'}
            </button>
            <button
              onClick={handleApply}
              disabled={acceptedCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[12px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {(t('spellcheck.apply') || 'Appliquer')} ({acceptedCount})
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
