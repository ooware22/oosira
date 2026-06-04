'use client';

import Link from 'next/link';
import InfoPageShell from '@/components/InfoPageShell';
import TemplateThumbnail from '@/components/TemplateThumbnail';

const TEMPLATES = [
  {
    id: 1,
    name: 'Classique Pro',
    desc: 'Design traditionnel et élégant. Idéal pour les postes dans la fonction publique, la banque et les grandes entreprises.',
    tags: ['Administration', 'Banque', 'RH'],
    palette: { primary: '#1B3A6B', accent: '#2563EB', headerBg: '#1B3A6B' },
  },
  {
    id: 2,
    name: 'Ingénieur',
    desc: 'Structuré et technique. Parfait pour les ingénieurs d\'État, les profils techniques et les candidatures Sonatrach/Cosider.',
    tags: ['Technique', 'Ingénierie', 'Industrie'],
    palette: { primary: '#2C3E50', accent: '#2563EB', headerBg: '#2C3E50' },
  },
  {
    id: 3,
    name: 'Exécutif',
    desc: 'Sidebar moderne avec un design premium. Pour les cadres, managers et profils de direction.',
    tags: ['Management', 'Direction', 'Cadre'],
    palette: { primary: '#1e293b', accent: '#3b82f6', headerBg: '#1e293b' },
  },
  {
    id: 4,
    name: 'Médical',
    desc: 'Centré et aéré. Conçu pour les professionnels de santé : médecins, pharmaciens, paramédicaux.',
    tags: ['Santé', 'Médecine', 'Pharmacie'],
    palette: { primary: '#2563EB', accent: '#60A5FA', headerBg: '#ffffff' },
  },
  {
    id: 5,
    name: 'Tech & IT',
    desc: 'Inspiré de GitHub. Pour les développeurs, designers UI/UX et profils tech/startup.',
    tags: ['Développeur', 'IT', 'Startup'],
    palette: { primary: '#0D1117', accent: '#58A6FF', headerBg: '#161B22' },
  },
];

export default function ModelesPage() {
  return (
    <InfoPageShell title="Nos modèles de CV">
      <p className="!text-[16px] !text-txt-muted !mb-10">
        Choisissez parmi 5 modèles professionnels conçus pour le marché algérien.
        Chaque modèle est entièrement personnalisable : couleurs, polices, mise en page.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 not-prose !mb-12">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="group relative bg-surface border border-border/50 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
          >
            {/* Thumbnail preview */}
            <div className="aspect-[3/4] relative overflow-hidden bg-surface2">
              <div className="absolute inset-3 rounded-lg overflow-hidden shadow-sm border border-border/30">
                <TemplateThumbnail
                  templateId={tpl.id}
                  primary={tpl.palette.primary}
                  accent={tpl.palette.accent}
                  headerBg={tpl.palette.headerBg}
                />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <Link
                  href="/builder"
                  className="w-full py-2.5 rounded-xl bg-white text-[#002147] font-semibold text-[13px] text-center hover:bg-blue-50 transition-colors"
                >
                  Utiliser ce modèle →
                </Link>
              </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <h3 className="text-[15px] font-bold text-txt mb-1.5">{tpl.name}</h3>
              <p className="text-[12px] text-txt-muted leading-relaxed mb-3">{tpl.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center not-prose">
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-[14px] hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
        >
          Commencer gratuitement →
        </Link>
      </div>
    </InfoPageShell>
  );
}
