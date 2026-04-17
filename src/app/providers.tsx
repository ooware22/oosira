'use client';

import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/app/i18n/LanguageContext';
import { AuthProvider } from '@/app/auth/AuthContext';
import ReduxProvider from '@/store/Provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
