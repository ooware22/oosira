import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CV Algérie — Créer un CV Professionnel Gratuit en DZ | Oosira',
  description:
    'Créez votre CV gratuitement en Algérie avec Oosira. Le meilleur créateur de CV en ligne pour les algériens — modèles professionnels, export PDF, importation OCR. CV DZ gratuit et rapide.',
  keywords: [
    'CV Algérie', 'CV DZ', 'cv dz', 'créer CV Algérie', 'CV gratuit Algérie',
    'modèle CV Algérie', 'CV professionnel Algérie', 'faire un CV en Algérie',
    'meilleur site CV DZ', 'curriculum vitae Algérie', 'CV en ligne Algérie',
    'سيرة ذاتية الجزائر', 'إنشاء سيرة ذاتية مجانية', 'CV étudiant Algérie',
    'resume builder Algeria', 'CV maker DZ', 'free CV Algeria',
  ],
  openGraph: {
    title: 'CV Algérie — Créer un CV Professionnel Gratuit en DZ | Oosira',
    description:
      'Le créateur de CV n°1 en Algérie. Créez, personnalisez et téléchargez votre CV professionnel gratuitement. Modèles modernes adaptés au marché algérien.',
    locale: 'fr_DZ',
    type: 'website',
  },
  alternates: {
    canonical: 'https://oosira.com/cv-algerie',
  },
  other: {
    'geo.region': 'DZ',
    'geo.placename': 'Algeria',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'CV Algérie — Créateur de CV Gratuit en DZ',
  description: 'Créez votre CV professionnel gratuitement en Algérie avec Oosira.',
  url: 'https://oosira.com/cv-algerie',
  inLanguage: 'fr-DZ',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Oosira',
    url: 'https://oosira.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Curriculum Vitae',
    description: 'Création de CV professionnels en Algérie',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Algeria',
    alternateName: 'DZ',
  },
};

export default function CVAlgeriePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
        {/* ── Navigation ── */}
        <nav className="px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-end select-none group">
            <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-110 overflow-visible mb-1">
              <defs>
                <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path
                d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
                fill="none" stroke="url(#ig)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            <span className="text-[32px] font-bold leading-none ml-1">sira</span>
          </Link>
          <Link
            href="/builder"
            className="px-6 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:scale-105 transition-transform"
          >
            Créer mon CV →
          </Link>
        </nav>

        {/* ── Hero Section ── */}
        <header className="px-6 lg:px-16 py-16 lg:py-24 text-center max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Créez votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              CV Professionnel
            </span>{' '}
            gratuitement en Algérie
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Oosira est le <strong>créateur de CV n°1 en Algérie (DZ)</strong>. Concevez un CV moderne
            et professionnel en quelques minutes, adapté au marché algérien. Export PDF gratuit, sans inscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/builder"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-base hover:scale-105 transition-transform shadow-lg shadow-blue-500/25"
            >
              Créer mon CV gratuitement
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-semibold text-base hover:scale-105 transition-transform"
            >
              Découvrir Oosira
            </Link>
          </div>
        </header>

        {/* ── Why Oosira for Algeria ── */}
        <section className="px-6 lg:px-16 py-16 bg-gray-50 dark:bg-white/[0.02]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Pourquoi choisir Oosira pour créer votre CV en Algérie ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🇩🇿',
                  title: 'Adapté au marché algérien',
                  desc: 'Nos modèles de CV sont conçus pour répondre aux attentes des recruteurs en Algérie. Format français standard, mise en page professionnelle.',
                },
                {
                  icon: '⚡',
                  title: 'Rapide et gratuit',
                  desc: 'Créez votre CV en moins de 10 minutes. Aucune inscription requise, aucun frais caché. Exportez en PDF haute qualité immédiatement.',
                },
                {
                  icon: '🎨',
                  title: 'Modèles modernes',
                  desc: 'Choisissez parmi 5+ modèles élégants et professionnels : Classique, Tech, Médical, Ingénieur et plus encore.',
                },
                {
                  icon: '📄',
                  title: 'Import OCR intelligent',
                  desc: 'Vous avez déjà un CV ? Importez-le en un clic et Oosira le convertit automatiquement grâce à l\'OCR intelligent.',
                },
                {
                  icon: '🌐',
                  title: 'Multilingue (FR / AR / EN)',
                  desc: 'Interface disponible en français, arabe et anglais. Parfait pour les candidatures en Algérie et à l\'international.',
                },
                {
                  icon: '📱',
                  title: 'Accessible partout',
                  desc: 'Créez et modifiez votre CV depuis votre ordinateur, tablette ou téléphone. 100% en ligne, aucune installation nécessaire.',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:shadow-lg transition-shadow"
                >
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section (keyword-rich, matching structured data) ── */}
        <section className="px-6 lg:px-16 py-16 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Questions fréquentes sur la création de CV en Algérie
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Comment créer un CV gratuitement en Algérie ?',
                a: 'Avec Oosira, créez votre CV professionnel gratuitement en quelques minutes. Rendez-vous sur la page de création, choisissez un modèle parmi nos designs modernes, remplissez vos informations personnelles, expériences et compétences, puis exportez votre CV en PDF haute qualité. Aucune inscription obligatoire.',
              },
              {
                q: 'Quel est le meilleur site pour faire un CV en DZ ?',
                a: 'Oosira est considéré comme le meilleur créateur de CV en Algérie (DZ). Il offre des modèles professionnels adaptés au marché algérien, l\'export PDF gratuit, une interface en français et arabe, ainsi qu\'une fonctionnalité d\'importation OCR pour convertir vos anciens CV.',
              },
              {
                q: 'Est-ce que Oosira est vraiment gratuit ?',
                a: 'Oui, Oosira est 100% gratuit. Vous pouvez créer autant de CV que vous souhaitez, les personnaliser avec nos modèles professionnels, et télécharger votre CV en PDF sans aucun frais. Il n\'y a aucune limitation cachée.',
              },
              {
                q: 'Quels modèles de CV sont disponibles ?',
                a: 'Oosira propose plus de 5 modèles de CV professionnels : CV Classique (idéal pour les candidatures traditionnelles), CV Tech (parfait pour les développeurs et IT), CV Médical (adapté aux professions de santé), CV Ingénieur (pour les profils techniques). Tous les modèles sont personnalisables en couleurs et mise en page.',
              },
              {
                q: 'هل يمكنني إنشاء سيرة ذاتية مجانية في الجزائر؟',
                a: 'نعم، أوصيرا هو أفضل موقع لإنشاء سيرة ذاتية مجانية في الجزائر. يقدم قوالب احترافية متعددة، تصدير PDF مجاني، وواجهة بالفرنسية والعربية والإنجليزية. لا تحتاج إلى تسجيل أو دفع أي رسوم.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 cursor-pointer"
              >
                <summary className="font-semibold text-lg list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl">+</span>
                </summary>
                <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── SEO Content Section ── */}
        <section className="px-6 lg:px-16 py-16 bg-gray-50 dark:bg-white/[0.02]">
          <div className="max-w-4xl mx-auto prose dark:prose-invert">
            <h2>Créer un CV en Algérie avec Oosira</h2>
            <p>
              <strong>Oosira</strong> est la plateforme de création de CV la plus populaire en <strong>Algérie (DZ)</strong>.
              Que vous soyez un étudiant à la recherche d&apos;un stage, un jeune diplômé en quête de votre premier emploi,
              ou un professionnel expérimenté souhaitant mettre à jour votre curriculum vitae, Oosira vous accompagne
              dans la création d&apos;un <strong>CV professionnel gratuit</strong>.
            </p>
            <h3>Le créateur de CV n°1 en DZ</h3>
            <p>
              Notre outil est spécialement conçu pour le marché algérien. Les modèles de CV respectent les standards
              de mise en page attendus par les recruteurs en Algérie : photo professionnelle, format chronologique inversé,
              sections claires pour les expériences, la formation et les compétences. L&apos;interface est disponible
              en <strong>français</strong>, <strong>arabe</strong> et <strong>anglais</strong>.
            </p>
            <h3>Comment faire un CV en Algérie ?</h3>
            <ol>
              <li>Rendez-vous sur <strong>oosira.com</strong> et cliquez sur &quot;Créer mon CV&quot;</li>
              <li>Choisissez parmi nos modèles professionnels (Classique, Tech, Médical, Ingénieur...)</li>
              <li>Remplissez vos informations : état civil, expériences, formation, compétences</li>
              <li>Personnalisez les couleurs et la mise en page selon vos préférences</li>
              <li>Exportez votre CV en PDF haute qualité — c&apos;est 100% gratuit !</li>
            </ol>
            <h3>CV gratuit et sans inscription en Algérie</h3>
            <p>
              Contrairement à d&apos;autres sites de création de CV, Oosira ne vous demande aucune inscription obligatoire
              et ne cache aucun frais. Votre <strong>CV DZ</strong> est créé, personnalisé et exporté en PDF
              entièrement gratuitement. Nous croyons que chaque algérien mérite un CV professionnel de qualité.
            </p>
          </div>
        </section>

        {/* ── CTA Footer ── */}
        <section className="px-6 lg:px-16 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à créer votre CV ?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d&apos;algériens qui ont déjà créé leur CV professionnel avec Oosira.
            C&apos;est gratuit, rapide et sans inscription.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-blue-500/25"
          >
            Créer mon CV maintenant →
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="px-6 lg:px-16 py-8 border-t border-gray-200 dark:border-white/10 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Oosira — Le créateur de CV gratuit n°1 en Algérie 🇩🇿</p>
          <p className="mt-2">
            <Link href="/" className="hover:underline">Accueil</Link>
            {' · '}
            <Link href="/builder" className="hover:underline">Créer un CV</Link>
            {' · '}
            <Link href="/cv-algerie" className="hover:underline">CV Algérie</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
