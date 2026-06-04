import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modèles de CV',
  description: 'Explorez nos modèles de CV professionnels : Classique, Ingénieur, Exécutif, Médical et Tech. Conçus pour le marché algérien.',
};

export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
