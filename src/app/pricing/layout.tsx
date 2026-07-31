import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Découvrez les offres Oosira : gratuit ou Pro. Créez des CV professionnels avec tous les modèles inclus et des exports PDF illimités en Pro.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
