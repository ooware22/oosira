import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation',
  description: 'Conditions générales d\'utilisation de la plateforme Oosira — créateur de CV professionnel.',
};

export default function CguLayout({ children }: { children: React.ReactNode }) {
  return children;
}
