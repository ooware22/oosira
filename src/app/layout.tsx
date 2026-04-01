import type { Metadata } from 'next';
import { Inter, Kalam, Pacifico } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const kalam = Kalam({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-kalam', display: 'swap' });
const pacifico = Pacifico({ weight: ['400'], subsets: ['latin'], variable: '--font-pacifico', display: 'swap' });

export const metadata: Metadata = {
  title: 'Sira - CV Generator',
  description:
    'Générateur de CV professionnel avec prévisualisation en temps réel et export PDF. 5 modèles élégants pour les professionnels.',
  icons: {
    icon: '/favicon.png',
  },
};

import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${kalam.variable} ${pacifico.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
