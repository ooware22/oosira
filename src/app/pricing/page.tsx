'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import InfoPageShell from '@/components/InfoPageShell';
import { planField } from '@/data/pricingCopy';
import PlanIcon from '@/components/PlanIcon';
import {
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const TRANSLATIONS: Record<string, any> = {
  fr: {
    subtitle: "Choisissez la formule adaptée à votre recherche. Paiement unique, sans reconduction.",
    free: 'Gratuit',
    popular: 'Recommandé',
    subscribe: 'Choisir cette formule', basic: 'Commencer',
    processing: 'Traitement...',
    faq: 'Questions fréquentes',
    plansUnavailable: "Les formules ne sont pas disponibles pour le moment. Réessayez dans un instant.",
  },
  en: {
    subtitle: 'Pick the plan that fits your search. One-off payment, no auto-renewal.',
    free: 'Free',
    popular: 'Recommended',
    subscribe: 'Choose this plan', basic: 'Get Started',
    processing: 'Processing...',
    faq: 'FAQ',
    plansUnavailable: 'Plans are unavailable right now. Please try again in a moment.',
  },
  ar: {
    subtitle: 'اختر الصيغة المناسبة لبحثك. دفعة واحدة، بدون تجديد تلقائي.',
    free: 'مجاني',
    popular: 'موصى به',
    subscribe: 'اختر هذه الصيغة', basic: 'ابدأ مجاناً',
    processing: 'جاري المعالجة...',
    faq: 'الأسئلة الشائعة',
    plansUnavailable: 'الصيغ غير متاحة حالياً. يرجى المحاولة بعد قليل.',
  },
};

export default function PricingPage() {
  const { language } = useLanguage();
  const tr = TRANSLATIONS[language] || TRANSLATIONS.fr;
  const [plans, setPlans] = useState<any[]>([]);
  const [plansState, setPlansState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const getField = (obj: any, base: string) => planField(obj, base, language);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API}/subscriptions/plans/`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('empty');
        data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setPlans(data);
        setPlansState('ready');
      } catch {
        // No hardcoded prices to fall back on any more — showing a stale number
        // is worse than showing none, because the checkout would charge the
        // real one.
        setPlansState('error');
      }
    }
    fetchPlans();
  }, []);

  const handleUpgrade = async (planCode: string, priceDa: number) => {
    if (!priceDa) { window.location.href = '/builder'; return; }
    const token = localStorage.getItem('oosira_token');
    if (!token) { window.location.href = '/login?redirect=pricing'; return; }
    setIsCheckingOut(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API}/subscriptions/checkout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_code: planCode, locale: language }),
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

  const displayPlans = plans;

  return (
    <InfoPageShell title={language === 'ar' ? 'اختر خطتك' : language === 'en' ? 'Choose Your Plan' : 'Choisissez votre forfait'}>
      <p className="!text-[16px] !text-txt-muted !mb-12 text-center">{tr.subtitle}</p>

      {plansState === 'loading' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 not-prose !mb-14 max-w-5xl mx-auto">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[420px] rounded-3xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      )}

      {plansState === 'error' && (
        <p className="not-prose !mb-14 text-center text-[13px] text-txt-muted">
          {tr.plansUnavailable}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 not-prose !mb-14 max-w-5xl mx-auto">
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
                  <PlanIcon
                    type={plan.icon_type}
                    className={`w-5 h-5 shrink-0 ${isPopular ? 'text-blue-500' : 'text-emerald-500'}`}
                  />
                  <h3 className="font-bold text-[18px] text-txt">{getField(plan, 'name')}</h3>
                </div>

                <p className="text-[13px] text-txt-muted mb-5 leading-relaxed">{getField(plan, 'desc')}</p>

                {/* No "/ month" suffix: these are one-off purchases with a
                    fixed period of access, not a recurring subscription. The
                    period is stated in billed_text below. */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-txt">
                    {hasPrice ? `${plan.price_da} DA` : tr.free}
                  </span>
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
                onClick={() => handleUpgrade(plan.code, plan.price_da)}
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
            a: language === 'ar' ? 'كل القوالب ولوحات الألوان متاحة مجاناً. الفرق هو أن الخطة المجانية محدودة بـ 5 تنزيلات PDF شهرياً وتجربة واحدة للاستيراد بالذكاء الاصطناعي، بينما برو يمنحك تنزيلات واستيراد غير محدودين ودعماً ذا أولوية.' : language === 'en' ? 'All templates and color palettes are free for everyone. The difference is that Free is limited to 5 PDF downloads/month and one AI import trial, while Pro gives you unlimited downloads, unlimited AI import, and priority support.' : 'Tous les modèles et palettes de couleurs sont gratuits pour tout le monde. La différence : Gratuit est limité à 5 téléchargements PDF/mois et un essai d\'import IA, tandis que Pro offre des téléchargements et imports IA illimités, ainsi qu\'un support prioritaire.',
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
