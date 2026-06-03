'use client';

import InfoPageShell from '@/components/InfoPageShell';

export default function AProposPage() {
  return (
    <InfoPageShell title="À propos d'Oosira">
      <p className="!text-[16px] !leading-relaxed !text-txt-muted !mb-10">
        Oosira est une plateforme algérienne de création de CV professionnels, conçue pour démocratiser
        l&apos;accès à des outils de candidature de qualité pour tous les Algériens.
      </p>

      {/* ── Mission ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 !mb-12 not-prose">
        {[
          {
            icon: (
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            ),
            title: 'Notre mission',
            text: 'Permettre à chaque candidat algérien de créer un CV professionnel et moderne, gratuitement et sans compétences techniques.',
          },
          {
            icon: (
              <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            title: 'Notre vision',
            text: 'Devenir la référence incontournable pour la création de CV en Algérie et au Maghreb, en offrant une expérience premium et accessible.',
          },
          {
            icon: (
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            ),
            title: 'Nos valeurs',
            text: 'Simplicité, accessibilité et excellence. Nous croyons que tout le monde mérite un CV à la hauteur de ses ambitions.',
          },
        ].map((item) => (
          <div key={item.title} className="p-6 rounded-2xl bg-surface border border-border/50 hover:border-border transition-colors">
            <div className="w-12 h-12 rounded-xl bg-surface2 flex items-center justify-center mb-4">
              {item.icon}
            </div>
            <h3 className="text-[15px] font-semibold text-txt mb-2">{item.title}</h3>
            <p className="text-[13px] text-txt-muted leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <h2>Pourquoi Oosira ?</h2>
      <p>
        Le nom <strong>« Oosira »</strong> est inspiré du mot arabe <strong>« عصيرة »</strong> (essence, quintessence).
        Il reflète notre ambition : aider chaque personne à exprimer la quintessence de son parcours professionnel
        à travers un CV clair, élégant et percutant.
      </p>

      <h2>Ce qui nous différencie</h2>
      <ul>
        <li><strong>100% gratuit</strong> — Pas de version bridée, pas de filigrane.</li>
        <li><strong>Conçu pour le marché algérien</strong> — Support bilingue FR/AR, adapté aux conventions locales.</li>
        <li><strong>Export PDF haute qualité</strong> — Compatible ATS, prêt pour l&apos;impression.</li>
        <li><strong>Respect de la vie privée</strong> — Vos données restent les vôtres, conformément à la loi 18-07.</li>
        <li><strong>Open-source dans l&apos;esprit</strong> — Transparence et amélioration continue grâce aux retours utilisateurs.</li>
      </ul>

      <h2>Notre équipe</h2>
      <p>
        Oosira est développé par une équipe passionnée de développeurs et designers algériens, déterminés
        à créer des outils numériques de qualité pour le marché local. Nous croyons fermement que le talent
        algérien mérite des outils à la hauteur de ses ambitions.
      </p>

      <h2>Nous contacter</h2>
      <p>
        Vous avez une question, une suggestion ou souhaitez collaborer avec nous ?
        Rendez-vous sur notre <a href="/contact">page de contact</a> ou écrivez-nous directement
        à <a href="mailto:contact@oosira.com">contact@oosira.com</a>.
      </p>
    </InfoPageShell>
  );
}
