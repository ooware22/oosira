'use client';

import { useTheme } from 'next-themes';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { Language } from '@/app/i18n/dictionaries';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-txt-muted hover:text-txt dark:hover:text-white transition-colors"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const langs: {code: Language, label: string}[] = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-txt-muted hover:text-txt dark:hover:text-white transition-colors font-medium text-sm uppercase"
      >
        <GlobeAltIcon className="w-5 h-5" />
        {language}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 py-1 w-24 bg-surface border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-50">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${language === l.code ? 'text-primary font-bold' : 'text-txt'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
