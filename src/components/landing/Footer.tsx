'use client';

import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';

const footerSections = [
  {
    titleFr: 'Produit',
    titleAr: 'المنتج',
    links: [
      { labelFr: 'Créateur de CV', labelAr: 'صانع السيرة الذاتية', href: '/builder' },
      { labelFr: 'Modèles', labelAr: 'القوالب', href: '/modeles' },
      { labelFr: 'Tarifs', labelAr: 'الأسعار', href: '/pricing' },
    ],
  },
  {
    titleFr: 'Entreprise',
    titleAr: 'الشركة',
    links: [
      { labelFr: 'À propos', labelAr: 'من نحن', href: '/a-propos' },
      { labelFr: 'Contact', labelAr: 'اتصل بنا', href: '/contact' },
    ],
  },
  {
    titleFr: 'Légal',
    titleAr: 'قانوني',
    links: [
      { labelFr: 'Confidentialité', labelAr: 'الخصوصية', href: '/confidentialite' },
      { labelFr: 'CGU', labelAr: 'شروط الاستخدام', href: '/cgu' },
      { labelFr: 'Mentions légales', labelAr: 'الإشعارات القانونية', href: '/mentions-legales' },
      { labelFr: 'Cookies', labelAr: 'الكوكيز', href: '/cookies' },
    ],
  },
  {
    titleFr: 'Aide',
    titleAr: 'مساعدة',
    links: [
      { labelFr: 'FAQ', labelAr: 'الأسئلة الشائعة', href: '#faq' },
      { labelFr: 'Sécurité', labelAr: 'الأمان', href: '/.well-known/security.txt' },
    ],
  },
];

export default function Footer() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <footer className="relative z-20 border-t border-border bg-surface/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
        {/* ── Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {footerSections.map((section) => (
            <div key={section.titleFr}>
              <h3 className="text-[13px] font-semibold text-txt uppercase tracking-wider mb-4">
                {isAr ? section.titleAr : section.titleFr}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-txt-muted hover:text-txt transition-colors duration-200"
                    >
                      {isAr ? link.labelAr : link.labelFr}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Testimonials ── */}
        <div className="border-t border-border pt-10 mb-10">
          <h3 className="text-[13px] font-semibold text-txt uppercase tracking-wider mb-6 text-center">
            {isAr ? 'ماذا يقول مستخدمونا' : 'Ce que disent nos utilisateurs'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                nameFr: 'Amina B.',
                nameAr: 'أمينة ب.',
                roleFr: 'Ingénieure informatique, Alger',
                roleAr: 'مهندسة معلوماتية، الجزائر',
                textFr: "Oosira m'a permis de créer un CV professionnel en 10 minutes. L'export PDF est impeccable et j'ai décroché mon entretien le lendemain.",
                textAr: 'أوسيرة ساعدتني في إنشاء سيرة ذاتية احترافية في 10 دقائق. التصدير بصيغة PDF ممتاز وحصلت على مقابلة في اليوم التالي.',
              },
              {
                nameFr: 'Karim M.',
                nameAr: 'كريم م.',
                roleFr: 'Diplômé en marketing, Oran',
                roleAr: 'خريج تسويق، وهران',
                textFr: "Simple, rapide et beau. Les modèles sont modernes et adaptés au marché algérien. Je recommande vivement !",
                textAr: 'بسيط، سريع وجميل. القوالب عصرية ومناسبة للسوق الجزائري. أنصح به بشدة!',
              },
              {
                nameFr: 'Sarah T.',
                nameAr: 'سارة ت.',
                roleFr: 'Chargée RH, Constantine',
                roleAr: 'مسؤولة موارد بشرية، قسنطينة',
                textFr: "En tant que recruteuse, je vois la différence quand un candidat utilise Oosira. CV clair, structuré et professionnel.",
                textAr: 'بصفتي مسؤولة توظيف، ألاحظ الفرق عندما يستخدم المرشح أوسيرة. سيرة ذاتية واضحة ومنظمة واحترافية.',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.nameFr}
                className="relative p-6 rounded-2xl bg-surface border border-border/50 hover:border-border transition-colors duration-300"
              >
                <svg className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-6 h-6 text-blue-500/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983z" />
                </svg>
                <p className="text-[13px] text-txt-muted leading-relaxed mb-4 italic">
                  &ldquo;{isAr ? testimonial.textAr : testimonial.textFr}&rdquo;
                </p>
                <div>
                  <p className="text-[13px] font-semibold text-txt">{isAr ? testimonial.nameAr : testimonial.nameFr}</p>
                  <p className="text-[11px] text-txt-dim">{isAr ? testimonial.roleAr : testimonial.roleFr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="24" height="14" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500">
              <defs>
                <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path
                d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
                fill="none" stroke="url(#footerGrad)" strokeWidth="2.2" strokeLinecap="round"
              />
            </svg>
            <span className="text-[12px] text-txt-dim">
              © {new Date().getFullYear()} Oosira. {isAr ? 'جميع الحقوق محفوظة.' : 'Tous droits réservés.'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
