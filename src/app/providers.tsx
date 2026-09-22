'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/app/i18n/LanguageContext';
import { AuthProvider } from '@/app/auth/AuthContext';
import ReduxProvider from '@/store/Provider';
import { captureReferralFromUrl } from '@/app/lib/referralCode';

export function Providers({ children }: { children: React.ReactNode }) {
  // Referral links can point at any page, so the code is picked up globally.
  useEffect(() => { captureReferralFromUrl(); }, []);

  return (
    <ReduxProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
