'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useAuth } from '@/app/auth/AuthContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { ArrowLeftIcon, GiftIcon } from '@heroicons/react/24/outline';
import { useState, useSyncExternalStore } from 'react';
import { getPendingReferral } from '@/app/lib/referralCode';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordRules from '@/components/auth/PasswordRules';
import { describeAuthError, passwordRuleState, tAuth } from '@/app/lib/authErrors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Field = 'name' | 'email' | 'password';

const noSubscribe = () => () => {};

export default function RegisterPage() {
  const { t, dir } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [emailTaken, setEmailTaken] = useState(false);
  // Read from localStorage only on the client; the server render shows no banner.
  const invited = useSyncExternalStore(noSubscribe, () => !!getPendingReferral(), () => false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Without this guard a double-click fired two overlapping register
    // requests; the backend had no protection against that race either
    // (see accounts/views.py), so the second request could 500 and the
    // user — seeing nothing happen either time — would keep clicking.
    if (isSubmitting) return;
    setError(null);
    setEmailTaken(false);

    // Checked here first, in the user's language, so the common mistakes are
    // flagged instantly and next to the right field.
    const msg = (code: string, extra: Record<string, unknown> = {}) =>
      describeAuthError({ status: 400, data: { code, ...extra } }, t).message;
    const local: Partial<Record<Field, string>> = {};
    const trimmedEmail = email.trim();
    if (!name.trim()) local.name = msg('name_required');
    if (!trimmedEmail) local.email = msg('email_required');
    else if (!EMAIL_PATTERN.test(trimmedEmail)) local.email = msg('email_invalid');
    if (!password) local.password = msg('password_required');
    else {
      const rules = passwordRuleState(password);
      const reasons = [!rules.length && 'too_short', !rules.notNumeric && 'entirely_numeric'].filter(Boolean) as string[];
      if (reasons.length) local.password = msg('password_invalid', { reasons });
    }
    setFieldErrors(local);
    if (Object.keys(local).length) return;

    setIsSubmitting(true);
    const result = await register(name.trim(), trimmedEmail, password);
    if (result === true) {
      // Check for pending CV from builder (created before signup)
      await savePendingCV();
      router.push('/dashboard');
      return;
    }
    const info = describeAuthError(result, t);
    if (info.field === 'name' || info.field === 'email' || info.field === 'password') {
      setFieldErrors({ [info.field]: info.message });
      setEmailTaken(info.code === 'email_taken');
    } else {
      setError(info.message);
    }
    setIsSubmitting(false);
  };

  const clearField = (field: Field) => setFieldErrors((f) => ({ ...f, [field]: undefined }));
  const inputClass = (field: Field) =>
    `w-full bg-surface2 border rounded-xl px-4 py-3.5 text-sm text-txt outline-none transition-all duration-200 focus:ring-4 placeholder:text-txt-dim ${
      fieldErrors[field] ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10' : 'border-border focus:border-blue-500 focus:ring-blue-500/10'
    }`;

  const savePendingCV = async () => {
    try {
      const pendingRaw = localStorage.getItem('oosira_pending_cv');
      if (!pendingRaw) return;

      const pending = JSON.parse(pendingRaw);
      const { formData, activeTemplate, styleConfig, cvTitle } = pending;

      // Written while some existing account was signed in: never the new
      // user's, so it must not be imported into their account.
      if (pending.ownerEmail) {
        localStorage.removeItem('oosira_pending_cv');
        return;
      }

      // Don't save empty CVs
      if (!formData || (!formData.prenom && !formData.nom && !formData.email)) {
        localStorage.removeItem('oosira_pending_cv');
        return;
      }

      const token = localStorage.getItem('oosira_token');
      if (!token) return;

      const TEMPLATE_NAMES: Record<number, string> = {
        0: "Classique",
        1: "Classique Pro",
        2: "Moderne",
        3: "Ingenieur",
        4: "Elegant",
        5: "Minimal",
      };

      const cvPayload = {
        title: cvTitle || `CV ${formData.prenom || ''} ${formData.nom || ''}`.trim() || 'Mon CV',
        jobTitle: formData.titre || '',
        templateName: TEMPLATE_NAMES[activeTemplate] || 'Classique Pro',
        templateId: activeTemplate,
        previewColor: styleConfig?.sidebarBg || styleConfig?.accentColor || '#0D1117',
        completionPercent: 50,
        status: 'draft',
        reminderDate: null,
        cvData: formData,
        styleConfig: styleConfig,
      };

      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API}/cvs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cvPayload),
      });

      // Only clear pending CV if save was successful
      if (res.ok) {
        localStorage.removeItem('oosira_pending_cv');
      }
    } catch (err) {
      console.error('Failed to save pending CV:', err);
      // Don't block the user flow — they can still access dashboard
    }
  };

  return (
    <div className="min-h-screen bg-bg text-txt flex flex-col font-body selection:bg-txt selection:text-bg relative overflow-hidden">
      
      {/* ── Background Elements ── */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-[50%] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-[-50%] pointer-events-none" />

      {/* ── Premium Top Bar ── */}
      <header className="absolute top-0 w-full px-6 lg:px-12 py-6 flex items-center justify-between z-50 bg-transparent">
        <Link href="/" className="flex items-center gap-2 text-txt-muted hover:text-txt transition-colors">
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
                  <linearGradient id="infinityRegister" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" fill="none" stroke="url(#infinityRegister)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">sira</span>
            </Link>
          </div>

          {/* Auth Card */}
          <div className="bg-surface/80 backdrop-blur-2xl border border-border rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/5">
            <h1 className="text-2xl font-bold text-txt text-center mb-2">{t('auth.signup_title')}</h1>
            <p className="text-txt-muted text-center text-sm mb-8">{t('auth.signup_subtitle')}</p>

            {invited && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 mb-6">
                <GiftIcon className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <p className="text-[12px] text-txt leading-relaxed">
                  {t('auth.referralInvited')
                    || 'Vous avez été invité par un ami : des générations IA vous sont offertes dès que vous créez votre premier CV.'}
                </p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearField('name'); }}
                  placeholder="John Doe"
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.name || undefined}
                  className={inputClass('name')}
                />
                {fieldErrors.name && <p className="text-[12px] text-red-600 dark:text-red-400">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearField('email'); setEmailTaken(false); }}
                  placeholder="hello@example.com"
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email || undefined}
                  className={inputClass('email')}
                />
                {fieldErrors.email && (
                  <p className="text-[12px] text-red-600 dark:text-red-400">
                    {fieldErrors.email}
                    {emailTaken && (
                      <>
                        {' '}
                        <Link href="/login" className="font-semibold underline">{tAuth(t, 'auth.email_taken_login', 'Se connecter')}</Link>
                        {' · '}
                        <Link href="/forgot-password" className="font-semibold underline">{t('auth.forgot')}</Link>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.password')}</label>
                <PasswordInput
                  value={password}
                  onChange={(v) => { setPassword(v); clearField('password'); }}
                  invalid={!!fieldErrors.password}
                  autoComplete="new-password"
                />
                {fieldErrors.password && <p className="text-[12px] text-red-600 dark:text-red-400">{fieldErrors.password}</p>}
                <PasswordRules password={password} />
              </div>

              {error && (
                <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-white font-medium text-[14px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 hover:shadow-xl overflow-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  {/* Shifting Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 ease-out z-0"></div>

                  {/* Light Beam Sweep Effect */}
                  <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700 ease-in-out z-0 pointer-events-none"></div>

                  <span className="relative z-10 drop-shadow-sm pointer-events-none flex items-center gap-2">
                    {isSubmitting && (
                      <span className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    )}
                    {isSubmitting ? tAuth(t, 'auth.signing_up', 'Création du compte...') : t('auth.submit_signup')}
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border/60 text-center">
              <p className="text-sm text-txt-muted">
                {t('auth.have_account')}{' '}
                <Link href="/login" className="font-semibold text-txt hover:underline">
                   {t('nav.login')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
