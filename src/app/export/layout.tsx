import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exporter mon CV',
  description: 'Exportez votre CV professionnel en PDF haute qualité, prêt à imprimer au format A4.',
  robots: { index: false, follow: false },
};

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
