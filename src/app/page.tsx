import dynamic from 'next/dynamic';

// Lazy-load the interactive client component.
// The server renders a lightweight HTML shell instantly (improving FCP/LCP),
// while the JS for animations and interactivity loads in the background.
const LandingContent = dynamic(
  () => import('@/components/landing/LandingContent'),
  {
    loading: () => (
      <div className="min-h-screen bg-bg text-txt font-body flex flex-col">
        {/* ── Static nav shell (matches client layout to prevent CLS) ── */}
        <nav className="relative z-50 px-6 lg:px-12 py-6 flex items-center justify-between bg-transparent">
          <div className="flex items-center shrink-0 sm:w-1/3">
            <div className="flex flex-row items-end select-none">
              <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 overflow-visible mb-1">
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
              <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">sira</span>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center w-1/3 gap-6 text-[13px] font-medium text-txt-muted">
            <span>Produit</span><span>Cas d&apos;usage</span><span>Tarifs</span><span>Ressources</span>
          </div>
          <div className="flex gap-1.5 sm:gap-4 items-center justify-end sm:w-1/3">
            <div className="w-8 h-8" />
            <div className="w-16 h-8" />
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-txt text-bg font-semibold text-[13px]">Connexion</span>
          </div>
        </nav>
        {/* ── Static hero shell ── */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20">
          <section className="w-full max-w-full flex flex-col items-center text-center">
            <h1 className="font-display text-[45px] sm:text-[60px] lg:text-[75px] font-bold text-txt leading-[1.1] mb-12 w-full max-w-none px-4 tracking-tight">
              Façonnez votre carrière <br />
              avec une Précision{' '}
              <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 pb-1 pr-2">Absolue!</span>
            </h1>
            <p className="text-[17px] md:text-[20px] text-txt-muted max-w-4xl mb-12 leading-[1.6] font-light tracking-wide px-4">
              Créez un CV magnifique et professionnel en seulement quelques minutes.
              <br className="hidden sm:block" /> Profitez d&apos;une expérience simple et épurée qui vous aide à vous concentrer sur l&apos;essentiel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
              <span className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full text-white font-medium text-[15px] shadow-lg shadow-blue-500/25 overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 z-0"></span>
                <span className="relative z-10 drop-shadow-sm">Créer gratuitement</span>
              </span>
              <span className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-black/5 dark:bg-white/5 text-txt font-medium text-[15px]">
                Découvrir
              </span>
            </div>
          </section>
        </main>
      </div>
    ),
  }
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-txt overflow-hidden selection:bg-txt selection:text-bg font-body flex flex-col relative z-0">
      <LandingContent />
    </div>
  );
}
