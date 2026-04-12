'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useAuth } from '@/app/auth/AuthContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function RegisterPage() {
  const { t, dir } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) {
      router.push('/dashboard');
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
                  className="group relative w-full inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-white font-medium text-[14px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 hover:shadow-xl overflow-hidden cursor-pointer"
                >
                  {/* Shifting Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 ease-out z-0"></div>
                  
                  {/* Light Beam Sweep Effect */}
                  <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700 ease-in-out z-0 pointer-events-none"></div>

                  <span className="relative z-10 drop-shadow-sm pointer-events-none">{t('auth.submit_signup')}</span>
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
