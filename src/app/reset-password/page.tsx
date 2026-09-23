'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, Suspense } from 'react';
import { apiFetch } from '@/api/apiClient';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordRules from '@/components/auth/PasswordRules';
import { describeAuthError, passwordRuleState, tAuth } from '@/app/lib/authErrors';

const LINK_CODES = ['token_missing', 'token_invalid', 'token_expired'];

function ResetPasswordForm() {
  const { t } = useLanguage();
  const tt = (key: string, fallback: string) => tAuth(t, key, fallback);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // The link is checked as soon as the page opens, so an expired or used link
  // is explained before anyone types a new password twice.
  const [phase, setPhase] = useState<'checking' | 'invalid' | 'ready' | 'saving' | 'success'>(token ? 'checking' : 'invalid');
  const [linkError, setLinkError] = useState(() =>
    token ? '' : describeAuthError({ status: 400, data: { code: 'token_missing' } }, t).message);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiFetch(`/auth/confirm-reset/?token=${encodeURIComponent(token)}`)
      .then(() => { if (!cancelled) setPhase('ready'); })
      .catch((err) => {
        if (cancelled) return;
        const info = describeAuthError(err, t);
        if (info.code && LINK_CODES.includes(info.code)) {
          setLinkError(info.message);
          setPhase('invalid');
        } else {
          // Couldn't check (offline, server down): say so and offer a retry.
          setError(info.message);
          setPhase('ready');
        }
      });
    return () => { cancelled = true; };
  }, [token, t, checkAttempt]);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'saving') return;
    setError('');
    const rules = passwordRuleState(password);
    const reasons = [!rules.length && 'too_short', !rules.notNumeric && 'entirely_numeric'].filter(Boolean) as string[];
    if (!password) {
      setPasswordError(describeAuthError({ status: 400, data: { code: 'password_required' } }, t).message);
      return;
    }
    if (reasons.length) {
      setPasswordError(describeAuthError({ status: 400, data: { code: 'password_invalid', reasons } }, t).message);
      return;
    }
    if (password !== confirmPassword) return;
    setPasswordError('');

    setPhase('saving');
    try {
      await apiFetch('/auth/confirm-reset/', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      setPhase('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      const info = describeAuthError(err, t);
      if (info.code && LINK_CODES.includes(info.code)) {
        setLinkError(info.message);
        setPhase('invalid');
        return;
      }
      if (info.field === 'password') setPasswordError(info.message);
      else setError(info.message);
      setPhase('ready');
    }
  };

  if (phase === 'checking') {
    return (
      <div className="flex flex-col items-center py-10 gap-3">
        <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-txt-muted">{tt('auth.reset_checking', 'Vérification du lien...')}</p>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-txt mb-2">{tt('auth.reset_link_problem', 'Ce lien ne fonctionne plus')}</h2>
        <p role="alert" className="text-sm text-txt-muted mb-6">{linkError}</p>
        <Link href="/forgot-password" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
          {tt('auth.reset_request_new', 'Demander un nouveau lien')}
        </Link>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-4 py-8">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-txt mb-2">{tt('auth.reset_success_title', 'Mot de passe modifié !')}</h2>
        <p role="status" className="text-sm text-txt-muted text-center mb-6">
          {tt('auth.reset_success_desc', 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe. Redirection vers la connexion...')}
        </p>
        <Link href="/login" className="px-6 py-2.5 bg-surface2 hover:bg-border rounded-xl text-sm font-medium transition-colors">
          {tt('auth.back_to_login', 'Retour à la connexion')}
        </Link>
      </motion.div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-center text-sm">
          {error}
          <button type="button" onClick={() => { setError(''); setPhase('checking'); setCheckAttempt((n) => n + 1); }} className="block mx-auto mt-1 text-[12px] font-semibold underline">
            {tt('auth.retry', 'Réessayer')}
          </button>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{tt('auth.reset_new_password', 'Nouveau mot de passe')}</label>
        <PasswordInput
          value={password}
          onChange={(v) => { setPassword(v); setPasswordError(''); }}
          invalid={!!passwordError}
          autoComplete="new-password"
        />
        {passwordError && <p className="text-[12px] text-red-600 dark:text-red-400">{passwordError}</p>}
        <PasswordRules password={password} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{tt('auth.reset_confirm_password', 'Confirmez le mot de passe')}</label>
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          invalid={mismatch}
          autoComplete="new-password"
        />
        {mismatch && (
          <p className="text-[12px] text-red-600 dark:text-red-400">
            {tt('auth.reset_mismatch', 'Les deux mots de passe ne correspondent pas.')}
          </p>
        )}
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={phase === 'saving'}
          className="group relative w-full inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-white font-medium text-[14px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 hover:shadow-xl overflow-hidden cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 ease-out z-0"></div>
          <span className="relative z-10 drop-shadow-sm pointer-events-none inline-flex items-center gap-2">
            {phase === 'saving' && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {phase === 'saving' ? tt('auth.reset_saving', 'Enregistrement...') : tt('auth.reset_submit', 'Changer le mot de passe')}
          </span>
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-bg text-txt flex flex-col font-body selection:bg-txt selection:text-bg relative overflow-hidden">
      
      {/* ── Background Elements ── */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-[50%] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-[-50%] pointer-events-none" />

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
              <svg width="36" height="20" viewBox="1 6 22 12" className="text-emerald-600 dark:text-emerald-500 transition-transform group-hover:scale-105 overflow-visible mb-1">
                <defs>
                  <linearGradient id="infinityReset" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" fill="none" stroke="url(#infinityReset)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">sira</span>
            </Link>
          </div>

          {/* Auth Card */}
          <div className="bg-surface/80 backdrop-blur-2xl border border-border rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/5">
            <h1 className="text-2xl font-bold text-txt text-center mb-2">{tAuth(t, 'auth.reset_title', 'Nouveau mot de passe')}</h1>
            <p className="text-txt-muted text-center text-sm mb-8">{tAuth(t, 'auth.reset_subtitle', 'Choisissez un nouveau mot de passe pour votre compte.')}</p>
            <Suspense fallback={<div className="text-center p-8 text-txt-muted text-sm">{tAuth(t, 'auth.reset_checking', 'Vérification du lien...')}</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
