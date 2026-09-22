'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/app/i18n/LanguageContext';
import {
  ACCEPTED_PHOTO_TYPES,
  PhotoError,
  clearStoredPhoto,
  loadStoredPhoto,
  processPhotoFile,
  storePhoto,
} from '@/app/lib/cvPhoto';
import {
  XMarkIcon,
  CameraIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * Asked right before a CV PDF is produced (download, or sending an
 * application): optionally add a photo. The photo stays on this device and
 * is handed back to the caller, which sends it only inside the request that
 * renders the PDF. It is never saved with the CV.
 */
export default function PhotoPromptModal({ mode, onContinue, onClose, renderPreview }: {
  mode: 'download' | 'send';
  onContinue: (photo: string | null) => void;
  onClose: () => void;
  /** Renders the user's CV with the given photo at the given sheet scale. */
  renderPreview?: (photo: string | null, scale: number) => ReactNode;
}) {
  const { t } = useLanguage();
  const [photo, setPhoto] = useState<string | null>(() => loadStoredPhoto());
  const [remember, setRemember] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const hasPreview = !!renderPreview;
  const [previewScale, setPreviewScale] = useState(0.5);

  // Fit the A4 sheet (794px wide) to whatever width the preview box gets.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const fit = () => setPreviewScale(Math.min(0.6, Math.max(0.2, (el.clientWidth - 24) / 794)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      setPhoto(await processPhotoFile(file));
    } catch (err) {
      const code = err instanceof PhotoError ? err.code : 'read';
      setError(
        code === 'type'
          ? (t('photoPrompt.errorType') || 'Format non pris en charge. Utilisez une image JPEG, PNG ou WebP.')
          : code === 'size'
            ? (t('photoPrompt.errorSize') || 'Image trop lourde (10 Mo maximum).')
            : (t('photoPrompt.errorRead') || 'Impossible de lire cette image. Essayez-en une autre.'),
      );
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    clearStoredPhoto();
  };

  const continueWithPhoto = () => {
    if (!photo) return;
    if (remember) storePhoto(photo);
    else clearStoredPhoto();
    onContinue(photo);
  };

  const continueLabel = mode === 'send'
    ? (t('photoPrompt.continueSend') || "Continuer l'envoi")
    : (t('photoPrompt.continueDownload') || 'Continuer le téléchargement');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      // Often mounted inside another modal (the send wizard): without this,
      // the click would bubble on and close that one too.
      onClick={(e) => { e.stopPropagation(); onClose(); }}
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
            <CameraIcon className="w-5 h-5 text-blue-500" />
            {t('photoPrompt.title') || 'Ajouter une photo à votre CV ?'}
            <span className="text-[11px] font-semibold text-txt-muted bg-surface2 border border-border rounded-full px-2 py-0.5">
              {t('photoPrompt.optional') || 'Facultatif'}
            </span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 mb-5">
            <ShieldCheckIcon className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <p className="text-[12px] text-txt leading-relaxed">
              {t('photoPrompt.privacy')
                || "Votre photo n'est jamais enregistrée sur nos serveurs. Elle reste sur cet appareil et sert uniquement à générer ce PDF."}
            </p>
          </div>

          <div className={`grid gap-6 ${renderPreview ? 'md:grid-cols-[260px_1fr]' : ''}`}>
            <div className="flex flex-col items-center gap-4">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_PHOTO_TYPES.join(',')}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                  <img src={photo} alt="" className="w-40 h-40 object-cover shadow-md" />
                  <div className="flex gap-2">
                    <button
                      onClick={pick}
                      disabled={processing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[12px] font-semibold text-txt hover:bg-surface2 disabled:opacity-50"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      {t('photoPrompt.change') || 'Changer'}
                    </button>
                    <button
                      onClick={removePhoto}
                      disabled={processing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/5 disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                      {t('photoPrompt.remove') || 'Retirer'}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-txt-muted cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-blue-600"
                    />
                    {t('photoPrompt.remember') || 'Mémoriser sur cet appareil'}
                  </label>
                </>
              ) : (
                <button
                  onClick={pick}
                  disabled={processing}
                  className="w-full aspect-square max-w-[220px] rounded-2xl border-2 border-dashed border-border hover:border-blue-500/60 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-2 text-center px-4 transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <span className="inline-block w-7 h-7 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-[12px] text-txt-muted">{t('photoPrompt.processing') || 'Préparation de la photo...'}</span>
                    </>
                  ) : (
                    <>
                      <CameraIcon className="w-8 h-8 text-blue-500" />
                      <span className="text-[13px] font-bold text-txt">{t('photoPrompt.choose') || 'Choisir une photo'}</span>
                      <span className="text-[11px] text-txt-muted">{t('photoPrompt.chooseHint') || 'JPEG, PNG ou WebP, 10 Mo max'}</span>
                    </>
                  )}
                </button>
              )}
              {error && <p className="text-[12px] text-red-600 dark:text-red-400 text-center">{error}</p>}
            </div>

            {renderPreview && (
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-2">
                  {t('photoPrompt.previewTitle') || 'Aperçu'}
                </p>
                {/* Only the top of page 1 matters here: that is where the photo goes. */}
                <div ref={previewRef} className="rounded-2xl bg-surface2/40 border border-border p-3 h-[340px] overflow-hidden">
                  <div className="mx-auto" style={{ width: 'fit-content' }}>
                    {renderPreview(photo, previewScale)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={() => onContinue(null)}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-txt-muted hover:bg-surface2 transition-colors"
          >
            {t('photoPrompt.withoutPhoto') || 'Continuer sans photo'}
          </button>
          <button
            onClick={continueWithPhoto}
            disabled={!photo || processing}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {continueLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
