import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Découvrez les offres Oosira : gratuit ou Pro. Créez des CV professionnels avec des modèles premium et des exports PDF illimités.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
