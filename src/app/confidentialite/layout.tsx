import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité d\'Oosira — traitement des données personnelles conformément à la loi 18-07 et l\'ANPDP.',
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
