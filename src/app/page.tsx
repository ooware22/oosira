'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};





export default function LandingPage() {
  const { t, dir } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user has a valid token stored
    const token = localStorage.getItem('oosira_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-txt overflow-hidden selection:bg-txt selection:text-bg font-body flex flex-col relative z-0">



      {/* ── Floating Navigation ── */}
      <nav className="relative z-50 px-6 lg:px-12 py-6 flex items-center justify-between bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center shrink-0 sm:w-1/3"
        >
          <Link href="/" dir="ltr" className="flex flex-row items-end group select-none">
            {/* Beautiful Custom SVG Infinity Logo */}
            <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] overflow-visible mb-1">
              <defs>
                <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path 
                d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
                fill="none"
                stroke="url(#infinityGradient)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">
              sira
            </span>
          </Link>
        </motion.div>

        {/* Minimalist links mimicking Antigravity style (non-functional for visual flair), perfectly centered */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center justify-center w-1/3 gap-6 text-[13px] font-medium text-txt-muted"
        >
          <Link href="#" className="relative text-txt-muted hover:text-txt transition-colors group">
            {t('nav.product')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"></span>
          </Link>
          <Link href="#" className="relative text-txt-muted hover:text-txt transition-colors group">
            {t('nav.useCases')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"></span>
          </Link>
          <Link href="#" className="relative text-txt-muted hover:text-txt transition-colors group">
            {t('nav.pricing')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"></span>
          </Link>
          <Link href="#" className="relative text-txt-muted hover:text-txt transition-colors group">
            {t('nav.resources')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"></span>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex gap-1.5 sm:gap-4 items-center justify-end flex-wrap sm:flex-nowrap sm:w-1/3"
        >
          <ThemeToggle />
          <LanguageToggle />
          
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-txt text-bg font-semibold text-[12px] sm:text-[13px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md hover:shadow-txt/20 ml-1 sm:ml-0 rtl:ml-0 rtl:mr-1 sm:rtl:mr-0 overflow-hidden">
            {/* Quick Light Sweep */}
            <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-bg/20 to-transparent -skew-x-12 transition-all duration-500 ease-in-out z-0"></div>
            <span className="relative z-10">{isLoggedIn ? (t('nav.dashboard') && t('nav.dashboard') !== 'nav.dashboard' ? t('nav.dashboard') : "Dashboard") : t('nav.login')}</span>
            <ArrowRightIcon className={`relative z-10 w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:${dir === 'rtl' ? '-translate-x-1' : 'translate-x-1'} rtl:rotate-180`} />
          </Link>
        </motion.div>
      </nav>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20">
        
        <section className="w-full max-w-full flex flex-col items-center text-center">
          


          {/* Floating Handwritten Title */}
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ 
              opacity: { duration: 0.8 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="font-display text-[45px] sm:text-[60px] lg:text-[75px] font-bold text-txt leading-[1.1] mb-12 w-full max-w-none px-4 tracking-tight"
          >
            {t('hero.title1')} <br />
            {(() => {
              const title2 = t('hero.title2');
              const lastSpaceIndex = title2.lastIndexOf(' ');
              if (lastSpaceIndex === -1) {
                return (
                  <span className="relative inline-block whitespace-nowrap">
                    <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 pb-1 pr-2">{title2}</span>
                    <motion.svg 
                      className="absolute -bottom-2.5 sm:-bottom-3 rtl:-bottom-4 sm:rtl:-bottom-6 left-0 w-full h-4 sm:h-6 z-[-1]" 
                      viewBox="0 0 100 20" 
                      preserveAspectRatio="none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1, delay: 0.6 }}
                    >
                      <defs>
                        <linearGradient id="heroGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" className="text-blue-600 dark:text-blue-500" stopColor="currentColor" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <motion.path 
                        d="M5 15 Q 50 0 95 15" 
                        stroke="url(#heroGradient1)" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ 
                          pathLength: { duration: 2.5, ease: "easeInOut" }
                        }}
                      />
                    </motion.svg>
                  </span>
                );
              }
              const rest = title2.substring(0, lastSpaceIndex + 1);
              const last = title2.substring(lastSpaceIndex + 1);
              return (
                <>
                  {rest}
                  <span className="relative inline-block whitespace-nowrap pr-2 pl-2">
                    <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 pb-1 pr-2">{last}</span>
                    <motion.svg 
                      className="absolute -bottom-2.5 sm:-bottom-3 rtl:-bottom-4 sm:rtl:-bottom-6 left-0 w-full h-4 sm:h-6 z-[-1]" 
                      viewBox="0 0 100 20" 
                      preserveAspectRatio="none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1, delay: 0.8 }}
                    >
                      <defs>
                        <linearGradient id="heroGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" className="text-blue-600 dark:text-blue-500" stopColor="currentColor" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <motion.path 
                        d="M5 15 Q 50 0 95 15" 
                        stroke="url(#heroGradient2)" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ 
                          pathLength: { duration: 2.5, ease: "easeInOut" }
                        }}
                      />
                    </motion.svg>
                  </span>
                </>
              );
            })()}
          </motion.h1>

          {/* Elegant Antigravity-style Subtitle */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            transition={{ delay: 0.1 }}
            className="text-[17px] md:text-[20px] text-txt-muted max-w-4xl mb-12 leading-[1.6] font-light tracking-wide px-4"
          >
            {t('hero.subtitle1')} <br className="hidden sm:block" /> {t('hero.subtitle2')}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariant}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center"
          >
            {/* Premium Gradient Button with Creative Hover */}
            <Link href="/builder" className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full text-white font-medium text-[15px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 hover:shadow-xl overflow-hidden">
              {/* Shifting Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 ease-out z-0"></div>
              
              {/* Light Beam Sweep Effect */}
              <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700 ease-in-out z-0"></div>

              {/* Text and Icon */}
              <span className="relative z-10 drop-shadow-sm">{t('hero.cta_primary')}</span>
              <ArrowRightIcon className={`relative z-10 w-4 h-4 transition-transform duration-300 ease-in-out group-hover:${dir === 'rtl' ? '-translate-x-1.5' : 'translate-x-1.5'} rtl:rotate-180`} />
            </Link>
            {/* Creative Secondary Button */}
            <Link href="#features" className="group relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 text-txt font-medium text-[15px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 overflow-hidden">
              {/* Secondary Light Beam Sweep Effect */}
              <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-txt/5 to-transparent -skew-x-12 transition-all duration-700 ease-in-out z-0"></div>
              
              <span className="relative z-10">{t('hero.cta_secondary')}</span>
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
