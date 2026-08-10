import type { Metadata } from 'next';
// The CV preview overlay in "Mes candidatures" renders real templates, which
// need the same stylesheet the builder and export routes load.
import '../cv-templates.css';
// Likewise the send wizard previews the cover letter with the same layout the
// exported PDF uses, so it needs the letter stylesheet too.
import '../letter-document.css';

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description: 'Gérez vos CV professionnels depuis votre tableau de bord Oosira. Modifiez, téléchargez et suivez les performances de vos CV.',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
