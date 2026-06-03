import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe Oosira — support, partenariats et questions générales.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
