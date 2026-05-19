import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description: 'Gérez vos CV professionnels depuis votre tableau de bord Oosira. Modifiez, téléchargez et suivez les performances de vos CV.',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
