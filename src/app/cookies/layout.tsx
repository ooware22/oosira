import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique cookies',
  description: 'Politique d\'utilisation des cookies sur la plateforme Oosira.',
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
