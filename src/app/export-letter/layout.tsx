import type { Metadata } from 'next';
import './export-letter.css';

export const metadata: Metadata = {
  title: 'Exporter ma lettre de motivation',
  robots: { index: false, follow: false },
};

export default function ExportLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
