import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Inscrivez-vous gratuitement sur Oosira pour sauvegarder vos CV, importer un CV par IA et gérer votre parcours professionnel.',
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
