import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Découvrez Oosira — la plateforme algérienne de création de CV professionnels. Notre mission, notre vision et notre équipe.',
};

export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return children;
}
