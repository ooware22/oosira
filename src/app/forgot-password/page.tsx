'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { apiFetch } from '@/api/apiClient';
import { describeAuthError, tAuth } from '@/app/lib/authErrors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { t, dir } = useLanguage();
  const tt = (key: string, fallback: string) => tAuth(t, key, fallback);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const send = async () => {
    const trimmed = email.trim();
    setError('');
    if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
      setFieldError(describeAuthError({ status: 400, data: { code: trimmed ? 'email_invalid' : 'email_required' } }, t).message);
      return;
    }
    setFieldError('');
    setStatus('loading');
    try {
      await apiFetch('/auth/request-reset/', {
        method: 'POST',
        body: JSON.stringify({ email: trimmed }),
      });
      setStatus('success');
    } catch (err) {
      const info = describeAuthError(err, t);
      if (info.field === 'email') setFieldError(info.message);
      else setError(info.message);
      setStatus('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'loading') void send();
  };

  return (
    <div className="min-h-screen bg-bg text-txt flex flex-col font-body selection:bg-txt selection:text-bg relative overflow-hidden">

      {/* ── Background Elements ── */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-[50%] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-[-50%] pointer-events-none" />

      {/* ── Premium Top Bar ── */}
      <header className="absolute top-0 w-full px-6 lg:px-12 py-6 flex items-center justify-between z-50 bg-transparent">
        <Link href="/login" className="flex items-center gap-2 text-txt-muted hover:text-txt transition-colors">
          <ArrowLeftIcon className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{t('builder.back') || 'Back'}</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Logo Center */}
          <div className="flex justify-center mb-8">
            <Link href="/" dir="ltr" className="flex flex-row items-end group select-none hover:opacity-80 transition-opacity">
              <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-105 overflow-visible mb-1">
                <defs>
                  <linearGradient id="infinityForgot" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" fill="none" stroke="url(#infinityForgot)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">sira</span>
            </Link>
          </div>

          {/* Auth Card */}
          <div className="bg-surface/80 backdrop-blur-2xl border border-border rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/5">
            <h1 className="text-2xl font-bold text-txt text-center mb-2">{tt('auth.forgot_title', 'Mot de passe oublié')}</h1>
            <p className="text-txt-muted text-center text-sm mb-8">
              {tt('auth.forgot_subtitle', 'Saisissez votre e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.')}
            </p>

            {status === 'success' ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div role="status" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-sm leading-relaxed">
                  <p className="flex items-start gap-2 font-medium">
                    <EnvelopeIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>
                      {tt('auth.forgot_success', 'Si un compte existe pour {email}, un e-mail avec un lien de réinitialisation vient d’être envoyé. Le lien est valable 1 heure.')
                        .replace('{email}', email.trim())}
                    </span>
                  </p>
                  <p className="mt-2 text-[12px] opacity-90">
                    {tt('auth.forgot_spam_hint', 'Rien reçu après quelques minutes ? Vérifiez vos courriers indésirables (spam) et l’orthographe de l’adresse.')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => void send()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-txt hover:bg-surface2 transition-colors"
                  >
                    {tt('auth.forgot_resend', 'Renvoyer le lien')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatus('idle'); setEmail(''); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-txt hover:bg-surface2 transition-colors"
                  >
                    {tt('auth.forgot_other_email', 'Utiliser une autre adresse')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {error && (
                  <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-center text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.email') || 'Email Address'}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldError(''); }}
                    placeholder="hello@example.com"
                    autoComplete="email"
                    aria-invalid={!!fieldError || undefined}
                    className={`w-full bg-surface2 border rounded-xl px-4 py-3.5 text-sm text-txt outline-none transition-all duration-200 focus:ring-4 placeholder:text-txt-dim ${fieldError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10' : 'border-border focus:border-blue-500 focus:ring-blue-500/10'}`}
                  />
                  {fieldError && <p className="text-[12px] text-red-600 dark:text-red-400">{fieldError}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="group relative w-full inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-white font-medium text-[14px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 hover:shadow-xl overflow-hidden cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 ease-out z-0"></div>
                    <span className="relative z-10 drop-shadow-sm pointer-events-none inline-flex items-center gap-2">
                      {status === 'loading' && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                      {status === 'loading' ? tt('auth.forgot_sending', 'Envoi en cours...') : tt('auth.forgot_submit', 'Envoyer le lien')}
                    </span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-border/60 text-center">
              <p className="text-sm text-txt-muted">
                {tt('auth.forgot_remembered', 'Vous vous en souvenez ?')}{' '}
                <Link href="/login" className="font-semibold text-txt hover:underline">
                  {tt('auth.back_to_login', 'Retour à la connexion')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
