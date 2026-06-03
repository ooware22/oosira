'use client';

import Link from 'next/link';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import Footer from '@/components/landing/Footer';

/**
 * Shared shell for legal / informational pages.
 * Provides nav + footer + centered content wrapper.
 */
export default function InfoPageShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-bg text-txt font-body flex flex-col">
      {/* ── Nav ── */}
      <nav className="relative z-50 px-6 lg:px-12 py-6 flex items-center justify-between bg-transparent border-b border-border/50">
        <Link href="/" className="flex flex-row items-end group select-none">
          <svg width="28" height="16" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 overflow-visible mb-0.5">
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path
              d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
              fill="none" stroke="url(#navGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <span className="text-[24px] font-display font-bold text-txt leading-none ml-1">sira</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageToggle />
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-txt text-bg font-semibold text-[13px] transition-all duration-200 hover:scale-105"
          >
            Connexion
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 px-6 lg:px-12 py-16 max-w-4xl mx-auto w-full">
        <h1 className="text-[32px] sm:text-[40px] font-display font-bold text-txt mb-10 leading-tight">
          {title}
        </h1>
        <div className="prose prose-sm max-w-none text-txt-muted leading-relaxed
          [&_h2]:text-[20px] [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-txt [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-txt [&_h3]:mt-6 [&_h3]:mb-3
          [&_p]:mb-4 [&_p]:text-[14px]
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-[14px]
          [&_li]:mb-1.5
          [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400
          [&_strong]:text-txt [&_strong]:font-semibold
        ">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
