import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

const SITE_URL = 'https://oosira.com';
const SITE_NAME = 'Oosira';
const SITE_DESCRIPTION = 'Créez votre CV professionnel en Algérie gratuitement avec Oosira. Le meilleur créateur de CV en ligne pour les algériens, modèles élégants, export PDF haute qualité, importation OCR et prévisualisation en temps réel. CV DZ gratuit et sans inscription.';

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
    default: 'Oosira, Créateur de CV Gratuit en Algérie, CV DZ Professionnel',
    template: '%s, Oosira CV Algérie',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    // ── Primary keywords (high search volume) ──
    'CV', 'CV DZ', 'cv dz', 'CV Algérie', 'cv algérie', 'CV en Algérie',
    'créer CV', 'créer CV Algérie', 'créateur de CV', 'créer un CV',
    'faire un CV', 'faire CV en ligne', 'CV en ligne',
    'CV professionnel', 'CV gratuit', 'CV gratuit Algérie',
    // ── Secondary keywords ──
    'modèle CV', 'modèle CV Algérie', 'modèle de CV gratuit',
    'curriculum vitae', 'curriculum vitae Algérie',
    'générateur de CV', 'générateur de CV gratuit',
    'CV PDF', 'export PDF CV', 'télécharger CV PDF',
    // ── English keywords ──
    'resume builder', 'resume builder Algeria', 'CV maker', 'CV maker DZ',
    'CV builder free', 'free resume builder Algeria', 'CV designer',
    'CV template', 'build resume free', 'online CV maker',
    // ── Arabic keywords ──
    'سيرة ذاتية', 'سيرة ذاتية الجزائر', 'إنشاء سيرة ذاتية',
    'نموذج سيرة ذاتية', 'سيرة ذاتية مجانية',
    // ── Long-tail keywords ──
    'comment faire un CV en Algérie', 'meilleur site CV Algérie',
    'créer CV professionnel gratuit', 'CV ATS', 'Oosira',
    'site de CV algérien', 'CV designer Algérie', 'CV moderne Algérie',
    'CV étudiant Algérie', 'CV stage Algérie',
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
    title: 'Oosira, Créateur de CV Professionnel Gratuit en Algérie, CV DZ',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Oosira Créez votre CV professionnel en quelques minutes',
        type: 'image/png',
      },
    ],
  },

  // ─── Twitter Card ─────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'Oosira, Créateur de CV Gratuit en Algérie, CV DZ',
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
    // ─── Geo-Targeting for Algeria ──────────────────────
    'geo.region': 'DZ',
    'geo.placename': 'Algeria',
    'geo.position': '36.7538;3.0588',
    'ICBM': '36.7538, 3.0588',
    'content-language': 'fr-DZ',
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
  inLanguage: ['fr-DZ', 'ar-DZ', 'en'],
  availableLanguage: [
    { '@type': 'Language', name: 'French', alternateName: 'fr' },
    { '@type': 'Language', name: 'Arabic', alternateName: 'ar' },
    { '@type': 'Language', name: 'English', alternateName: 'en' },
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Algeria',
    alternateName: 'DZ',
    sameAs: 'https://en.wikipedia.org/wiki/Algeria',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'DZD',
    availability: 'https://schema.org/InStock',
    areaServed: {
      '@type': 'Country',
      name: 'Algeria',
    },
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
  keywords: 'CV DZ, CV Algérie, créateur CV, CV gratuit Algérie, سيرة ذاتية الجزائر',
};

// ─── FAQ Structured Data for Rich Snippets ──────────────
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment créer un CV gratuitement en Algérie ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Avec Oosira, créez votre CV professionnel gratuitement en quelques minutes. Choisissez parmi nos modèles élégants, remplissez vos informations et exportez en PDF haute qualité. Aucune inscription requise.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le meilleur site pour faire un CV en DZ ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oosira est le meilleur créateur de CV en Algérie (DZ). Il offre des modèles professionnels, l\'export PDF gratuit, et une interface en français et arabe adaptée aux standards algériens.',
      },
    },
    {
      '@type': 'Question',
      name: 'Est-ce que Oosira est gratuit ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, Oosira est 100% gratuit. Vous pouvez créer, personnaliser et télécharger votre CV en PDF sans aucun frais ni inscription obligatoire.',
      },
    },
    {
      '@type': 'Question',
      name: 'هل يمكنني إنشاء سيرة ذاتية مجانية في الجزائر؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'نعم، أوصيرا هو أفضل موقع لإنشاء سيرة ذاتية مجانية في الجزائر. يقدم قوالب احترافية وتصدير PDF مجاني بالفرنسية والعربية.',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
