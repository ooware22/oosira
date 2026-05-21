import type { Metadata } from 'next';
import '../cv-templates.css';

export const metadata: Metadata = {
  title: 'Créer mon CV en Algérie — Éditeur de CV Gratuit en Ligne | Oosira',
  description: 'Utilisez l\'éditeur de CV Oosira pour créer votre CV professionnel en Algérie. Choisissez un modèle, personnalisez-le et exportez en PDF haute qualité. CV DZ gratuit et sans inscription.',
  keywords: [
    'créer CV', 'créer CV Algérie', 'éditeur CV gratuit', 'CV DZ',
    'CV en ligne Algérie', 'faire un CV', 'CV professionnel Algérie',
    'modèle CV gratuit', 'export PDF CV', 'Oosira builder',
  ],
  openGraph: {
    title: 'Créer mon CV en Algérie — Éditeur Oosira Gratuit',
    description: 'Construisez un CV professionnel en quelques minutes avec l\'éditeur en ligne Oosira. Le meilleur outil de création de CV en Algérie (DZ). Export PDF gratuit.',
  },
  alternates: {
    canonical: 'https://oosira.com/builder',
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
