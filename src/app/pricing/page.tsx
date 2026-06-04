'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import InfoPageShell from '@/components/InfoPageShell';
import {
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

const TRANSLATIONS: Record<string, any> = {
  fr: {
    subtitle: "Débloquez les outils professionnels et des modèles illimités pour propulser votre carrière.",
    free: 'Gratuit', pro: 'Pro',
    month: '/ mois', popular: 'Plus Populaire',
    subscribe: "S'abonner", basic: 'Commencer',
    processing: 'Traitement...',
    faq: 'Questions fréquentes',
  },
  en: {
    subtitle: "Unlock professional tools and unlimited templates to boost your career.",
    free: 'Free', pro: 'Pro',
    month: '/ month', popular: 'Most Popular',
    subscribe: 'Subscribe', basic: 'Get Started',
    processing: 'Processing...',
    faq: 'FAQ',
  },
  ar: {
    subtitle: "افتح الأدوات الاحترافية وقوالب غير محدودة لتطوير مسيرتك المهنية.",
    free: 'مجاني', pro: 'برو',
    month: '/ شهرياً', popular: 'الأكثر شيوعاً',
    subscribe: 'اشترك الآن', basic: 'ابدأ مجاناً',
    processing: 'جاري المعالجة...',
    faq: 'الأسئلة الشائعة',
  },
};

const FALLBACK_PLANS = [
  {
    code: 'free', price_da: 0, is_popular: false, icon_type: 'document',
    name_en: 'Basic', name_fr: 'Basique', name_ar: 'أساسي',
    desc_en: 'Perfect for starting your job search.',
    desc_fr: "Parfait pour commencer votre recherche d'emploi.",
    desc_ar: 'مثالي لبدء البحث عن عمل.',
    features: [
      { text_en: 'Build professional CVs', text_fr: 'Créer des CV professionnels', text_ar: 'بناء سير ذاتية احترافية', is_included: true },
      { text_en: '5 PDF downloads per month', text_fr: '5 téléchargements PDF par mois', text_ar: '5 تنزيلات PDF شهرياً', is_included: true },
      { text_en: 'Access to standard templates', text_fr: 'Accès aux modèles standards', text_ar: 'الوصول إلى القوالب القياسية', is_included: true },
      { text_en: '1 free trial OCR import', text_fr: "1 essai gratuit d'importation OCR", text_ar: 'تجربة واحدة مجانية لاستيراد OCR', is_included: true },
      { text_en: 'Limited color palettes', text_fr: 'Palettes de couleurs limitées', text_ar: 'لوحات ألوان محدودة', is_included: false },
    ],
  },
  {
    code: 'pro', price_da: 350, is_popular: true, icon_type: 'sparkles',
    name_en: 'Pro', name_fr: 'Pro', name_ar: 'برو',
    desc_en: 'Everything you need to stand out.',
    desc_fr: 'Tout ce dont vous avez besoin pour vous démarquer.',
    desc_ar: 'كل ما تحتاجه للتميز.',
    billed_text_en: 'Billed 4800 DA yearly',
    billed_text_fr: 'Facturé 4800 DA par an',
    billed_text_ar: 'يتم فوترتها 4800 دج سنويا',
    features: [
      { text_en: 'Unlimited PDF downloads', text_fr: 'Téléchargements PDF illimités', text_ar: 'تنزيلات PDF غير محدودة', is_included: true },
      { text_en: 'AI-powered OCR Resume Import', text_fr: "Importation CV par IA (OCR)", text_ar: 'استيراد السيرة بالذكاء الاصطناعي', is_included: true },
      { text_en: 'All premium templates', text_fr: 'Tous les modèles premium', text_ar: 'جميع القوالب المميزة', is_included: true },
      { text_en: 'Advanced color palettes', text_fr: 'Palettes de couleurs avancées', text_ar: 'لوحات ألوان متقدمة', is_included: true },
      { text_en: 'Priority support', text_fr: 'Support prioritaire', text_ar: 'دعم ذو أولوية', is_included: true },
    ],
  },
];

export default function PricingPage() {
  const { language } = useLanguage();
  const tr = TRANSLATIONS[language] || TRANSLATIONS.fr;
  const [plans, setPlans] = useState<any[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const getField = (obj: any, base: string) =>
    obj?.[`${base}_${language}`] || obj?.[`${base}_fr`] || obj?.[`${base}_en`] || '';

  useEffect(() => {
    async function fetchPlans() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API}/subscriptions/plans/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            setPlans(data);
          }
        }
      } catch { /* use fallback */ }
    }
    fetchPlans();
  }, []);

  const handleUpgrade = async (planCode: string) => {
    if (planCode === 'free') { window.location.href = '/builder'; return; }
    const token = localStorage.getItem('oosira_token');
    if (!token) { window.location.href = '/login?redirect=pricing'; return; }
    setIsCheckingOut(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API}/subscriptions/checkout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ billing_cycle: 'yearly', locale: language }),
      });
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
      else alert(data.detail || 'Checkout failed');
    } catch (err: any) {
      alert(err.message || 'Payment service error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const displayPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  return (
    <InfoPageShell title={language === 'ar' ? 'اختر خطتك' : language === 'en' ? 'Choose Your Plan' : 'Choisissez votre forfait'}>
      <p className="!text-[16px] !text-txt-muted !mb-12 text-center">{tr.subtitle}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose !mb-14 max-w-3xl mx-auto">
        {displayPlans.map((plan: any) => {
          const isPopular = plan.is_popular;
          const hasPrice = plan.price_da > 0;
          return (
            <div
              key={plan.code}
              className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-surface border transition-all duration-300 ${
                isPopular
                  ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/5'
                  : 'border-border hover:border-blue-500/30'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 right-6 rtl:left-6 rtl:right-auto bg-blue-600 text-white px-3 py-0.5 rounded-full font-bold text-[9px] tracking-wider uppercase shadow-md z-10">
                  {tr.popular}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  {plan.icon_type === 'sparkles'
                    ? <SparklesIcon className="w-5 h-5 text-blue-500" />
                    : <SwatchIcon className="w-5 h-5 text-emerald-500" />}
                  <h3 className="font-bold text-[18px] text-txt">{getField(plan, 'name')}</h3>
                </div>

                <p className="text-[13px] text-txt-muted mb-5 leading-relaxed">{getField(plan, 'desc')}</p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-txt">
                    {hasPrice ? `${plan.price_da} DA` : tr.free}
                  </span>
                  {hasPrice && <span className="text-[13px] text-txt-muted">{tr.month}</span>}
                </div>

                {hasPrice ? (
                  <p className="text-[12px] text-emerald-600 dark:text-emerald-400 mb-6 font-semibold">
                    {getField(plan, 'billed_text')}
                  </p>
                ) : <div className="h-5 mb-6" />}

                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((f: any, i: number) => (
                    <li key={i} className={`flex items-start gap-2.5 ${!f.is_included ? 'opacity-50' : ''}`}>
                      {f.is_included
                        ? <CheckCircleIcon className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                        : <XMarkIcon className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />}
                      <span className={`text-[13px] leading-tight ${f.is_included ? 'text-txt font-medium' : 'text-txt-muted line-through'}`}>
                        {getField(f, 'text')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(plan.code)}
                className={`w-full py-3.5 rounded-xl font-bold text-[14px] transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                  !hasPrice
                    ? 'text-txt bg-black/5 dark:bg-white/5 border border-border hover:bg-black/10 dark:hover:bg-white/10'
                    : 'text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25'
                }`}
              >
                {!hasPrice ? tr.basic : isCheckingOut ? tr.processing : tr.subscribe}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <h2>{tr.faq}</h2>
      <div className="space-y-4 not-prose">
        {[
          {
            q: language === 'ar' ? 'هل يمكنني الدفع بالدينار الجزائري؟' : language === 'en' ? 'Can I pay in Algerian Dinar?' : 'Puis-je payer en Dinar algérien ?',
            a: language === 'ar' ? 'نعم! نقبل الدفع بالدينار الجزائري عبر BaridiMob وCCP والبطاقة البنكية.' : language === 'en' ? 'Yes! We accept payment in DZD via BaridiMob, CCP, and bank card.' : 'Oui ! Nous acceptons le paiement en DZD via BaridiMob, CCP et carte bancaire.',
          },
          {
            q: language === 'ar' ? 'هل يمكنني الإلغاء في أي وقت؟' : language === 'en' ? 'Can I cancel anytime?' : 'Puis-je annuler à tout moment ?',
            a: language === 'ar' ? 'نعم، يمكنك إلغاء اشتراكك في أي وقت. ستحتفظ بالوصول حتى نهاية فترة الفوترة.' : language === 'en' ? 'Yes, you can cancel anytime. You keep access until the end of your billing period.' : 'Oui, vous pouvez annuler à tout moment. Vous conservez l\'accès jusqu\'à la fin de la période de facturation.',
          },
          {
            q: language === 'ar' ? 'ما الفرق بين الخطة المجانية والبرو؟' : language === 'en' ? 'What\'s the difference between Free and Pro?' : 'Quelle est la différence entre Gratuit et Pro ?',
            a: language === 'ar' ? 'الخطة المجانية تسمح بإنشاء سير ذاتية مع 5 تنزيلات PDF شهرياً. البرو يفتح كل القوالب والألوان والتنزيلات غير المحدودة.' : language === 'en' ? 'Free lets you build CVs with 5 PDF downloads/month. Pro unlocks all templates, colors, and unlimited downloads.' : 'Gratuit vous permet de créer des CV avec 5 téléchargements PDF/mois. Pro débloque tous les modèles, couleurs et téléchargements illimités.',
          },
        ].map((item, i) => (
          <details key={i} className="group bg-surface border border-border/50 rounded-2xl overflow-hidden">
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-[14px] font-semibold text-txt hover:bg-surface2/50 transition-colors">
              {item.q}
              <span className="text-txt-muted group-open:rotate-45 transition-transform text-lg">+</span>
            </summary>
            <div className="px-6 pb-4 text-[13px] text-txt-muted leading-relaxed">{item.a}</div>
          </details>
        ))}
      </div>
    </InfoPageShell>
  );
}
