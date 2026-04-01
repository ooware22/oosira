'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/builder');
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
            <Link href="/" className="flex flex-row items-end group select-none hover:opacity-80 transition-opacity">
              <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-105 overflow-visible mb-[6px]">
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.name')}</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-sm text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  placeholder="hello@example.com"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-sm text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3.5 text-sm text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-4 py-3.5 rounded-xl bg-txt text-bg font-semibold text-[14px] transition-all hover:opacity-90 active:scale-[0.98] shadow-md shadow-txt/10"
                >
                  {t('auth.submit_signup')}
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
