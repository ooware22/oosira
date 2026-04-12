'use client';

import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/app/i18n/LanguageContext';
import { AuthProvider } from '@/app/auth/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
