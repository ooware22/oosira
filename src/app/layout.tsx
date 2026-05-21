import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

const SITE_URL = 'https://oosira.com';
const SITE_NAME = 'Oosira';
const SITE_DESCRIPTION = 'Créez votre CV professionnel en quelques minutes avec Oosira. Prévisualisation en temps réel, export PDF haute qualité, 5+ modèles élégants et importation OCR intelligente. Gratuit et sans inscription.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ─── Core ─────────────────────────────────────────────
  title: {
    default: 'Oosira — Créateur de CV Professionnel Gratuit | Algérie',
    template: '%s | Oosira',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'CV', 'curriculum vitae', 'créateur de CV', 'générateur de CV',
    'CV professionnel', 'CV gratuit', 'modèle CV', 'CV Algérie',
    'resume builder', 'PDF CV', 'CV en ligne', 'Oosira',
    'سيرة ذاتية', 'CV maker', 'CV designer', 'export PDF',
    'CV ATS', 'CV template', 'build resume free',
  ],
  authors: [{ name: 'Oosira', url: SITE_URL }],
  creator: 'Oosira',
  publisher: 'Oosira',
  applicationName: 'Oosira',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  category: 'productivity',

  // ─── Icons ────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // ─── Open Graph ───────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'fr_DZ',
    alternateLocale: ['en_US', 'ar_DZ'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Oosira — Créateur de CV Professionnel Gratuit',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Oosira — Créez votre CV professionnel en quelques minutes',
        type: 'image/png',
      },
    ],
  },

  // ─── Twitter Card ─────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Oosira — Créateur de CV Professionnel Gratuit',
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@oosira',
  },

  // ─── Robots ───────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ─── Alternates ───────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
    languages: {
      'fr-DZ': SITE_URL,
      'en': SITE_URL,
      'ar-DZ': SITE_URL,
    },
  },

  // ─── Verification ───────────────────────────────────────
  verification: {
    google: 'google5de3f8e949469cbc',
  },

  // ─── Other Meta Tags ─────────────────────────────────
  other: {
    'google': 'notranslate',
    'format-detection': 'telephone=no',
  },
};

import { Providers } from './providers';

// ─── JSON-LD Structured Data ────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'DZD',
  },
  author: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1200',
    bestRating: '5',
    worstRating: '1',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${cairo.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
