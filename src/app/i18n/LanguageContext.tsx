'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Language } from './dictionaries';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
  dir: 'rtl' | 'ltr';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// `t()` is called on every render, including inside .map() over free-text
// fields (e.g. `builder.level_${niveau}` for an OCR-imported or hand-typed
// language level). A missing key there used to console.warn on every single
// render, which under a long editing session eventually OOM'd the dev
// server's Node heap. Warn once per key instead.
const warnedKeys = new Set<string>();
function warnOnce(keyPath: string, language: string) {
  const cacheKey = `${language}:${keyPath}`;
  if (warnedKeys.has(cacheKey)) return;
  warnedKeys.add(cacheKey);
  console.warn(`Translation missing for key: ${keyPath} in language: ${language}`);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr'); // Default french

  // Load language from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('sira-language') as Language;
    if (saved && dictionaries[saved]) {
      setLanguage(saved);
    }
  }, []);

  // Sync RTL and lang attributes
  useEffect(() => {
    localStorage.setItem('sira-language', language);
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (keyPath: string) => {
    const keys = keyPath.split('.');
    let current: any = dictionaries[language];
    for (const key of keys) {
      if (current === null || typeof current !== 'object' || current[key] === undefined) {
        warnOnce(keyPath, language);
        return keyPath;
      }
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
