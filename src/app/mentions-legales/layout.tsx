import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales d\'Oosira — informations sur l\'éditeur et l\'hébergeur de la plateforme.',
};

export default function MentionsLegalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
