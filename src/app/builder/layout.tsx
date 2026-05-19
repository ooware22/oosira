import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer mon CV — Éditeur en ligne gratuit',
  description: 'Utilisez l\'éditeur de CV Oosira pour construire votre CV professionnel étape par étape. Choisissez un modèle, personnalisez-le et exportez en PDF haute qualité.',
  openGraph: {
    title: 'Créer mon CV — Éditeur Oosira',
    description: 'Construisez un CV professionnel en quelques minutes avec l\'éditeur en ligne Oosira. Prévisualisation en temps réel et export PDF gratuit.',
  },
  alternates: {
    canonical: 'https://oosira.com/builder',
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
